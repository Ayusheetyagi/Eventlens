import type { EventItem } from "@/types/dashboard";

export function EventCard({ event }: { event: EventItem }) {
  const borderClasses = event.confirmed
    ? "border-2 border-sage-300"
    : "border-2 border-dashed border-blush-300";

  return (
    <div className={`flex flex-col gap-2 rounded-3xl bg-white p-4 shadow-clay-sm ${borderClasses}`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-ink">{event.name}</h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            event.confirmed ? "bg-sage-100 text-sage-700" : "bg-blush-100 text-blush-700"
          }`}
        >
          {event.confirmed ? "Confirmed" : "Needs verification"}
        </span>
      </div>

      <div className="text-sm font-medium text-ink-soft">
        {event.date || "Date TBD"}
        {event.time ? ` · ${event.time}` : ""}
      </div>

      {event.venue && <div className="text-sm text-ink-soft">{event.venue}</div>}

      {event.description && <p className="text-sm text-ink-soft">{event.description}</p>}

      {event.conflictNote && (
        <div className="rounded-2xl bg-blush-100 px-3 py-2 text-xs text-blush-700">
          ⚠ {event.conflictNote}
        </div>
      )}

      {event.sourceUrl && (
        <a
          href={event.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 text-sm font-medium text-sky-700 underline underline-offset-2 hover:text-sky-500"
        >
          {event.sourceName || "Source"} ↗
        </a>
      )}
    </div>
  );
}
