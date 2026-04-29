/**
 * AML §10-8 Sunday work compliance helpers.
 *
 * The law requires that an employee gets every other Sunday off.
 * In practice we treat 2 consecutive worked Sundays as a "risk",
 * and 3+ consecutive worked Sundays as a "breach" (unless the
 * employer has a written §10-8(4) 26-week averaging agreement).
 */

import { supabase } from "@/integrations/supabase/client";
import { getLocalDateString } from "@/lib/dateUtils";

export type SundayStatus = "ok" | "risk" | "breach";

export interface SundayHistoryRow {
  employee_id: string;
  employee_name: string;
  worked_sundays: string[]; // YYYY-MM-DD list within window
  total_sundays_in_window: number;
  consecutive_at_end: number; // current run leading up to "today"
  longest_consecutive: number;
  status: SundayStatus;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function isSunday(dateStr: string): boolean {
  // Parse as local date — append T00:00 to avoid UTC shift
  const d = new Date(`${dateStr}T00:00:00`);
  return d.getDay() === 0;
}

function diffInWeeks(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00`).getTime();
  const db = new Date(`${b}T00:00:00`).getTime();
  return Math.round(Math.abs(da - db) / (DAY_MS * 7));
}

/**
 * Check whether scheduling an employee on the given Sunday would
 * conflict with AML §10-8 (every other Sunday off).
 *
 * Looks back at the company's `work_schedules` (planned + actual)
 * for the 2 preceding Sundays.
 */
export async function checkSundayConflictForEmployee(args: {
  companyId: string;
  employeeId: string;
  scheduleDate: string; // YYYY-MM-DD
}): Promise<{
  isSunday: boolean;
  status: SundayStatus;
  previousSundaysWorked: string[];
  message: string | null;
}> {
  const { companyId, employeeId, scheduleDate } = args;

  if (!isSunday(scheduleDate)) {
    return { isSunday: false, status: "ok", previousSundaysWorked: [], message: null };
  }

  // Look back 21 days (covers the 2 previous Sundays + buffer)
  const target = new Date(`${scheduleDate}T00:00:00`);
  const lookbackStart = new Date(target.getTime() - 21 * DAY_MS);
  const lookbackStartStr = getLocalDateString(lookbackStart);
  // up to (but not including) the target date itself
  const dayBefore = new Date(target.getTime() - DAY_MS);
  const lookbackEndStr = getLocalDateString(dayBefore);

  const { data, error } = await supabase
    .from("work_schedules")
    .select("schedule_date")
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .gte("schedule_date", lookbackStartStr)
    .lte("schedule_date", lookbackEndStr);

  if (error) {
    console.error("Sunday compliance lookup failed:", error);
    return { isSunday: true, status: "ok", previousSundaysWorked: [], message: null };
  }

  const workedSundays = (data || [])
    .map((row) => row.schedule_date as string)
    .filter((d) => isSunday(d));

  const uniqueSundays = Array.from(new Set(workedSundays)).sort();

  // Check the 2 Sundays immediately preceding the target
  const prevSunday1 = getLocalDateString(new Date(target.getTime() - 7 * DAY_MS));
  const prevSunday2 = getLocalDateString(new Date(target.getTime() - 14 * DAY_MS));

  const workedPrev1 = uniqueSundays.includes(prevSunday1);
  const workedPrev2 = uniqueSundays.includes(prevSunday2);

  let status: SundayStatus = "ok";
  let message: string | null = null;

  if (workedPrev1 && workedPrev2) {
    status = "breach";
    message =
      "⚠️ Brudd på AML §10-8: Den ansatte har jobbet de 2 foregående søndagene. Loven krever fri annenhver søndag (med mindre dere har skriftlig avtale om 26-ukers gjennomsnitt etter §10-8(4)).";
  } else if (workedPrev1) {
    status = "risk";
    message =
      "ℹ️ Den ansatte jobbet forrige søndag. Pass på at neste søndag er fri (AML §10-8 – fri annenhver søndag).";
  }

  return {
    isSunday: true,
    status,
    previousSundaysWorked: uniqueSundays,
    message,
  };
}

/**
 * Build a 26-week Sunday history per employee for AML §10-8 reporting.
 */
export async function buildSundayReport(args: {
  companyId: string;
  weeks?: number; // default 26
}): Promise<SundayHistoryRow[]> {
  const { companyId, weeks = 26 } = args;
  const today = new Date();
  const start = new Date(today.getTime() - weeks * 7 * DAY_MS);
  const startStr = getLocalDateString(start);
  const endStr = getLocalDateString(today);

  const { data, error } = await supabase
    .from("work_schedules")
    .select("employee_id, employee_name, schedule_date")
    .eq("company_id", companyId)
    .gte("schedule_date", startStr)
    .lte("schedule_date", endStr);

  if (error) {
    console.error("Sunday report query failed:", error);
    return [];
  }

  // Total Sundays in window (for context)
  const totalSundays = (() => {
    let n = 0;
    for (let t = start.getTime(); t <= today.getTime(); t += DAY_MS) {
      if (new Date(t).getDay() === 0) n++;
    }
    return n;
  })();

  const byEmployee = new Map<string, { name: string; sundays: Set<string> }>();
  for (const row of data || []) {
    const dateStr = row.schedule_date as string;
    if (!isSunday(dateStr)) continue;
    const id = row.employee_id as string;
    if (!byEmployee.has(id)) {
      byEmployee.set(id, { name: (row.employee_name as string) || "Ukjent", sundays: new Set() });
    }
    byEmployee.get(id)!.sundays.add(dateStr);
  }

  const result: SundayHistoryRow[] = [];

  for (const [employeeId, { name, sundays }] of byEmployee) {
    const sortedSundays = Array.from(sundays).sort();

    // Compute longest run of consecutive Sundays (7 days apart)
    let longest = 0;
    let current = 0;
    for (let i = 0; i < sortedSundays.length; i++) {
      if (i === 0) {
        current = 1;
      } else if (diffInWeeks(sortedSundays[i - 1], sortedSundays[i]) === 1) {
        current += 1;
      } else {
        current = 1;
      }
      if (current > longest) longest = current;
    }

    // Consecutive run anchored at the most recently worked Sunday
    let consecutiveAtEnd = 0;
    for (let i = sortedSundays.length - 1; i >= 0; i--) {
      if (i === sortedSundays.length - 1) {
        consecutiveAtEnd = 1;
      } else if (diffInWeeks(sortedSundays[i], sortedSundays[i + 1]) === 1) {
        consecutiveAtEnd += 1;
      } else {
        break;
      }
    }

    let status: SundayStatus = "ok";
    if (longest >= 3) status = "breach";
    else if (longest === 2) status = "risk";

    result.push({
      employee_id: employeeId,
      employee_name: name,
      worked_sundays: sortedSundays,
      total_sundays_in_window: totalSundays,
      consecutive_at_end: consecutiveAtEnd,
      longest_consecutive: longest,
      status,
    });
  }

  // Sort: breach first, then risk, then ok; alphabetical inside
  const order: Record<SundayStatus, number> = { breach: 0, risk: 1, ok: 2 };
  result.sort((a, b) => {
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return a.employee_name.localeCompare(b.employee_name);
  });

  return result;
}
