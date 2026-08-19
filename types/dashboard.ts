export type TabId =
  | "professional"
  | "social"
  | "networking"
  | "fitness"
  | "family"
  | "arts";

export type WindowPreset = "today-14" | "weekend" | "month" | "custom";

export type TabStatus = "ok" | "empty" | "error";

export interface EventItem {
  id: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  description: string;
  sourceUrl: string;
  sourceName: string;
  confirmed: boolean;
  recurring: boolean;
  conflictNote: string | null;
}

export interface SubcategoryGroup {
  subcategory: string;
  events: EventItem[];
}

export interface TabResult {
  tabId: TabId;
  tabLabel: string;
  status: TabStatus;
  subcategories: SubcategoryGroup[];
  statusNote: string;
  errorMessage?: string;
}

export interface DashboardResponse {
  city: string;
  windowStart: string;
  windowEnd: string;
  windowLabel: string;
  generatedAt: string;
  tabs: TabResult[];
}

export interface TabSelection {
  tabId: TabId;
  subcategories: string[];
}

export interface GenerateDashboardRequest {
  city: string;
  windowPreset: WindowPreset;
  customStart?: string;
  customEnd?: string;
  extraContext?: string;
  tabSelections: TabSelection[];
}
