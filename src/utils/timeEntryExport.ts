import * as XLSX from "xlsx";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { getHourBreakdown, hourBreakdownLabel } from "./hourBreakdown";

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
  overtime_segments?: any;
  customer_name?: string | null;
  project_number?: string | null;
  subproject?: string | null;
  tags?: string[] | null;
  total_break_minutes?: number | null;
  materials?: Array<{
    name: string;
    unit: string;
    quantity: number;
    unit_price?: number;
    amount?: number;
    notes?: string | null;
  }>;
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

const isKmAllowance = (a: AllowanceDetailRow) =>
  a.unit === "km" || /(^|\s)km(\s|$)/i.test(a.type_name);

/** Bygger den lesbare «Timeliste»-fanen med samme kolonner som PDF-rapporten */
function buildTimesheetSheet(
  entries: PayrollTimeEntry[],
  allowanceDetails: AllowanceDetailRow[]
): XLSX.WorkSheet {
  const byEntry = new Map<string, AllowanceDetailRow[]>();
  allowanceDetails.forEach((a) => {
    const list = byEntry.get(a.time_entry_id) ?? [];
    list.push(a);
    byEntry.set(a.time_entry_id, list);
  });

  let sumHours = 0;
  let sumBreak = 0;
  let sumKm = 0;
  let sumCost = 0;

  const rows = entries.map((e) => {
    const list = byEntry.get(e.id) ?? [];
    const kmList = list.filter(isKmAllowance);
    const costList = list.filter((a) => !isKmAllowance(a) && a.unit === "fixed");
    const matList = list.filter((a) => !isKmAllowance(a) && a.unit !== "fixed");
    const km = kmList.reduce((s, a) => s + Number(a.quantity || 0), 0);
    const cost = costList.reduce((s, a) => s + Number(a.amount || 0), 0);
    const brk = timesheetBreakMinutes(e);

    sumHours += Number(e.hours) || 0;
    sumBreak += brk;
    sumKm += km;
    sumCost += cost;

    const b = getHourBreakdown(e);
    const overtime = [b.overtime_50 > 0 ? "50%" : "", b.overtime_100 > 0 ? "100%" : ""]
      .filter(Boolean)
      .join(" / ");

    return {
      Dato: format(new Date(e.entry_date), "dd.MM.yyyy", { locale: nb }),
      Kunde: e.customer_name || "",
      Prosjekt: e.project_name || "",
      "Prosjektnr.": e.project_number || "",
      Underprosjekt: e.subproject || "",
      Bruker: e.user_name,
      Fra: fmtTime(e.start_time),
      Til: fmtTime(e.end_time),
      Timer: Number((Number(e.hours) || 0).toFixed(2)),
      "Pause (min)": brk || "",
      Tagger: (e.tags ?? []).join(", "),
      Overtid: overtime,
      KM: km ? Number(km.toFixed(2)) : "",
      "Kostnader (NOK)": cost ? Number(cost.toFixed(2)) : "",
      Materialforbruk: [...kmList, ...matList]
        .map((a) => `${Number(a.quantity).toFixed(2)} ${a.unit || "stk"}. ${a.type_name}`)
        .join("; "),
      Notat: e.description || "",
    };
  });

  rows.push({
    Dato: "",
    Kunde: "",
    Prosjekt: "",
    "Prosjektnr.": "",
    Underprosjekt: "",
    Bruker: "TOTALT",
    Fra: "",
    Til: "",
    Timer: Number(sumHours.toFixed(2)),
    "Pause (min)": sumBreak || "",
    Tagger: "",
    Overtid: "",
    KM: sumKm ? Number(sumKm.toFixed(2)) : "",
    "Kostnader (NOK)": sumCost ? Number(sumCost.toFixed(2)) : "",
    Materialforbruk: "",
    Notat: "",
  } as any);

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 11 }, { wch: 20 }, { wch: 22 }, { wch: 12 }, { wch: 16 }, { wch: 20 },
    { wch: 7 }, { wch: 7 }, { wch: 7 }, { wch: 10 }, { wch: 16 }, { wch: 9 },
    { wch: 8 }, { wch: 14 }, { wch: 26 }, { wch: 50 },
  ];
  ws["!freeze"] = { xSplit: 0, ySplit: 1 } as any;
  return ws;
}

