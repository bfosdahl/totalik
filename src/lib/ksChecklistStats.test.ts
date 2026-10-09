import { describe, it, expect } from "vitest";
import { ksChecklistStats, isKsChecklistOverdue } from "./ksChecklistStats";

// 2026-10-09T10:00:00Z = 12:00 Oslo time on 2026-10-09
const NOW = new Date("2026-10-09T10:00:00Z");

describe("isKsChecklistOverdue", () => {
  it("planned checklist with deadline yesterday is overdue", () => {
    expect(isKsChecklistOverdue({ status: "planned", deadline_date: "2026-10-08" }, NOW)).toBe(true);
  });

  it("in_progress checklist with deadline today is NOT overdue", () => {
    expect(isKsChecklistOverdue({ status: "in_progress", deadline_date: "2026-10-09" }, NOW)).toBe(false);
  });

  it("completed checklist with deadline yesterday is NOT overdue", () => {
    expect(isKsChecklistOverdue({ status: "completed", deadline_date: "2026-10-08" }, NOW)).toBe(false);
  });

  it("planned checklist without deadline is NOT overdue", () => {
    expect(isKsChecklistOverdue({ status: "planned", deadline_date: null }, NOW)).toBe(false);
  });
});

describe("ksChecklistStats", () => {
  const checklists = [
    { status: "planned", deadline_date: "2026-10-08" }, // overdue
    { status: "in_progress", deadline_date: "2026-10-09" }, // inProgress (today, not overdue)
    { status: "completed", deadline_date: "2026-10-08" }, // completed
    { status: "planned", deadline_date: null }, // planned
    { status: "rejected", deadline_date: "2026-10-01" }, // rejected: no bucket, but in total
  ];

  it("puts each checklist in exactly one exclusive bucket", () => {
    const s = ksChecklistStats(checklists, NOW);
    expect(s.overdue).toBe(1);
    expect(s.inProgress).toBe(1);
    expect(s.completed).toBe(1);
    expect(s.planned).toBe(1);
  });

  it("buckets never overlap and sum to the non-rejected count", () => {
    const s = ksChecklistStats(checklists, NOW);
    const nonRejected = checklists.filter((c) => c.status !== "rejected").length;
    expect(s.completed + s.inProgress + s.planned + s.overdue).toBe(nonRejected);
  });

  it("rejected checklists count in total but in no bucket", () => {
    const s = ksChecklistStats(checklists, NOW);
    expect(s.total).toBe(5);
  });

  it("overdue stat equals the isKsChecklistOverdue count (tile/legend consistency)", () => {
    const s = ksChecklistStats(checklists, NOW);
    const direct = checklists.filter((c) => isKsChecklistOverdue(c, NOW)).length;
    expect(s.overdue).toBe(direct);
  });

  it("keeps progressPercent and waitingPaper as before", () => {
    const s = ksChecklistStats(checklists, NOW);
    expect(s.progressPercent).toBe(Math.round((1 / 5) * 100));
    expect(s.waitingPaper).toBe(0);
    const withPaper = ksChecklistStats(
      [{ status: "planned", deadline_date: null, is_paper_version: true, paper_uploaded: false }],
      NOW,
    );
    expect(withPaper.waitingPaper).toBe(1);
  });
});
