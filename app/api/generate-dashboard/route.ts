import { NextResponse } from "next/server";
import { z } from "zod";
import { generateDashboard } from "@/lib/generate-dashboard";
import { resolveWindow } from "@/lib/date-window";
import { TAB_DEFINITIONS } from "@/lib/tabs";
import type { TabId } from "@/types/dashboard";

export const maxDuration = 60;

const VALID_TAB_IDS = TAB_DEFINITIONS.map((t) => t.id) as [TabId, ...TabId[]];

const TabSelectionSchema = z.object({
  tabId: z.enum(VALID_TAB_IDS),
  subcategories: z.array(z.string()).min(1, "Each selected category needs at least one subcategory."),
});

const RequestSchema = z
  .object({
    city: z.string().trim().min(1, "City is required.").max(100),
    windowPreset: z.enum(["today-14", "weekend", "month", "custom"]),
    customStart: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "customStart must be YYYY-MM-DD.")
      .optional(),
    customEnd: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "customEnd must be YYYY-MM-DD.")
      .optional(),
    extraContext: z.string().max(3000).optional(),
    tabSelections: z.array(TabSelectionSchema).min(1, "Select at least one type of event."),
    professionalField: z.string().trim().max(100).optional(),
  })
  .refine((data) => data.windowPreset !== "custom" || (data.customStart && data.customEnd), {
    message: 'customStart and customEnd are required when windowPreset is "custom".',
    path: ["customStart"],
  })
  .refine(
    (data) =>
      data.tabSelections.every((selection) => {
        const tabDef = TAB_DEFINITIONS.find((t) => t.id === selection.tabId);
        return tabDef && selection.subcategories.every((s) => tabDef.defaultSubcategories.includes(s));
      }),
    { message: "One or more selected subcategories are not recognized.", path: ["tabSelections"] },
  )
  .refine(
    (data) =>
      !data.tabSelections.some((s) => s.tabId === "professional" || s.tabId === "networking") ||
      Boolean(data.professionalField),
    {
      message: "professionalField is required when Professional or Networking is selected.",
      path: ["professionalField"],
    },
  );

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  try {
    resolveWindow(parsed.data.windowPreset, parsed.data.customStart, parsed.data.customEnd);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid date window." },
      { status: 400 },
    );
  }

  try {
    const dashboard = await generateDashboard(parsed.data);
    return NextResponse.json(dashboard);
  } catch (err) {
    console.error("[api/generate-dashboard] unexpected failure:", err);
    return NextResponse.json({ error: "Something went wrong generating the dashboard." }, { status: 500 });
  }
}
