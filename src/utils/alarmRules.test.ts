import { describe, it, expect } from "vitest";
import {
  DEVIATION_ACTIVE_STATUSES,
  KS2_ACTIVE_STATUSES,
  daysUntilDue,
  isAlarmEligible,
  resolveReminderType,
  selectAlarms,
  type AlarmCandidate,
} from "./alarmRules";

const TODAY = new Date("2026-08-02T12:00:00Z");

const iso = (offsetDays: number) => {
  const d = new Date(TODAY);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const row = (over: Partial<AlarmCandidate> = {}): AlarmCandidate => ({
  id: "d1",
  company_id: "company-A",
  status: "open",
  due_date: iso(0),
  assignee_id: "user-1",
  is_deleted: false,
  ...over,
});

describe("daysUntilDue / resolveReminderType", () => {
  it("regner dager uavhengig av klokkeslett", () => {
    expect(daysUntilDue(iso(0), TODAY)).toBe(0);
    expect(daysUntilDue(iso(3), TODAY)).toBe(3);
    expect(daysUntilDue(iso(-5), TODAY)).toBe(-5);
  });

  it("mapper dager til riktig påminnelsestype", () => {
    expect(resolveReminderType(-1)).toBe("overdue");
    expect(resolveReminderType(0)).toBe("day_of");
    expect(resolveReminderType(1)).toBe("day_before");
    expect(resolveReminderType(2)).toBe("three_days");
    expect(resolveReminderType(3)).toBe("three_days");
    expect(resolveReminderType(7)).toBe("week_before");
  });

  it("sender ingen alarm for dager utenfor vinduene", () => {
    expect(resolveReminderType(4)).toBeNull();
    expect(resolveReminderType(6)).toBeNull();
    expect(resolveReminderType(30)).toBeNull();
  });
});

describe("soft-delete", () => {
  it("varsler aldri om soft-slettede avvik", () => {
    expect(isAlarmEligible(row({ is_deleted: true }), DEVIATION_ACTIVE_STATUSES)).toBe(false);
  });

  it("varsler aldri om soft-slettede egenkontroller (bygg)", () => {
    expect(
      isAlarmEligible(row({ is_deleted: true, status: "planned" }), KS2_ACTIVE_STATUSES),
    ).toBe(false);
  });

  it("varsler om aktive rader som ikke er slettet", () => {
    expect(isAlarmEligible(row(), DEVIATION_ACTIVE_STATUSES)).toBe(true);
    expect(isAlarmEligible(row({ status: "in_progress" }), KS2_ACTIVE_STATUSES)).toBe(true);
  });

  it("filtrerer bort soft-slettede i selectAlarms", () => {
    const alarms = selectAlarms(
      [row({ id: "keep" }), row({ id: "deleted", is_deleted: true })],
      { companyId: "company-A", today: TODAY, activeStatuses: DEVIATION_ACTIVE_STATUSES },
    );
    expect(alarms.map((a) => a.id)).toEqual(["keep"]);
  });
});

describe("due_date = null", () => {
  it("er aldri kandidat for alarm", () => {
    expect(isAlarmEligible(row({ due_date: null }), DEVIATION_ACTIVE_STATUSES)).toBe(false);
    expect(
      isAlarmEligible(row({ due_date: null, status: "planned" }), KS2_ACTIVE_STATUSES),
    ).toBe(false);
  });

  it("gir ikke falsk 'forfalt' når frist mangler", () => {
    const alarms = selectAlarms([row({ id: "no-date", due_date: null })], {
      companyId: "company-A",
      today: TODAY,
      activeStatuses: DEVIATION_ACTIVE_STATUSES,
    });
    expect(alarms).toEqual([]);
  });

  it("varsler fortsatt om rader som har frist", () => {
    const alarms = selectAlarms(
      [row({ id: "no-date", due_date: null }), row({ id: "overdue", due_date: iso(-2) })],
      { companyId: "company-A", today: TODAY, activeStatuses: DEVIATION_ACTIVE_STATUSES },
    );
    expect(alarms).toEqual([{ id: "overdue", reminderType: "overdue" }]);
  });
});

describe("company_id-scoping", () => {
  it("lekker ikke alarmer på tvers av bedrifter", () => {
    const alarms = selectAlarms(
      [
        row({ id: "a1", company_id: "company-A" }),
        row({ id: "b1", company_id: "company-B" }),
        row({ id: "b2", company_id: "company-B", due_date: iso(-9) }),
      ],
      { companyId: "company-A", today: TODAY, activeStatuses: DEVIATION_ACTIVE_STATUSES },
    );
    expect(alarms.map((a) => a.id)).toEqual(["a1"]);
  });

  it("varsler ikke når company_id mangler", () => {
    expect(isAlarmEligible(row({ company_id: null }), DEVIATION_ACTIVE_STATUSES)).toBe(false);
  });

  it("holder bygg-egenkontroller innenfor eget prosjekts bedrift", () => {
    const alarms = selectAlarms(
      [
        row({ id: "ks-a", company_id: "company-A", status: "planned" }),
        row({ id: "ks-b", company_id: "company-B", status: "planned" }),
      ],
      { companyId: "company-B", today: TODAY, activeStatuses: KS2_ACTIVE_STATUSES },
    );
    expect(alarms).toEqual([{ id: "ks-b", reminderType: "day_of" }]);
  });
});

describe("status og ansvarlig", () => {
  it("varsler ikke om lukkede/fullførte saker", () => {
    expect(isAlarmEligible(row({ status: "closed" }), DEVIATION_ACTIVE_STATUSES)).toBe(false);
    expect(isAlarmEligible(row({ status: "completed" }), KS2_ACTIVE_STATUSES)).toBe(false);
  });

  it("varsler ikke uten ansvarlig", () => {
    expect(isAlarmEligible(row({ assignee_id: null }), DEVIATION_ACTIVE_STATUSES)).toBe(false);
  });

  it("kombinert regressjon: kun gyldige rader varsles", () => {
    const alarms = selectAlarms(
      [
        row({ id: "ok-overdue", due_date: iso(-1) }),
        row({ id: "ok-week", due_date: iso(7) }),
        row({ id: "skip-deleted", is_deleted: true }),
        row({ id: "skip-nodate", due_date: null }),
        row({ id: "skip-other-company", company_id: "company-B" }),
        row({ id: "skip-closed", status: "closed" }),
        row({ id: "skip-noassignee", assignee_id: null }),
        row({ id: "skip-far", due_date: iso(20) }),
      ],
      { companyId: "company-A", today: TODAY, activeStatuses: DEVIATION_ACTIVE_STATUSES },
    );
    expect(alarms).toEqual([
      { id: "ok-overdue", reminderType: "overdue" },
      { id: "ok-week", reminderType: "week_before" },
    ]);
  });
});
