import { describe, it, expect } from "vitest";
import { getHourBreakdown, hourBreakdownLabel } from "./hourBreakdown";

describe("getHourBreakdown", () => {
  it("splits total using overtime_segments", () => {
    const b = getHourBreakdown({
      hours: 10,
      overtime_segments: [
        { rate: "overtime_50", hours: 2 },
        { rate: "overtime_100", hours: 1 },
      ],
    });
    expect(b.normal).toBe(7);
    expect(b.overtime_50).toBe(2);
    expect(b.overtime_100).toBe(1);
    expect(b.total).toBe(10);
    expect(b.hasOvertime).toBe(true);
  });

  it("falls back to hour_type when no segments", () => {
    expect(getHourBreakdown({ hours: 3, hour_type: "overtime_50" }).overtime_50).toBe(3);
    expect(getHourBreakdown({ hours: 4, hour_type: "overtime_100" }).overtime_100).toBe(4);
    expect(getHourBreakdown({ hours: 5 }).normal).toBe(5);
  });

  it("parses JSON-string overtime_segments", () => {
    const b = getHourBreakdown({
      hours: 8,
      overtime_segments: JSON.stringify([{ rate: "overtime_50", hours: 2 }]),
    });
    expect(b.overtime_50).toBe(2);
    expect(b.normal).toBe(6);
  });

  it("clamps negative normal to zero when segments overshoot total", () => {
    const b = getHourBreakdown({
      hours: 2,
      overtime_segments: [{ rate: "overtime_50", hours: 5 }],
    });
    expect(b.normal).toBe(0);
  });

  it("labels combined breakdown", () => {
    expect(
      hourBreakdownLabel({
        hours: 9,
        overtime_segments: [{ rate: "overtime_50", hours: 2 }],
      })
    ).toBe("7t normal + 2t 50%");
    expect(hourBreakdownLabel({ hours: 5 })).toBe("5t normal");
  });
});