/** Pause: registrert verdi, ellers utledet av fra/til minus timer */
function timesheetBreakMinutes(e: PayrollTimeEntry): number {
  if (e.total_break_minutes != null) return Number(e.total_break_minutes) || 0;
  const from = fmtTime(e.start_time);
  const to = fmtTime(e.end_time);
  if (!from || !to) return 0;
  const [fh, fm] = from.split(":").map(Number);
  const [th, tm] = to.split(":").map(Number);
  let span = th * 60 + tm - (fh * 60 + fm);
  if (span < 0) span += 24 * 60;
  const diff = Math.round(span - (Number(e.hours) || 0) * 60);
  return diff > 0 && diff <= 180 ? diff : 0;
}

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
    Type: hourBreakdownLabel(entry),
    Prosjekt: entry.project_name || "-",
    Beskrivelse: entry.description || "-",
    Status: statusLabels[entry.status] || entry.status,
    "Godkjent av": entry.approved_by_name || "-",
    "Godkjent dato": entry.approved_at
      ? format(new Date(entry.approved_at), "dd.MM.yyyy HH:mm", { locale: nb })
      : "-",
  }));

  // Sheet 0: Timeliste — lesbar oversikt med samme kolonner som PDF-rapporten
  const timesheetWs = buildTimesheetSheet(sorted, allowanceDetails);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, timesheetWs, "Timeliste");
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

  const rows: Record<string, any>[] = [];
  sorted.forEach((entry) => {
    const emp = employeesById[entry.user_id] || {};
    const base = {
      Ansattnummer: emp.employee_number || "",
      "E-post": emp.email || "",
      Dato: format(new Date(entry.entry_date), "yyyy-MM-dd"),
      Prosjekt: entry.project_name || "",
      Kommentar: entry.description || "",
    };
    const b = getHourBreakdown(entry);
    // Split én linje per timetype for korrekt Tripletex-import
    if (b.normal > 0) rows.push({ ...base, Timer: b.normal, Aktivitet: "Ordinær arbeidstid" });
    if (b.overtime_50 > 0) rows.push({ ...base, Timer: b.overtime_50, Aktivitet: "Overtid 50%" });
    if (b.overtime_100 > 0) rows.push({ ...base, Timer: b.overtime_100, Aktivitet: "Overtid 100%" });
    if (b.normal === 0 && b.overtime_50 === 0 && b.overtime_100 === 0) {
      rows.push({ ...base, Timer: Number(entry.hours) || 0, Aktivitet: "Ordinær arbeidstid" });
    }
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
    const b = getHourBreakdown(e);
    s.normal_hours = (s.normal_hours || 0) + b.normal;
    s.overtime_50_hours = (s.overtime_50_hours || 0) + b.overtime_50;
    s.overtime_100_hours = (s.overtime_100_hours || 0) + b.overtime_100;
  });
  const materialDetails: AllowanceDetailRow[] = entries.flatMap((entry) =>
    (entry.materials || []).map((material) => ({
      time_entry_id: entry.id,
      user_name: entry.user_name,
      entry_date: entry.entry_date,
      type_name: material.name,
      unit: material.unit || "stk",
      quantity: Number(material.quantity) || 0,
      rate_snapshot: Number(material.unit_price) || 0,
      amount: Number(material.amount) || 0,
      notes: material.notes || null,
    }))
  );
  exportPayrollGeneric(entries, Array.from(map.values()), companyName, startDate, endDate, materialDetails);
}
