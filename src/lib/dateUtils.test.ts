import { getLocalDateString, osloDateString, calendarDaysFromToday, relativeDayLabel } from "./dateUtils";

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


describe("calendarDaysFromToday", () => {
  test("23:30 Oslo 8 Oct → 10 Oct is 2 days", () => {
    expect(calendarDaysFromToday("2026-10-10", new Date("2026-10-08T21:30:00Z"))).toBe(2);
    expect(relativeDayLabel(1)).toBe("I morgen");
  });
  test("00:30 Oslo 9 Oct → 10 Oct is 1 day", () => {
    expect(calendarDaysFromToday("2026-10-10", new Date("2026-10-08T22:30:00Z"))).toBe(1);
  });
  test("today and yesterday", () => {
    const now = new Date("2026-10-09T10:00:00Z");
    expect(calendarDaysFromToday("2026-10-09", now)).toBe(0);
    expect(calendarDaysFromToday("2026-10-08", now)).toBe(-1);
  });
  test("DST transitions", () => {
    expect(calendarDaysFromToday("2026-03-30", new Date("2026-03-28T12:00:00Z"))).toBe(2);
    expect(calendarDaysFromToday("2026-10-26", new Date("2026-10-24T12:00:00Z"))).toBe(2);
  });
  test("ISO timestamp is converted to Oslo day", () => {
    expect(calendarDaysFromToday("2026-10-09T22:30:00Z", new Date("2026-10-09T10:00:00Z"))).toBe(1);
  });
  test("invalid input → null", () => {
    expect(calendarDaysFromToday(null)).toBeNull();
    expect(calendarDaysFromToday("")).toBeNull();
    expect(calendarDaysFromToday("garbage")).toBeNull();
  });
  test("osloDateString", () => {
    expect(osloDateString(new Date("2026-10-08T22:30:00Z"))).toBe("2026-10-09");
  });
  test("relativeDayLabel", () => {
    expect([0, -1, 3, -4].map(relativeDayLabel)).toEqual(["I dag", "I går", "Om 3 dager", "4 dager siden"]);
  });
});
