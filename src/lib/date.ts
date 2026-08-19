/**
 * Date helpers that operate in the user's local timezone.
 *
 * `toISOString()` converts to UTC, so in negative offsets (e.g. UTC-03) the
 * evening already reports the next day. Every ISO date (yyyy-MM-dd) used for
 * filters, presets and mock datasets must be derived locally to stay consistent.
 */

/** Formats a Date as a local yyyy-MM-dd string. */
export function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Local yyyy-MM-dd for today. */
export function todayLocalIsoDate(): string {
  return toLocalIsoDate(new Date());
}

/** Local yyyy-MM-dd for a date `days` before today. */
export function localIsoDaysAgo(days: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return toLocalIsoDate(d);
}
