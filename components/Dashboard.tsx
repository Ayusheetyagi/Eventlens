"use client";

import { useState } from "react";
import type { DashboardResponse, TabId } from "@/types/dashboard";
import { TabSwitcher } from "@/components/TabSwitcher";
import { SubcategorySection } from "@/components/SubcategorySection";
import { StatusFooter } from "@/components/StatusFooter";

export function Dashboard({
  dashboard,
  onRegenerate,
  isRegenerating,
}: {
  dashboard: DashboardResponse;
  onRegenerate: () => void;
  isRegenerating: boolean;
}) {
  const [activeTabId, setActiveTabId] = useState<TabId>(dashboard.tabs[0]?.tabId ?? "professional");
  const activeTab = dashboard.tabs.find((t) => t.tabId === activeTabId) ?? dashboard.tabs[0];

  return (
    <div className="flex w-full max-w-5xl flex-col gap-6 rounded-[2.5rem] bg-cream-50 p-6 shadow-clay  sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Events in {dashboard.city}</h1>
          <p className="text-sm text-ink-soft">{dashboard.windowLabel}</p>
        </div>
        <button
          type="button"
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="rounded-full bg-cream-100 px-4 py-2 text-sm font-medium text-ink hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRegenerating ? "Regenerating…" : "Regenerate"}
        </button>
      </header>

      <TabSwitcher tabs={dashboard.tabs} activeTabId={activeTabId} onSelect={setActiveTabId} />

      <div className="flex flex-col gap-6">
        {activeTab?.status === "error" && (
          <p className="rounded-2xl bg-blush-100 px-4 py-3 text-sm text-blush-700">
            {activeTab.errorMessage}
          </p>
        )}
        {activeTab?.status === "empty" && (
          <p className="rounded-2xl bg-cream-100 px-4 py-3 text-sm text-ink-soft">
            No events found in this category for the selected window.
          </p>
        )}
        {activeTab?.subcategories.map((group) => (
          <SubcategorySection key={group.subcategory} group={group} />
        ))}
      </div>

      <StatusFooter tabs={dashboard.tabs} />
    </div>
  );
}
