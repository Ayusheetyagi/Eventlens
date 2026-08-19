import type { SubcategoryGroup } from "@/types/dashboard";
import { EventCard } from "@/components/EventCard";

export function SubcategorySection({ group }: { group: SubcategoryGroup }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
        {group.subcategory}
      </h3>
      {group.events.length === 0 ? (
        <p className="text-sm text-ink-soft">
          No events found in this subcategory for the selected window.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {group.events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  );
}
