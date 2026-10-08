import { getLocalDateString } from "./dateUtils";

describe("getLocalDateString", () => {
  const originalTz = process.env.TZ;
  beforeAll(() => {
    process.env.TZ = "Europe/Oslo";
  });
  afterAll(() => {
    process.env.TZ = originalTz;
  });

  test("uses local Oslo date just after midnight (toISOString would give the previous day)", () => {
    const d = new Date("2026-10-08T22:30:00Z"); // 00:30 on 9 Oct in Oslo (UTC+2)
    expect(d.toISOString().split("T")[0]).toBe("2026-10-08");
    expect(getLocalDateString(d)).toBe("2026-10-09");
  });

  test("winter time (UTC+1) and zero padding", () => {
    expect(getLocalDateString(new Date("2026-01-04T23:15:00Z"))).toBe("2026-01-05");
    expect(getLocalDateString(new Date("2026-03-01T12:00:00Z"))).toBe("2026-03-01");
  });
});
