import { describe, it, expect } from "vitest";
import { computeAvvikStats } from "@/utils/avvikStats";

describe("computeAvvikStats", () => {
  it("returns zeros for empty/null input", () => {
    expect(computeAvvikStats([])).toEqual({ total: 0, open: 0, inProgress: 0, resolved: 0 });
    expect(computeAvvikStats(null)).toEqual({ total: 0, open: 0, inProgress: 0, resolved: 0 });
  });

  it("counts statuses across both spellings", () => {
    const s = computeAvvikStats([
      { status: "open" },
      { status: "open" },
      { status: "in_progress" },
      { status: "in-progress" },
      { status: "closed" },
      { status: "resolved" },
      { status: "unknown" },
    ]);
    expect(s).toEqual({ total: 7, open: 2, inProgress: 2, resolved: 2 });
  });

  it("does not double-count", () => {
    const s = computeAvvikStats([{ status: "closed" }]);
    expect(s.total).toBe(1);
    expect(s.resolved).toBe(1);
    expect(s.open + s.inProgress).toBe(0);
  });
});
