import { supabase } from "@/integrations/supabase/client";

export interface AarshjulActivityBase {
  id: string;
  name: string;
  description: string;
  months: number[];
  frequency: string;
  responsible?: string;
}

export const AARSHJUL_MONTH_NAMES = [
  "Januar",
  "Februar",
  "Mars",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export const DEFAULT_AARSHJUL_ACTIVITIES: AarshjulActivityBase[] = [
  {
    id: "annual-review",
    name: "Årlig HMS-revisjon",
    description: "Gjennomgang av hele HMS-systemet",
    months: [1],
    frequency: "Årlig (januar)",
    responsible: "HMS-ansvarlig",
  },
  {
    id: "vernerunde-q1",
    name: "Vernerunde Q1",
    description: "Kvartalsvis vernerunde",
    months: [3],
    frequency: "Kvartalsvis",
    responsible: "Verneombud",
  },
  {
    id: "vernerunde-q2",
    name: "Vernerunde Q2",
    description: "Kvartalsvis vernerunde",
    months: [6],
    frequency: "Kvartalsvis",
    responsible: "Verneombud",
  },
  {
    id: "vernerunde-q3",
    name: "Vernerunde Q3",
    description: "Kvartalsvis vernerunde",
    months: [9],
    frequency: "Kvartalsvis",
    responsible: "Verneombud",
  },
  {
    id: "vernerunde-q4",
    name: "Vernerunde Q4",
    description: "Kvartalsvis vernerunde",
    months: [12],
    frequency: "Kvartalsvis",
    responsible: "Verneombud",
  },
  {
    id: "el-kontroll",
    name: "El-kontroll",
    description: "Elektrisk sikkerhetskontroll",
    months: [5],
    frequency: "Årlig",
    responsible: "Driftsleder",
  },
  {
    id: "brannvern",
    name: "Brannvernøvelse",
    description: "Evakueringsøvelse og brannslukking",
    months: [4, 10],
    frequency: "Halvårlig",
    responsible: "Brannvernleder",
  },
  {
    id: "fysiske-forhold",
    name: "Fysiske arbeidsforhold",
    description: "Gjennomgang av lokaler og utstyr",
    months: [2],
    frequency: "Årlig",
    responsible: "HMS-ansvarlig",
  },
  {
    id: "stoffkartotek",
    name: "Stoffkartotek-gjennomgang",
    description: "Oppdatering av kjemikalieregister",
    months: [8],
    frequency: "Årlig",
    responsible: "HMS-ansvarlig",
  },
  {
    id: "risikovurdering",
    name: "Risikovurdering",
    description: "Revisjon av risikovurderinger",
    months: [11],
    frequency: "Årlig",
    responsible: "HMS-ansvarlig",
  },
  {
    id: "hms-opplaering",
    name: "HMS-opplæring",
    description: "Opplæring av ansatte i HMS",
    months: [1, 7],
    frequency: "Halvårlig",
    responsible: "Daglig leder",
  },
  {
    id: "medarbeidersamtaler",
    name: "Medarbeidersamtaler",
    description: "Årlige utviklingssamtaler",
    months: [3, 9],
    frequency: "Halvårlig",
    responsible: "Avdelingsleder",
  },
];

export interface AarshjulRow {
  month: number;
  monthName: string;
  name: string;
  description: string;
  frequency: string;
  responsible: string;
  completedDate: string | null;
}

const formTypeToActivityId: Record<string, string> = {
  "annual-hms-revision": "annual-review",
  annual_hms: "annual-review",
  vernerunde: "vernerunde-q1",
  elkontroll: "el-kontroll",
  "el-kontroll": "el-kontroll",
  brannvern: "brannvern",
  fysiske_forhold: "fysiske-forhold",
  "fysiske-arbeidsforhold": "fysiske-forhold",
  stoffkartotek: "stoffkartotek",
  risikovurdering: "risikovurdering",
};

/**
 * Builds a flat, month-ordered list of planned HMS activities for a company,
 * including custom activities, hidden defaults, month overrides and completion status.
 */
export async function fetchAarshjulRows(
  companyId: string,
  departmentId: string | null = null,
  year: number = new Date().getFullYear()
): Promise<AarshjulRow[]> {
  const customQuery = supabase
    .from("company_aarshjul_activities")
    .select("id, name, description, responsible, month")
    .eq("company_id", companyId);
  const hiddenQuery = supabase
    .from("company_aarshjul_hidden_defaults")
    .select("activity_id")
    .eq("company_id", companyId);
  const overrideQuery = supabase
    .from("company_aarshjul_default_overrides")
    .select("activity_id, custom_months")
    .eq("company_id", companyId);

  const scope = <T extends { eq: any; is: any }>(q: T): T =>
    (departmentId ? q.eq("department_id", departmentId) : q.is("department_id", null)) as T;

  const [customRes, hiddenRes, overrideRes, completedRes] = await Promise.all([
    scope(customQuery as any),
    scope(hiddenQuery as any),
    scope(overrideQuery as any),
    supabase
      .from("audit_form_responses")
      .select("form_type, completed_at")
      .eq("company_id", companyId)
      .eq("status", "completed")
      .not("completed_at", "is", null),
  ]);

  const hidden = new Set(((hiddenRes as any).data || []).map((d: any) => d.activity_id));
  const overrides: Record<string, number[]> = {};
  ((overrideRes as any).data || []).forEach((d: any) => {
    overrides[d.activity_id] = d.custom_months;
  });

  const completions: Record<string, string> = {};
  ((completedRes as any).data || []).forEach((c: any) => {
    const date = new Date(c.completed_at);
    if (date.getFullYear() !== year) return;
    const activityId = formTypeToActivityId[c.form_type];
    if (activityId) completions[activityId] = date.toLocaleDateString("nb-NO");
  });

  const completionFor = (activityId: string): string | null => {
    if (completions[activityId]) return completions[activityId];
    if (activityId.startsWith("vernerunde")) return completions["vernerunde-q1"] || null;
    return null;
  };

  const rows: AarshjulRow[] = [];

  DEFAULT_AARSHJUL_ACTIVITIES.forEach((activity) => {
    if (hidden.has(activity.id)) return;
    const months = overrides[activity.id] || activity.months;
    months.forEach((month) => {
      rows.push({
        month,
        monthName: AARSHJUL_MONTH_NAMES[month - 1] || "",
        name: activity.name,
        description: activity.description,
        frequency: activity.frequency,
        responsible: activity.responsible || "-",
        completedDate: completionFor(activity.id),
      });
    });
  });

  ((customRes as any).data || []).forEach((c: any) => {
    rows.push({
      month: c.month,
      monthName: AARSHJUL_MONTH_NAMES[c.month - 1] || "",
      name: c.name,
      description: c.description || "",
      frequency: "Egendefinert",
      responsible: c.responsible || "-",
      completedDate: null,
    });
  });

  return rows.sort((a, b) => a.month - b.month || a.name.localeCompare(b.name, "nb"));
}
