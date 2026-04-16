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
