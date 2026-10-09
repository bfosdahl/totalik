import { isBeforeToday } from "@/lib/dateUtils";

export interface KsChecklistLike {
  status: string;
  deadline_date?: string | null;
  is_paper_version?: boolean;
  paper_uploaded?: boolean;
}

/**
 * One single overdue definition for KS checklists:
 * not completed, has a deadline, and the deadline is before today's Oslo calendar day.
 */
export function isKsChecklistOverdue(c: KsChecklistLike, now: Date = new Date()): boolean {
  return c.status !== "completed" && !!c.deadline_date && isBeforeToday(c.deadline_date, now);
}

export interface KsChecklistStats {
  total: number;
  completed: number;
  inProgress: number;
  planned: number;
  overdue: number;
  waitingPaper: number;
  progressPercent: number;
}

/**
 * Stats for KS checklists. completed / inProgress / planned / overdue are
 * MUTUALLY EXCLUSIVE buckets of the non-rejected checklists, so they always
 * add up (overdue checklists are not also counted as planned/inProgress).
 */
export function ksChecklistStats(checklists: KsChecklistLike[], now: Date = new Date()): KsChecklistStats {
  const total = checklists.length;
  let completed = 0;
  let inProgress = 0;
  let planned = 0;
  let overdue = 0;

  for (const c of checklists) {
    if (c.status === "rejected") continue;
    if (c.status === "completed") {
      completed++;
    } else if (isKsChecklistOverdue(c, now)) {
      overdue++;
    } else if (c.status === "in_progress") {
      inProgress++;
    } else if (c.status === "planned") {
      planned++;
    }
  }

  return {
    total,
    completed,
    inProgress,
    planned,
    overdue,
    waitingPaper: checklists.filter((c) => c.is_paper_version && !c.paper_uploaded).length,
    progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}
