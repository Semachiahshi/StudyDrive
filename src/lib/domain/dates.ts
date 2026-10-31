// Calendar-date helpers. All study logic works on ISO calendar dates
// ("YYYY-MM-DD") in the owner's time zone, Europe/Prague by default.

export const APP_TIME_ZONE = "Europe/Prague";

export type IsoDate = string;

const isoFormatterCache = new Map<string, Intl.DateTimeFormat>();

/** The calendar date of `at` in the given time zone. */
export function localDate(at: Date = new Date(), timeZone = APP_TIME_ZONE): IsoDate {
  let fmt = isoFormatterCache.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    isoFormatterCache.set(timeZone, fmt);
  }
  // Assembled from parts: older engines format en-CA differently.
  const parts: Record<string, string> = {};
  for (const p of fmt.formatToParts(at)) parts[p.type] = p.value;
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function toUtcMs(date: IsoDate): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / 86_400_000);
}

export function addDays(date: IsoDate, days: number): IsoDate {
  return new Date(toUtcMs(date) + days * 86_400_000).toISOString().slice(0, 10);
}

/** ISO weekday, 1 = Monday … 7 = Sunday. */
export function isoWeekday(date: IsoDate): number {
  const day = new Date(toUtcMs(date)).getUTCDay();
  return day === 0 ? 7 : day;
}

export function isIsoDate(value: unknown): value is IsoDate {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(toUtcMs(value));
}

/**
 * Czech plural form, e.g. czPlural(3, ["den", "dny", "dní"]) → "dny".
 * Spelled out instead of Intl.PluralRules, which old Safari (iOS 12) lacks.
 */
export function czPlural(n: number, [one, few, many]: [string, string, string]): string {
  const abs = Math.abs(n);
  if (!Number.isInteger(abs)) return many;
  if (abs === 1) return one;
  if (abs >= 2 && abs <= 4) return few;
  return many;
}

export function formatDays(n: number): string {
  return `${n} ${czPlural(n, ["den", "dny", "dní"])}`;
}

export function formatSteps(n: number): string {
  return `${n} ${czPlural(n, ["krok", "kroky", "kroků"])}`;
}

export function formatTopics(n: number): string {
  return `${n} ${czPlural(n, ["téma", "témata", "témat"])}`;
}

/** "dnes", "zítra", "za 5 dní", "včera", "před 3 dny". */
export function relativeDays(from: IsoDate, to: IsoDate): string {
  const d = daysBetween(from, to);
  if (d === 0) return "dnes";
  if (d === 1) return "zítra";
  if (d === -1) return "včera";
  if (d > 0) return `za ${d} ${czPlural(d, ["den", "dny", "dní"])}`;
  const a = -d;
  return `před ${a} ${czPlural(a, ["dnem", "dny", "dny"])}`;
}

const dateFormatter = new Intl.DateTimeFormat("cs-CZ", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const shortDateFormatter = new Intl.DateTimeFormat("cs-CZ", {
  day: "numeric",
  month: "numeric",
  timeZone: "UTC",
});
const weekdayFormatter = new Intl.DateTimeFormat("cs-CZ", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

/** "3. května 2027" */
export function formatDate(date: IsoDate): string {
  return dateFormatter.format(new Date(toUtcMs(date)));
}

/** "3. 5." */
export function formatShortDate(date: IsoDate): string {
  return shortDateFormatter.format(new Date(toUtcMs(date)));
}

/** "pondělí 3. května" */
export function formatWeekdayDate(date: IsoDate): string {
  return weekdayFormatter.format(new Date(toUtcMs(date)));
}

/** A single date or a window: "3. května 2027" or "3. 5. – 6. května 2027". */
export function formatDateWindow(start: IsoDate, end?: IsoDate | null): string {
  if (!end || end === start) return formatDate(start);
  return `${formatShortDate(start)} – ${formatDate(end)}`;
}
