import { supabase } from "@/integrations/supabase/client";
import { getLocalDateString } from "@/lib/dateUtils";

export interface AuditDeviationItem {
  /** Kontrollpunktet som er merket som avvik */
  label: string;
  comment?: string;
  sectionTitle?: string;
}

interface CreateAuditDeviationsArgs {
  companyId: string;
  formLabel: string;
  items: AuditDeviationItem[];
  reporterId?: string | null;
  reporterName?: string | null;
  departmentId?: string | null;
  date?: string;
}

const truncate = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/**
 * Oppretter avvik i avviksmodulen for kontrollpunkter som er merket som avvik
 * i en HMS-revisjon eller kontroll. Hopper over avvik som allerede finnes
 * (samme tittel i samme bedrift), slik at et skjema kan lagres flere ganger.
 */
export async function createAuditDeviations({
  companyId,
  formLabel,
  items,
  reporterId,
  reporterName,
  departmentId,
  date,
}: CreateAuditDeviationsArgs): Promise<number> {
  if (!companyId || items.length === 0) return 0;

  const titles = items.map((i) => truncate(`${formLabel}: ${i.label}`, 180));

  const { data: existing, error: existingError } = await supabase
    .from("deviations")
    .select("title")
    .eq("company_id", companyId)
    .eq("is_deleted", false)
    .in("title", titles);
  if (existingError) throw existingError;

  const existingTitles = new Set((existing || []).map((d) => d.title));
  const incidentDate = date || getLocalDateString();
  const dueDateObj = new Date();
  dueDateObj.setDate(dueDateObj.getDate() + 14);
  const dueDate = `${dueDateObj.getFullYear()}-${String(dueDateObj.getMonth() + 1).padStart(2, "0")}-${String(dueDateObj.getDate()).padStart(2, "0")}`;

  const rows = items
    .map((item, index) => ({ item, title: titles[index] }))
    .filter(({ title }) => !existingTitles.has(title))
    .map(({ item, title }) => ({
      company_id: companyId,
      department_id: departmentId || null,
      deviation_number: null,
      title,
      description: [
        item.sectionTitle ? `Område: ${item.sectionTitle}` : null,
        `Kontrollpunkt: ${item.label}`,
        item.comment ? `Kommentar: ${item.comment}` : null,
        `Registrert automatisk fra ${formLabel}.`,
      ]
        .filter(Boolean)
        .join("\n"),
      category: "safety",
      priority: "medium",
      status: "open",
      type: "avvik",
      reporter_id: reporterId || null,
      reporter_name: reporterName || "Ukjent",
      incident_date: incidentDate,
      due_date: dueDate,
    }));

  if (rows.length === 0) return 0;

  const { error } = await supabase.from("deviations").insert(rows);
  if (error) throw error;
  return rows.length;
}
