import "server-only";
import { TAB_DEFINITIONS } from "@/lib/tabs";
import { resolveWindow, formatDateOnly } from "@/lib/date-window";
import { callGeminiForTab, type TabSearchResponse } from "@/lib/gemini";
import type {
  DashboardResponse,
  GenerateDashboardRequest,
  SubcategoryGroup,
  TabResult,
} from "@/types/dashboard";

function buildStatusNote(subcategories: SubcategoryGroup[]): string {
  const allEvents = subcategories.flatMap((s) => s.events);
  if (allEvents.length === 0) {
    return "No events found in this category for the selected window.";
  }
  const confirmedCount = allEvents.filter((e) => e.confirmed).length;
  const unconfirmedCount = allEvents.length - confirmedCount;
  const parts: string[] = [];
  if (confirmedCount > 0) parts.push(`${confirmedCount} confirmed`);
  if (unconfirmedCount > 0) parts.push(`${unconfirmedCount} need${unconfirmedCount === 1 ? "s" : ""} verification`);
  return `${parts.join(", ")}.`;
}

function toSubcategoryGroups(tabId: string, tabResponse: TabSearchResponse): SubcategoryGroup[] {
  return tabResponse.subcategories.map((group, subcatIndex) => ({
    subcategory: group.subcategory,
    events: group.events.map((event, eventIndex) => ({
      ...event,
      id: `${tabId}-${subcatIndex}-${eventIndex}`,
    })),
  }));
}

const DISPATCH_STAGGER_MS = 400;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateDashboard(request: GenerateDashboardRequest): Promise<DashboardResponse> {
  const { start, end, label } = resolveWindow(request.windowPreset, request.customStart, request.customEnd);
  const windowStart = formatDateOnly(start);
  const windowEnd = formatDateOnly(end);

  const settled = await Promise.allSettled(
    request.tabSelections.map(async (selection, index) => {
      if (index > 0) await delay(index * DISPATCH_STAGGER_MS);
      return callGeminiForTab({
        tabId: selection.tabId,
        city: request.city,
        windowStart,
        windowEnd,
        subcategories: selection.subcategories,
        extraContext: request.extraContext,
      });
    }),
  );

  const tabs: TabResult[] = settled.map((result, index) => {
    const selection = request.tabSelections[index];
    const tabDef = TAB_DEFINITIONS.find((t) => t.id === selection.tabId);
    const tabLabel = tabDef?.label ?? selection.tabId;

    if (result.status === "rejected") {
      console.error(`[generate-dashboard] tab=${selection.tabId} failed:`, result.reason);
      return {
        tabId: selection.tabId,
        tabLabel,
        status: "error",
        subcategories: [],
        statusNote: "Couldn't load this category right now.",
        errorMessage: "Couldn't load this category right now. Try regenerating the dashboard.",
      };
    }

    const subcategories = toSubcategoryGroups(selection.tabId, result.value);
    const totalEvents = subcategories.reduce((sum, s) => sum + s.events.length, 0);

    return {
      tabId: selection.tabId,
      tabLabel,
      status: totalEvents > 0 ? "ok" : "empty",
      subcategories,
      statusNote: buildStatusNote(subcategories),
    };
  });

  return {
    city: request.city,
    windowStart,
    windowEnd,
    windowLabel: label,
    generatedAt: new Date().toISOString(),
    tabs,
  };
}
