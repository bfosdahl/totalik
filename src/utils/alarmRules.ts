/**
 * Rene regler for frist-alarmer (avvik + KS bygg egenkontroller).
 * Speiler filtreringen som edge-funksjonene
 * `check-deviation-deadlines` og `check-ks2-deadlines` bruker,
 * slik at reglene kan regressjonstestes uten nettverk/DB.
 */

export type ReminderType =
  | "overdue"
  | "day_of"
  | "day_before"
  | "three_days"
  | "week_before";

export interface AlarmCandidate {
  id: string;
  company_id: string | null;
  status: string;
  due_date: string | null;
  assignee_id: string | null;
  is_deleted?: boolean | null;
}

export const DEVIATION_ACTIVE_STATUSES = ["open", "in-progress"] as const;
export const KS2_ACTIVE_STATUSES = ["planned", "in_progress"] as const;

/** Antall dager fra `today` til `dueDate` (begge normalisert til midnatt). */
export function daysUntilDue(dueDate: string, today: Date): number {
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const base = new Date(today);
  base.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - base.getTime()) / (1000 * 60 * 60 * 24));
}

/** Hvilken påminnelsestype (om noen) skal sendes for gitt antall dager. */
export function resolveReminderType(days: number): ReminderType | null {
  if (days < 0) return "overdue";
  if (days === 0) return "day_of";
  if (days === 1) return "day_before";
  if (days <= 3) return "three_days";
  if (days === 7) return "week_before";
  return null;
}

/**
 * Kan det i det hele tatt sendes alarm for denne raden?
 * Soft-slettede rader, rader uten frist, uten ansvarlig,
 * uten company_id eller med inaktiv status skal aldri varsles.
 */
export function isAlarmEligible(
  row: AlarmCandidate,
  activeStatuses: readonly string[],
): boolean {
  if (row.is_deleted === true) return false;
  if (!row.due_date) return false;
  if (!row.assignee_id) return false;
  if (!row.company_id) return false;
  return activeStatuses.includes(row.status);
}

/** Alarmer for én bedrift — aldri på tvers av bedrifter. */
export function selectAlarms(
  rows: AlarmCandidate[],
  options: {
    companyId: string;
    today: Date;
    activeStatuses: readonly string[];
  },
): Array<{ id: string; reminderType: ReminderType }> {
  return rows
    .filter((row) => row.company_id === options.companyId)
    .filter((row) => isAlarmEligible(row, options.activeStatuses))
    .map((row) => ({
      id: row.id,
      reminderType: resolveReminderType(
        daysUntilDue(row.due_date as string, options.today),
      ),
    }))
    .filter(
      (r): r is { id: string; reminderType: ReminderType } =>
        r.reminderType !== null,
    );
}
