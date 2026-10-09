/**
 * Date utilities that respect local time zone (Norway).
 *
 * IMPORTANT: Never use `new Date().toISOString().split('T')[0]` for "today"
 * when filtering or comparing against local dates — that gives the UTC date,
 * which can be off-by-one near midnight.
 */

/**
 * Returns today's date in YYYY-MM-DD format using the user's LOCAL time zone.
 * Use this whenever you need "today" for filtering/comparison against
 * locally-stored date columns (date type) or date strings.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns the start of the local day as an ISO timestamp string,
 * accounting for the local timezone offset. Useful for `gte` filters
 * on `timestamptz` columns where you want "from local midnight".
 */
export function getLocalDayStartISO(date: Date = new Date()): string {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

/**
 * Returns the end of the local day as an ISO timestamp string.
 * Useful for `lte` filters on `timestamptz` columns.
 */
export function getLocalDayEndISO(date: Date = new Date()): string {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end.toISOString();
}

const osloFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Oslo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** YYYY-MM-DD for the given instant in Europe/Oslo, independent of the browser's time zone. */
export function osloDateString(d: Date = new Date()): string {
  const parts = osloFmt.formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

const PLAIN_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function toOsloDay(target: string | Date): string | null {
  if (target instanceof Date) return isNaN(target.getTime()) ? null : osloDateString(target);
  const s = String(target).trim();
  if (!s) return null;
  if (PLAIN_DATE.test(s)) return s;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : osloDateString(d);
}

function dayUtc(day: string): number | null {
  const m = day.match(PLAIN_DATE);
  if (!m) return null;
  const v = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(v) ? null : v;
}

/**
 * Whole Oslo calendar days from today to target. Positive = future, 0 = today,
 * negative = past. Null for empty/invalid input. DST-safe.
 */
export function calendarDaysFromToday(
  target: string | Date | null | undefined,
  now: Date = new Date(),
): number | null {
  if (target === null || target === undefined) return null;
  const day = toOsloDay(target);
  if (!day) return null;
  const a = dayUtc(day);
  const b = dayUtc(osloDateString(now));
  if (a === null || b === null) return null;
  return Math.round((a - b) / 86400000);
}

/** 0 «I dag», 1 «I morgen», -1 «I går», n>1 «Om n dager», n<-1 «n dager siden». */
export function relativeDayLabel(days: number): string {
  if (days === 0) return "I dag";
  if (days === 1) return "I morgen";
  if (days === -1) return "I går";
  return days > 1 ? `Om ${days} dager` : `${-days} dager siden`;
}
