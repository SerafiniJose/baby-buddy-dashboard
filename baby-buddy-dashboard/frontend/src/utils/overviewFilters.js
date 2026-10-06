import { toLocalISODate } from "./formatters";

export const OVERVIEW_WINDOW_DAYS = 7;

function localDateKey(value) {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return toLocalISODate(date);
}

export function lastCalendarDayKeys(days = OVERVIEW_WINDOW_DAYS, now = new Date()) {
  const keys = new Set();
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    keys.add(toLocalISODate(d));
  }
  return keys;
}

export function isEntryInLastCalendarDays(entry, dateKeys, days = OVERVIEW_WINDOW_DAYS, now = new Date()) {
  const keys = Array.isArray(dateKeys) ? dateKeys : [dateKeys];
  const windowKeys = lastCalendarDayKeys(days, now);
  return keys.some((key) => windowKeys.has(localDateKey(entry?.[key])));
}

export function filterEntriesInLastCalendarDays(entries, dateKeys, days = OVERVIEW_WINDOW_DAYS, now = new Date()) {
  return (entries || []).filter((entry) => isEntryInLastCalendarDays(entry, dateKeys, days, now));
}

export function hasEntriesInLastCalendarDays(entries, dateKeys, days = OVERVIEW_WINDOW_DAYS, now = new Date()) {
  return filterEntriesInLastCalendarDays(entries, dateKeys, days, now).length > 0;
}
