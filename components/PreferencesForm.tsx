"use client";

import { useMemo, useState } from "react";
import type { GenerateDashboardRequest, TabId, TabSelection, WindowPreset } from "@/types/dashboard";
import { resolveWindow } from "@/lib/date-window";
import { TAB_DEFINITIONS } from "@/lib/tabs";

const PRESET_OPTIONS: { value: WindowPreset; label: string }[] = [
  { value: "today-14", label: "Today + 14 days" },
  { value: "weekend", label: "This weekend" },
  { value: "month", label: "Next month" },
  { value: "custom", label: "Custom range" },
];

type CategoryState = Record<TabId, { included: boolean; subcategories: Record<string, boolean> }>;

function initialCategoryState(): CategoryState {
  return Object.fromEntries(
    TAB_DEFINITIONS.map((tabDef) => [
      tabDef.id,
      {
        included: true,
        subcategories: Object.fromEntries(tabDef.defaultSubcategories.map((s) => [s, true])),
      },
    ]),
  ) as CategoryState;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PreferencesForm({ onSubmit }: { onSubmit: (request: GenerateDashboardRequest) => void }) {
  const [city, setCity] = useState("");
  const [windowPreset, setWindowPreset] = useState<WindowPreset>("today-14");
  const [customStart, setCustomStart] = useState(todayIso());
  const [customEnd, setCustomEnd] = useState(todayIso());
  const [extraContext, setExtraContext] = useState("");
  const [cityError, setCityError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryState>(initialCategoryState);
  const [expandedTabs, setExpandedTabs] = useState<Partial<Record<TabId, boolean>>>({});

  const previewLabel = useMemo(() => {
    try {
      if (windowPreset === "custom") {
        return resolveWindow("custom", customStart, customEnd).label;
      }
      return resolveWindow(windowPreset).label;
    } catch {
      return null;
    }
  }, [windowPreset, customStart, customEnd]);

  function toggleTab(tabId: TabId, checked: boolean) {
    setCategories((prev) => ({
      ...prev,
      [tabId]: {
        included: checked,
        subcategories: Object.fromEntries(Object.keys(prev[tabId].subcategories).map((k) => [k, checked])),
      },
    }));
  }

  function toggleSubcategory(tabId: TabId, subcategory: string, checked: boolean) {
    setCategories((prev) => {
      const nextSubs = { ...prev[tabId].subcategories, [subcategory]: checked };
      const anyChecked = Object.values(nextSubs).some(Boolean);
      return { ...prev, [tabId]: { included: anyChecked, subcategories: nextSubs } };
    });
  }

  function toggleExpanded(tabId: TabId) {
    setExpandedTabs((prev) => ({ ...prev, [tabId]: !prev[tabId] }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedCity = city.trim();
    let hasError = false;

    if (!trimmedCity) {
      setCityError("City is required.");
      hasError = true;
    } else {
      setCityError(null);
    }

    const tabSelections: TabSelection[] = TAB_DEFINITIONS.flatMap((tabDef) => {
      const state = categories[tabDef.id];
      const subcategories = tabDef.defaultSubcategories.filter((s) => state.subcategories[s]);
      return state.included && subcategories.length > 0 ? [{ tabId: tabDef.id, subcategories }] : [];
    });

    if (tabSelections.length === 0) {
      setCategoryError("Select at least one type of event.");
      hasError = true;
    } else {
      setCategoryError(null);
    }

    if (hasError) return;

    onSubmit({
      city: trimmedCity,
      windowPreset,
      ...(windowPreset === "custom" ? { customStart, customEnd } : {}),
      ...(extraContext.trim() ? { extraContext: extraContext.trim() } : {}),
      tabSelections,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-md flex-col gap-6 rounded-[2rem] bg-cream-50 p-8 shadow-clay"
    >
      <div>
        <h1 className="text-2xl font-bold text-ink">Events Dashboard</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Real, date-verified local events — searched live, no guessed dates.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="city" className="text-sm font-medium text-ink">
          City
        </label>
        <input
          id="city"
          type="text"
          autoFocus
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="e.g. Dubai, Austin, Lisbon"
          className="rounded-2xl border border-cream-300 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-300"
        />
        {cityError && <p className="text-sm text-blush-700">{cityError}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-ink">Time window</span>
        <div className="grid grid-cols-2 gap-2">
          {PRESET_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setWindowPreset(opt.value)}
              className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                windowPreset === opt.value
                  ? "bg-sage-500 text-white shadow-clay-sm"
                  : "bg-cream-100 text-ink-soft hover:bg-sage-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {windowPreset === "custom" && (
          <div className="mt-1 grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="customStart" className="text-xs text-ink-soft">
                Start
              </label>
              <input
                id="customStart"
                type="date"
                min={todayIso()}
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="rounded-2xl border border-cream-300 bg-white px-3 py-2 text-sm text-ink"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="customEnd" className="text-xs text-ink-soft">
                End
              </label>
              <input
                id="customEnd"
                type="date"
                min={customStart}
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="rounded-2xl border border-cream-300 bg-white px-3 py-2 text-sm text-ink"
              />
            </div>
          </div>
        )}

        {previewLabel && <p className="text-xs text-ink-soft">Window: {previewLabel}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-ink">What kind of events?</span>
        <div className="flex flex-col gap-1.5 rounded-2xl bg-cream-100 p-2">
          {TAB_DEFINITIONS.map((tabDef) => {
            const state = categories[tabDef.id];
            const isExpanded = Boolean(expandedTabs[tabDef.id]);
            const checkedCount = Object.values(state.subcategories).filter(Boolean).length;

            return (
              <div key={tabDef.id} className="rounded-xl bg-white">
                <div className="flex items-center gap-2 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={state.included}
                    onChange={(e) => toggleTab(tabDef.id, e.target.checked)}
                    className="h-4 w-4 shrink-0 accent-sage-500"
                  />
                  <button
                    type="button"
                    onClick={() => toggleExpanded(tabDef.id)}
                    className="flex flex-1 items-center justify-between gap-2 text-left"
                  >
                    <span className="text-sm font-medium text-ink">{tabDef.label}</span>
                    <span className="flex items-center gap-1.5 text-xs text-ink-soft">
                      {checkedCount}/{tabDef.defaultSubcategories.length}
                      <span className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}>⌄</span>
                    </span>
                  </button>
                </div>

                {isExpanded && (
                  <div className="flex flex-col gap-1 px-3 pb-2.5 pl-9">
                    {tabDef.defaultSubcategories.map((subcategory) => (
                      <label
                        key={subcategory}
                        className="flex items-center gap-2 text-sm text-ink-soft"
                      >
                        <input
                          type="checkbox"
                          checked={state.subcategories[subcategory]}
                          onChange={(e) => toggleSubcategory(tabDef.id, subcategory, e.target.checked)}
                          className="h-3.5 w-3.5 shrink-0 accent-sage-500"
                        />
                        {subcategory}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {categoryError && <p className="text-sm text-blush-700">{categoryError}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="extraContext" className="text-sm font-medium text-ink">
          Paste a newsletter or digest for extra context <span className="text-ink-soft/70">(optional)</span>
        </label>
        <textarea
          id="extraContext"
          rows={3}
          value={extraContext}
          onChange={(e) => setExtraContext(e.target.value.slice(0, 3000))}
          placeholder="Paste a Luma / Eventbrite / Meetup digest email here to help ground the search…"
          className="resize-none rounded-2xl border border-cream-300 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-300"
        />
      </div>

      <button
        type="submit"
        className="rounded-full bg-ink px-4 py-3 text-sm font-semibold text-cream-50 shadow-clay-sm transition-colors hover:bg-sage-700"
      >
        Build my dashboard
      </button>
    </form>
  );
}
