import { describe, it, expect } from "vitest";
import {
  splitClosureComment,
  buildAvvikHistoryRows,
  CLOSURE_PREFIX,
  AVVIK_STATUS_LABELS,
  AVVIK_SEVERITY_LABELS,
} from "@/utils/avvikHistory";

describe("splitClosureComment", () => {
  it("handles empty input", () => {
    expect(splitClosureComment(null)).toEqual({ corrective: "", closure: null });
    expect(splitClosureComment("")).toEqual({ corrective: "", closure: null });
  });

  it("returns text as corrective when no prefix present", () => {
    expect(splitClosureComment("Fix wall")).toEqual({ corrective: "Fix wall", closure: null });
  });

  it("splits corrective from closure comment", () => {
    const text = `Skiftet vindu\n${CLOSURE_PREFIX} Bekreftet lukket av verneombud`;
    expect(splitClosureComment(text)).toEqual({
      corrective: "Skiftet vindu",
      closure: "Bekreftet lukket av verneombud",
    });
  });

  it("returns null closure when the prefix has no trailing text", () => {
    expect(splitClosureComment(`Noe${CLOSURE_PREFIX}   `)).toEqual({
      corrective: "Noe",
      closure: null,
    });
  });
});

describe("buildAvvikHistoryRows", () => {
  it("returns empty when no timestamps exist", () => {
    expect(buildAvvikHistoryRows({})).toEqual([]);
  });

  it("logs creation with reporter", () => {
    const rows = buildAvvikHistoryRows({
      created_at: "2026-05-01T10:00:00Z",
      reported_by_name: "Kari",
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].event).toBe("Avvik opprettet");
    expect(rows[0].who).toBe("Kari");
  });

  it("logs corrective + preventive actions with responsible", () => {
    const rows = buildAvvikHistoryRows({
      created_at: "2026-05-01T10:00:00Z",
      updated_at: "2026-05-02T12:00:00Z",
      responsible_name: "Ola",
      reported_by_name: "Kari",
      corrective_action: "Skiftet listverk",
      preventive_action: "Ny sjekkliste",
    });
    const events = rows.map((r) => r.event);
    expect(events).toContain("Korrigerende tiltak registrert");
    expect(events).toContain("Forebyggende tiltak registrert");
    expect(rows.find((r) => r.event === "Korrigerende tiltak registrert")?.who).toBe("Ola");
  });

  it("adds closure and closure-comment rows", () => {
    const rows = buildAvvikHistoryRows({
      created_at: "2026-05-01T10:00:00Z",
      updated_at: "2026-05-03T09:00:00Z",
      closed_at: "2026-05-03T09:00:00Z",
      closed_by_name: "Ben",
      responsible_name: "Ola",
      reported_by_name: "Kari",
      corrective_action: `Skiftet\n${CLOSURE_PREFIX} Kontrollert og OK`,
    });
    const events = rows.map((r) => r.event);
    expect(events).toContain("Lukkekommentar lagt til");
    expect(events).toContain("Avvik lukket");
    const closed = rows.find((r) => r.event === "Avvik lukket");
    expect(closed?.who).toBe("Ben");
  });

  it("only emits 'Avvik oppdatert' when there are no explicit actions", () => {
    const rows = buildAvvikHistoryRows({
      created_at: "2026-05-01T10:00:00Z",
      updated_at: "2026-05-02T10:00:00Z",
      responsible_name: "Ola",
    });
    expect(rows.map((r) => r.event)).toContain("Avvik oppdatert");
  });
});

describe("AVVIK label maps", () => {
  it("labels all statuses and severities in Norwegian", () => {
    expect(AVVIK_STATUS_LABELS.open).toBe("Åpen");
    expect(AVVIK_STATUS_LABELS.in_progress).toBe("Under arbeid");
    expect(AVVIK_STATUS_LABELS.closed).toBe("Lukket");
    expect(AVVIK_SEVERITY_LABELS.critical).toBe("Kritisk");
  });
});
