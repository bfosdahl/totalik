/** Rene hjelpefunksjoner for timeberegning (ingen React). */

function toMinutes(t: string | null | undefined): number | null {
  if (!t) return null;
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?/.exec(String(t).trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const safeBreak = (b: number) => (Number.isFinite(b) && b > 0 ? b : 0);

/** Minutter mellom to "HH:mm"-tider; over midnatt legger til 24 t. 0 ved ugyldig. */
export function spanMinutes(from: string, to: string): number {
  const f = toMinutes(from);
  const t = toMinutes(to);
  if (f == null || t == null) return 0;
  let span = t - f;
  if (span < 0) span += 24 * 60;
  return span;
}

export function workedHoursFromSpan(from: string, to: string, breakMinutes: number): number {
  const worked = spanMinutes(from, to) - safeBreak(Number(breakMinutes));
  return worked > 0 ? round2(worked / 60) : 0;
}

/** Pause = spenn − timer. 0 hvis ingen tider, negativ eller > 180 min. */
export function breakFromSpan(from: string | null | undefined, to: string | null | undefined, hours: number): number {
  if (toMinutes(from) == null || toMinutes(to) == null) return 0;
  const diff = Math.round(spanMinutes(from as string, to as string) - (Number(hours) || 0) * 60);
  return diff > 0 && diff <= 180 ? diff : 0;
}

export function endTimeFor(start: string, hours: number, breakMinutes: number): string {
  const s = toMinutes(start) ?? 0;
  const total = Math.round(s + (Number(hours) || 0) * 60 + safeBreak(Number(breakMinutes)));
  const wrapped = ((total % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function clockWorkedHours(clockInIso: string, clockOutIso: string, breakMinutes: number): number {
  const mins = (new Date(clockOutIso).getTime() - new Date(clockInIso).getTime()) / 60000;
  if (!Number.isFinite(mins)) return 0;
  const worked = mins - safeBreak(Number(breakMinutes));
  return worked > 0 ? round2(worked / 60) : 0;
}

export function ongoingBreakMinutes(breakStartIso: string | null, breakEndIso: string | null, now: Date): number {
  if (!breakStartIso || breakEndIso) return 0;
  const mins = Math.round((now.getTime() - new Date(breakStartIso).getTime()) / 60000);
  return Number.isFinite(mins) && mins > 0 ? mins : 0;
}

export const HOUR_QUICK_PICKS = [7.5, 8, 9, 10];

export function formatHoursNo(h: number): string {
  return String(Math.round(h * 100) / 100).replace(".", ",");
}
