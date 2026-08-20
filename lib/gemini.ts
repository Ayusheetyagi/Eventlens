import "server-only";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { withRetry } from "@/lib/with-retry";
import { TAB_DEFINITIONS } from "@/lib/tabs";
import type { TabId } from "@/types/dashboard";

const EventSchema = z.object({
  name: z.string(),
  date: z.string(),
  time: z.string(),
  venue: z.string(),
  description: z.string(),
  sourceUrl: z.string(),
  sourceName: z.string(),
  confirmed: z.boolean(),
  recurring: z.boolean(),
  conflictNote: z.string().nullable(),
});

const TabSearchResponseSchema = z.object({
  subcategories: z.array(
    z.object({
      subcategory: z.string(),
      events: z.array(EventSchema),
    }),
  ),
});

export type TabSearchResponse = z.infer<typeof TabSearchResponseSchema>;

const TAB_JSON_SCHEMA = {
  type: "object",
  properties: {
    subcategories: {
      type: "array",
      items: {
        type: "object",
        properties: {
          subcategory: { type: "string" },
          events: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                date: { type: "string" },
                time: { type: "string" },
                venue: { type: "string" },
                description: { type: "string" },
                sourceUrl: { type: "string" },
                sourceName: { type: "string" },
                confirmed: { type: "boolean" },
                recurring: { type: "boolean" },
                conflictNote: { type: ["string", "null"] },
              },
              required: [
                "name",
                "date",
                "time",
                "venue",
                "description",
                "sourceUrl",
                "sourceName",
                "confirmed",
                "recurring",
                "conflictNote",
              ],
              additionalProperties: false,
            },
          },
        },
        required: ["subcategory", "events"],
        additionalProperties: false,
      },
    },
  },
  required: ["subcategories"],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT_TEMPLATE = `You are a meticulous local-events researcher. You always ground your \
answers in real, current web search results and never invent or guess facts, especially dates.

Rules — follow exactly:
1. confirmed=true only if you found an explicit, specific date (and time, if stated) for this exact \
event occurrence, stated by a source. A recurring description like "meets every Thursday" or "weekly \
happy hour" with no specific date given is NOT enough — set confirmed=false.
2. Exclude entirely anything dated before today ({CURRENT_DATE}) or after {WINDOW_END}. Only include \
events dated between {WINDOW_START} and {WINDOW_END} inclusive. Do not include something "just in \
case" if you're unsure it's in range — leave it out.
3. If a source states a recurrence rule with a specific weekday or day-of-month pattern (e.g. "every \
Thursday", "first Saturday of the month"), compute the actual upcoming calendar date(s) that fall \
within the window using {CURRENT_DATE} as today's real date, and report those resolved dates with \
confirmed=true. If a source only vaguely gestures at recurrence without a specific rule, treat it as \
unconfirmed instead of guessing a date — do not leave "date" as a guess; leave it as the best \
available label (e.g. "Thursdays, day varies") and set confirmed=false.
4. Group events by the subcategory headers you're given — never return a flat list.
5. If two credible sources disagree about the day/date of the same recurring event, set \
confirmed=false and fill conflictNote describing the disagreement in one short sentence (e.g. "Venue \
site says Tuesdays; Eventbrite listing says Wednesdays."). Otherwise conflictNote must be null.
6. Every event must include a real sourceUrl you found via search — never fabricate a URL. If you \
can't find a working source link for an event, omit that event entirely rather than including it \
without one.
7. Only include events open to the general public (or that clearly state how to register/buy \
tickets), taking place in or very near the given city.

Return only the structured data — no commentary.`;

function buildSystemPrompt(currentDate: string, windowStart: string, windowEnd: string): string {
  return SYSTEM_PROMPT_TEMPLATE.replace(/{CURRENT_DATE}/g, currentDate)
    .replace(/{WINDOW_START}/g, windowStart)
    .replace(/{WINDOW_END}/g, windowEnd);
}

function buildUserPrompt(params: {
  city: string;
  windowStart: string;
  windowEnd: string;
  currentDate: string;
  tabLabel: string;
  subcategories: string[];
  extraContext?: string;
  professionalField?: string;
}): string {
  const extraBlock = params.extraContext?.trim()
    ? `\nThe user also pasted this text (e.g. from a newsletter) — treat it as a hint of \
sources/events to check, not as ground truth; verify independently via search:\n"""\n${params.extraContext
        .trim()
        .slice(0, 3000)}\n"""\n`
    : "";

  const fieldBlock = params.professionalField?.trim()
    ? `\nThe user works in this field/industry: "${params.professionalField.trim().slice(0, 100)}". \
Strongly prioritize events relevant to this specific field (talks, meetups, conferences, job fairs in \
or clearly adjacent to it) over generic cross-industry ones. Only fall back to broader, \
field-agnostic professional events if field-specific ones are genuinely scarce for this window.\n`
    : "";

  return `City: ${params.city}
Date window: ${params.windowStart} to ${params.windowEnd} inclusive (today is ${params.currentDate}).
Tab: ${params.tabLabel}
Cover these subcategories (use them as your subcategory headers; you may add one more only if a \
locally significant category clearly doesn't fit, but do not invent narrow one-off subcategories): \
${params.subcategories.join(", ")}.
${fieldBlock}${extraBlock}
Search the web for real, current listings (event pages, ticketing sites, venue calendars, local \
news, community boards) for each subcategory above, in ${params.city}, within the date window. For \
each subcategory, return the distinct events you find (up to about 8 per subcategory, prioritizing \
the soonest and most concretely-dated ones). Follow the system rules exactly, especially about \
confirmed dates and excluding out-of-window or past events. If a subcategory has no qualifying \
events in the window, return it with an empty events array rather than omitting it.`;
}

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const err = new Error(`${label} timed out after ${ms}ms`);
      err.name = "TimeoutError";
      reject(err);
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

export async function callGeminiForTab(params: {
  tabId: TabId;
  city: string;
  windowStart: string;
  windowEnd: string;
  subcategories: string[];
  extraContext?: string;
  professionalField?: string;
}): Promise<TabSearchResponse> {
  const tabDef = TAB_DEFINITIONS.find((t) => t.id === params.tabId);
  if (!tabDef) throw new Error(`Unknown tab id: ${params.tabId}`);
  if (params.subcategories.length === 0) {
    throw new Error(`No subcategories selected for tab: ${params.tabId}`);
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const currentDate = new Date().toISOString().slice(0, 10);
  const userPrompt = buildUserPrompt({
    city: params.city,
    windowStart: params.windowStart,
    windowEnd: params.windowEnd,
    currentDate,
    tabLabel: tabDef.label,
    subcategories: params.subcategories,
    extraContext: params.extraContext,
    professionalField: params.professionalField,
  });

  const response = await withRetry(() =>
    withTimeout(
      client.models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-flash-latest",
        contents: userPrompt,
        config: {
          systemInstruction: buildSystemPrompt(currentDate, params.windowStart, params.windowEnd),
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseJsonSchema: TAB_JSON_SCHEMA,
        },
      }),
      45000,
      `Gemini call for tab ${params.tabId}`,
    ),
  );

  console.log(`[gemini] tab=${params.tabId} usage:`, response.usageMetadata);

  if (response.promptFeedback?.blockReason) {
    throw new Error("The model declined to process this request.");
  }

  const text = response.text;
  if (!text) {
    throw new Error("Model did not return a response.");
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("Model response was not valid JSON.");
  }

  const parsed = TabSearchResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Model did not return a schema-conformant response.");
  }

  return parsed.data;
}
