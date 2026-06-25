import * as XLSX from "xlsx";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export interface PayrollTimeEntry {
  id: string;
  user_id: string;
  user_name: string;
  entry_date: string;
  hours: number;
  start_time?: string | null;
  end_time?: string | null;
  project_name: string | null;
  description: string | null;
  status: string;
  approved_by_name: string | null;
  approved_at: string | null;
  hourly_rate?: number | null;
  allowances_amount?: number;
  hour_type?: string | null;
  is_overtime?: boolean | null;
}

export interface AllowanceDetailRow {
  time_entry_id: string;
  user_name: string;
  entry_date: string;
  type_name: string;
  unit: string;
  quantity: number;
  rate_snapshot: number;
  amount: number;
  notes?: string | null;
}

export interface EmployeeSummary {
  user_id: string;
  user_name: string;
  employee_number?: string | null;
  total_hours: number;
  normal_hours?: number;
  overtime_50_hours?: number;
  overtime_100_hours?: number;
  overtime_hours?: number; // legacy
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

const hourTypeLabel = (t?: string | null): string => {
  if (t === "overtime_50") return "Overtid 50%";
  if (t === "overtime_100") return "Overtid 100%";
  return "Normal";
};

const fmtTime = (t?: string | null): string => {
  if (!t) return "";
  return String(t).substring(0, 5);
};

function buildFilename(companyName: string, startDate?: Date, endDate?: Date, suffix = "") {
  const dateRange =
    startDate && endDate
      ? `_${format(startDate, "yyyy-MM-dd")}_til_${format(endDate, "yyyy-MM-dd")}`
      : `_${format(new Date(), "yyyy-MM-dd")}`;
  return `Lonnsgrunnlag${suffix}_${companyName.replace(/\s+/g, "_")}${dateRange}.xlsx`;
}

/**
 * Generic export — 4 ark:
 *   1. Sammendrag (per ansatt med splittede overtidskolonner)
 *   2. Per prosjekt
 *   3. Registreringer (detaljer m/ fra-til, type)
 *   4. Tillegg detaljert (én rad per tillegg) — kun hvis det finnes tillegg
 */
export function exportPayrollGeneric(
  entries: PayrollTimeEntry[],
  employeeSummaries: EmployeeSummary[],
  companyName: string,
  startDate?: Date,
  endDate?: Date,
  allowanceDetails: AllowanceDetailRow[] = []
) {
  const sorted = [...entries].sort(
    (a, b) =>
      new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime() ||
      a.user_name.localeCompare(b.user_name, "nb")
  );

  // Sheet 1: Sammendrag per ansatt — splittede overtidskolonner
  const summaryRows = employeeSummaries.map((e) => ({
    Ansattnr: e.employee_number || "",
    Ansatt: e.user_name,
    "Normaltimer": Number((e.normal_hours ?? 0).toFixed(2)),
    "Overtid 50%": Number((e.overtime_50_hours ?? 0).toFixed(2)),
    "Overtid 100%": Number((e.overtime_100_hours ?? 0).toFixed(2)),
    "Timer totalt": Number(e.total_hours.toFixed(2)),
    "Timesats (NOK)": e.hourly_rate ?? "",
    "Grunnlønn (NOK)": Number(e.base_amount.toFixed(2)),
    "Tillegg (NOK)": Number(e.allowances_amount.toFixed(2)),
    "Sum lønn (NOK)": Number(e.total_amount.toFixed(2)),
  }));
  const totalNormal = employeeSummaries.reduce((s, e) => s + (e.normal_hours ?? 0), 0);
  const total50 = employeeSummaries.reduce((s, e) => s + (e.overtime_50_hours ?? 0), 0);
  const total100 = employeeSummaries.reduce((s, e) => s + (e.overtime_100_hours ?? 0), 0);
  const totalHours = employeeSummaries.reduce((s, e) => s + e.total_hours, 0);
  const totalBase = employeeSummaries.reduce((s, e) => s + e.base_amount, 0);
  const totalAllow = employeeSummaries.reduce((s, e) => s + e.allowances_amount, 0);
  const totalSum = employeeSummaries.reduce((s, e) => s + e.total_amount, 0);
  summaryRows.push({
    Ansattnr: "",
    Ansatt: "TOTALT",
    "Normaltimer": Number(totalNormal.toFixed(2)),
    "Overtid 50%": Number(total50.toFixed(2)),
    "Overtid 100%": Number(total100.toFixed(2)),
    "Timer totalt": Number(totalHours.toFixed(2)),
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

  // Sheet 3: alle registreringer m/ fra-til
  const detailRows = sorted.map((entry) => ({
    Dato: format(new Date(entry.entry_date), "dd.MM.yyyy", { locale: nb }),
    Ansatt: entry.user_name,
    Fra: fmtTime(entry.start_time),
    Til: fmtTime(entry.end_time),
    Timer: Number(entry.hours),
    Type: hourTypeLabel(entry.hour_type),
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

  if (allowanceDetails.length > 0) {
    const allowRows = [...allowanceDetails]
      .sort(
        (a, b) =>
          new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime() ||
          a.user_name.localeCompare(b.user_name, "nb")
      )
      .map((a) => ({
        Dato: format(new Date(a.entry_date), "dd.MM.yyyy", { locale: nb }),
        Ansatt: a.user_name,
        "Type tillegg": a.type_name,
        Enhet: a.unit,
        Antall: Number(a.quantity),
        "Sats (NOK)": Number(a.rate_snapshot),
        "Beløp (NOK)": Number(a.amount.toFixed(2)),
        Notat: a.notes || "",
      }));
    const totalAllowSum = allowanceDetails.reduce((s, a) => s + Number(a.amount || 0), 0);
    allowRows.push({
      Dato: "",
      Ansatt: "TOTALT",
      "Type tillegg": "",
      Enhet: "",
      Antall: "" as any,
      "Sats (NOK)": "" as any,
      "Beløp (NOK)": Number(totalAllowSum.toFixed(2)),
      Notat: "",
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(allowRows), "Tillegg detaljert");
  }

  XLSX.writeFile(wb, buildFilename(companyName, startDate, endDate));
}

/**
 * Tripletex-formatert import: én rad per ansatt+dato med fast kolonnerekkefølge
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
      Aktivitet:
        entry.hour_type === "overtime_50"
          ? "Overtid 50%"
          : entry.hour_type === "overtime_100"
            ? "Overtid 100%"
            : entry.is_overtime
              ? "Overtid"
              : "Ordinær arbeidstid",
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
  const map = new Map<string, EmployeeSummary>();
  entries.forEach((e) => {
    if (!map.has(e.user_id)) {
      map.set(e.user_id, {
        user_id: e.user_id,
        user_name: e.user_name,
        total_hours: 0,
        normal_hours: 0,
        overtime_50_hours: 0,
        overtime_100_hours: 0,
        hourly_rate: null,
        base_amount: 0,
        allowances_amount: 0,
        total_amount: 0,
      });
    }
    const s = map.get(e.user_id)!;
    const h = Number(e.hours) || 0;
    s.total_hours += h;
    if (e.hour_type === "overtime_50") s.overtime_50_hours = (s.overtime_50_hours || 0) + h;
    else if (e.hour_type === "overtime_100") s.overtime_100_hours = (s.overtime_100_hours || 0) + h;
    else s.normal_hours = (s.normal_hours || 0) + h;
  });
  exportPayrollGeneric(entries, Array.from(map.values()), companyName, startDate, endDate);
}
