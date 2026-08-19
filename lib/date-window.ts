import type { WindowPreset } from "@/types/dashboard";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_CUSTOM_SPAN_DAYS = 60;

export interface ResolvedWindow {
  start: Date;
  end: Date;
  label: string;
}

function startOfTodayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function parseDateOnly(value: string): Date {
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: "${value}"`);
  }
  return parsed;
}

function laterOf(a: Date, b: Date): Date {
  return a.getTime() > b.getTime() ? a : b;
}

export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function formatWindowLabel(start: Date, end: Date): string {
  const startYear = start.getUTCFullYear();
  const endYear = end.getUTCFullYear();
  const dayMonth = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  const dayMonthYear = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  const startLabel = startYear === endYear ? dayMonth.format(start) : dayMonthYear.format(start);
  const endLabel = dayMonthYear.format(end);
  return `${startLabel} – ${endLabel}`;
}

function resolveWeekend(today: Date): { start: Date; end: Date } {
  const dayOfWeek = today.getUTCDay(); // 0 = Sun, 6 = Sat
  if (dayOfWeek === 0) {
    // Already Sunday — "this weekend" is just today.
    return { start: today, end: today };
  }
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7;
  const saturday = addDays(today, daysUntilSaturday);
  const sunday = addDays(saturday, 1);
  return { start: laterOf(saturday, today), end: sunday };
}

export function resolveWindow(
  preset: WindowPreset,
  customStart?: string,
  customEnd?: string,
): ResolvedWindow {
  const today = startOfTodayUTC();
  let start: Date;
  let end: Date;

  switch (preset) {
    case "today-14":
      start = today;
      end = addDays(today, 14);
      break;
    case "weekend": {
      const weekend = resolveWeekend(today);
      start = weekend.start;
      end = weekend.end;
      break;
    }
    case "month":
      start = today;
      end = addDays(today, 30);
      break;
    case "custom": {
      if (!customStart || !customEnd) {
        throw new Error("Custom window requires both customStart and customEnd.");
      }
      const parsedStart = laterOf(parseDateOnly(customStart), today);
      let parsedEnd = parseDateOnly(customEnd);
      if (parsedEnd.getTime() < parsedStart.getTime()) {
        throw new Error("customEnd must not be before customStart.");
      }
      const maxEnd = addDays(parsedStart, MAX_CUSTOM_SPAN_DAYS);
      if (parsedEnd.getTime() > maxEnd.getTime()) {
        parsedEnd = maxEnd;
      }
      start = parsedStart;
      end = parsedEnd;
      break;
    }
    default:
      throw new Error(`Unknown window preset: ${preset satisfies never}`);
  }

  return { start, end, label: formatWindowLabel(start, end) };
}
