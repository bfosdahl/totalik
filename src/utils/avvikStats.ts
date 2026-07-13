export type AvvikStatusLike =
  | "open"
  | "in_progress"
  | "in-progress"
  | "resolved"
  | "closed"
  | string;

export interface AvvikStatItem {
  status: AvvikStatusLike;
}

export interface AvvikStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
}

/** Computes the overview counters shown on the Deviations page.
 *  Accepts both "in_progress"/"in-progress" and "closed"/"resolved" spellings. */
export function computeAvvikStats(list: AvvikStatItem[] | null | undefined): AvvikStats {
  const items = Array.isArray(list) ? list : [];
  return {
    total: items.length,
    open: items.filter((d) => d.status === "open").length,
    inProgress: items.filter(
      (d) => d.status === "in_progress" || d.status === "in-progress",
    ).length,
    resolved: items.filter(
      (d) => d.status === "resolved" || d.status === "closed",
    ).length,
  };
}
