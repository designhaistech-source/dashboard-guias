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

/** Formats "yyyy-MM-dd" as "dd/MM/yyyy" without timezone shifts. */
export function formatIsoToBr(iso?: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

/**
 * Full date with weekday: "qua., 19/08/2026". Used wherever a single day is
 * referenced (KPIs, tooltips) so the page keeps one date style.
 */
export function formatIsoToBrFull(iso?: string): string {
  const short = formatIsoToBr(iso);
  if (!short || !iso) return short;
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return short;
  const weekday = date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
  return `${weekday}., ${short}`;
}

/** Fixed timezone label shared by indicators and charts, e.g. "Horário local (UTC-03:00)". */
export function localTimeZoneLabel(): string {
  const offsetMinutes = -new Date().getTimezoneOffset();
  const sign = offsetMinutes < 0 ? "-" : "+";
  const abs = Math.abs(offsetMinutes);
  const hh = `${Math.floor(abs / 60)}`.padStart(2, "0");
  const mm = `${abs % 60}`.padStart(2, "0");
  return `Horário local (UTC${sign}${hh}:${mm})`;
}
