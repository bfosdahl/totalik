import { describe, it, expect } from "vitest";
import {
  spanMinutes, workedHoursFromSpan, breakFromSpan, endTimeFor,
  clockWorkedHours, ongoingBreakMinutes, formatHoursNo,
} from "./timeCalc";

describe("timeCalc", () => {
  it("normal dag 07:00–15:00 med 30 min pause gir 7,5 t", () => {
    expect(workedHoursFromSpan("07:00", "15:00", 30)).toBe(7.5);
  });
  it("normal dag uten pause gir 8 t", () => {
    expect(workedHoursFromSpan("07:00", "15:00", 0)).toBe(8);
  });
  it("over midnatt 22:00–06:00", () => {
    expect(spanMinutes("22:00", "06:00")).toBe(480);
    expect(workedHoursFromSpan("22:00", "06:00", 0)).toBe(8);
  });
  it("pause større enn spennet gir 0", () => {
    expect(workedHoursFromSpan("07:00", "08:00", 90)).toBe(0);
  });
  it("breakFromSpan", () => {
    expect(breakFromSpan("07:00", "15:00", 7.5)).toBe(30);
    expect(breakFromSpan("07:00", "15:00", 8)).toBe(0);
    expect(breakFromSpan("", "", 7.5)).toBe(0);
    expect(breakFromSpan("07:00", "15:00", 4)).toBe(0);
  });
  it("endTimeFor 07:00 + 9 t + 30 min = 16:30", () => {
    expect(endTimeFor("07:00", 9, 30)).toBe("16:30");
  });
  it("clockWorkedHours med og uten pause", () => {
    const a = "2026-10-09T07:00:00Z", b = "2026-10-09T15:00:00Z";
    expect(clockWorkedHours(a, b, 30)).toBe(7.5);
    expect(clockWorkedHours(a, b, 0)).toBe(8);
  });
  it("ongoingBreakMinutes pågående og avsluttet", () => {
    const now = new Date("2026-10-09T12:20:00Z");
    expect(ongoingBreakMinutes("2026-10-09T12:00:00Z", null, now)).toBe(20);
    expect(ongoingBreakMinutes("2026-10-09T12:00:00Z", "2026-10-09T12:15:00Z", now)).toBe(0);
  });
  it("formatHoursNo", () => {
    expect(formatHoursNo(7.5)).toBe("7,5");
    expect(formatHoursNo(8)).toBe("8");
  });
});
