import type { TabResult } from "@/types/dashboard";

export function StatusFooter({ tabs }: { tabs: TabResult[] }) {
  return (
    <footer className="flex flex-col gap-2 rounded-3xl bg-cream-100 p-5 text-sm text-ink-soft">
      <h4 className="font-semibold text-ink">Status by category</h4>
      <ul className="flex flex-col gap-1">
        {tabs.map((tab) => (
          <li key={tab.tabId} className="flex gap-2">
            <span className="font-medium text-ink">{tab.tabLabel}:</span>
            <span>{tab.status === "error" ? tab.errorMessage : tab.statusNote}</span>
          </li>
        ))}
      </ul>
    </footer>
  );
}
