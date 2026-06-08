import * as XLSX from "xlsx";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export interface PayrollTimeEntry {
  id: string;
  user_id: string;
  user_name: string;
  entry_date: string;
  hours: number;
  project_name: string | null;
  description: string | null;
  status: string;
  approved_by_name: string | null;
  approved_at: string | null;
  hourly_rate?: number | null;
  allowances_amount?: number;
  is_overtime?: boolean | null;
}

export interface EmployeeSummary {
  user_id: string;
  user_name: string;
  employee_number?: string | null;
  total_hours: number;
  overtime_hours?: number;
  hourly_rate: number | null;
  base_amount: number;
  allowances_amount: number;
  total_amount: number;
}

const statusLabels: Record<string, string> = {
  draft: "Utkast",
  submitted: "Innsendt",
  approved: "Godkjent",
  rejected: "Avvist",
};

function buildFilename(companyName: string, startDate?: Date, endDate?: Date, suffix = "") {
  const dateRange =
    startDate && endDate
      ? `_${format(startDate, "yyyy-MM-dd")}_til_${format(endDate, "yyyy-MM-dd")}`
      : `_${format(new Date(), "yyyy-MM-dd")}`;
  return `Lonnsgrunnlag${suffix}_${companyName.replace(/\s+/g, "_")}${dateRange}.xlsx`;
}

/**
 * Generic export — 3 sheets: Sammendrag per ansatt, Per prosjekt, Alle registreringer.
 */
export function exportPayrollGeneric(
  entries: PayrollTimeEntry[],
  employeeSummaries: EmployeeSummary[],
  companyName: string,
  startDate?: Date,
  endDate?: Date
) {
  const sorted = [...entries].sort(
    (a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime()
  );

  // Sheet 1: Sammendrag per ansatt (med kost)
  const summaryRows = employeeSummaries.map((e) => ({
    Ansatt: e.user_name,
    "Timer (sum)": Number(e.total_hours.toFixed(2)),
    "Timesats (NOK)": e.hourly_rate ?? "",
    "Grunnlønn (NOK)": Number(e.base_amount.toFixed(2)),
    "Tillegg (NOK)": Number(e.allowances_amount.toFixed(2)),
    "Sum lønn (NOK)": Number(e.total_amount.toFixed(2)),
  }));
  // Totals row
  const totalHours = employeeSummaries.reduce((s, e) => s + e.total_hours, 0);
  const totalBase = employeeSummaries.reduce((s, e) => s + e.base_amount, 0);
  const totalAllow = employeeSummaries.reduce((s, e) => s + e.allowances_amount, 0);
  const totalSum = employeeSummaries.reduce((s, e) => s + e.total_amount, 0);
  summaryRows.push({
    Ansatt: "TOTALT",
    "Timer (sum)": Number(totalHours.toFixed(2)),
    "Timesats (NOK)": "",
    "Grunnlønn (NOK)": Number(totalBase.toFixed(2)),
    "Tillegg (NOK)": Number(totalAllow.toFixed(2)),
    "Sum lønn (NOK)": Number(totalSum.toFixed(2)),
  });

  // Sheet 2: per prosjekt
  const byProject: Record<string, number> = {};
  sorted.forEach((e) => {
    const k = e.project_name || "Uten prosjekt";
    byProject[k] = (byProject[k] || 0) + Number(e.hours);
  });
  const projectRows = Object.entries(byProject)
    .sort((a, b) => b[1] - a[1])
    .map(([project, hours]) => ({ Prosjekt: project, "Totalt timer": Number(hours.toFixed(2)) }));

  // Sheet 3: alle registreringer
  const detailRows = sorted.map((entry) => ({
    Dato: format(new Date(entry.entry_date), "dd.MM.yyyy", { locale: nb }),
    Ansatt: entry.user_name,
    Timer: Number(entry.hours),
    Prosjekt: entry.project_name || "-",
    Beskrivelse: entry.description || "-",
    Status: statusLabels[entry.status] || entry.status,
    "Godkjent av": entry.approved_by_name || "-",
    "Godkjent dato": entry.approved_at
      ? format(new Date(entry.approved_at), "dd.MM.yyyy HH:mm", { locale: nb })
      : "-",
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), "Sammendrag");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(projectRows), "Per prosjekt");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailRows), "Registreringer");

  XLSX.writeFile(wb, buildFilename(companyName, startDate, endDate));
}

/**
 * Tripletex-formatert import: én rad per ansatt+dato med fast kolonnerekkefølge
 * som Tripletex aksepterer for time-import.
 * Kolonner: Ansattnummer | E-post | Dato | Timer | Aktivitet | Prosjekt | Kommentar
 */
export function exportPayrollTripletex(
  entries: PayrollTimeEntry[],
  employeesById: Record<string, { email?: string | null; employee_number?: string | null }>,
  companyName: string,
  startDate?: Date,
  endDate?: Date
) {
  const sorted = [...entries].sort(
    (a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime()
  );

  const rows = sorted.map((entry) => {
    const emp = employeesById[entry.user_id] || {};
    return {
      Ansattnummer: emp.employee_number || "",
      "E-post": emp.email || "",
      Dato: format(new Date(entry.entry_date), "yyyy-MM-dd"),
      Timer: Number(entry.hours),
      Aktivitet: "Ordinær arbeidstid",
      Prosjekt: entry.project_name || "",
      Kommentar: entry.description || "",
    };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Tripletex-import");
  XLSX.writeFile(wb, buildFilename(companyName, startDate, endDate, "_Tripletex"));
}

/**
 * Bakoverkompatibel wrapper for kall fra TimeRegistration / Ks2Timeregistrering.
 */
export function exportTimeEntriesToExcel(
  entries: PayrollTimeEntry[],
  companyName: string,
  startDate?: Date,
  endDate?: Date
) {
  // Bygg minimal summary uten lønn for å gjenbruke generic
  const map = new Map<string, EmployeeSummary>();
  entries.forEach((e) => {
    if (!map.has(e.user_id)) {
      map.set(e.user_id, {
        user_id: e.user_id,
        user_name: e.user_name,
        total_hours: 0,
        hourly_rate: null,
        base_amount: 0,
        allowances_amount: 0,
        total_amount: 0,
      });
    }
    const s = map.get(e.user_id)!;
    s.total_hours += Number(e.hours) || 0;
  });
  exportPayrollGeneric(entries, Array.from(map.values()), companyName, startDate, endDate);
}
