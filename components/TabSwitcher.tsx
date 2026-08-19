import type { TabId, TabResult } from "@/types/dashboard";

const STATUS_DOT: Record<TabResult["status"], string> = {
  ok: "bg-sage-500",
  empty: "bg-ink-soft/40",
  error: "bg-blush-500",
};

export function TabSwitcher({
  tabs,
  activeTabId,
  onSelect,
}: {
  tabs: TabResult[];
  activeTabId: TabId;
  onSelect: (tabId: TabId) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 rounded-full bg-cream-100 p-1.5">
      {tabs.map((tab) => {
        const isActive = tab.tabId === activeTabId;
        const eventCount = tab.subcategories.reduce((sum, s) => sum + s.events.length, 0);
        return (
          <button
            key={tab.tabId}
            type="button"
            onClick={() => onSelect(tab.tabId)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              isActive ? "bg-ink text-cream-50 shadow-clay-sm" : "text-ink-soft hover:bg-sky-100"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${STATUS_DOT[tab.status]}`} />
            {tab.tabLabel}
            {tab.status === "ok" && (
              <span className={isActive ? "text-cream-200" : "text-ink-soft/70"}>({eventCount})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
