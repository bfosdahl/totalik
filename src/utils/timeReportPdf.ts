import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { registerPdfFont } from "./pdfFont";
import { loadImageAsBase64 } from "./handbookPdfSanitizer";

export interface TimeReportEntry {
  id: string;
  entry_date: string;
  user_name: string;
  hours: number | string;
  start_time?: string | null;
  end_time?: string | null;
  customer_name?: string | null;
  project_name?: string | null;
  project_number?: string | null;
  subproject?: string | null;
  tags?: string[] | null;
  hour_type?: string | null;
  overtime_segments?: any;
  description?: string | null;
  total_break_minutes?: number | null;
}

export interface TimeReportAllowance {
  time_entry_id: string;
  type_name: string;
  unit: string;
  quantity: number;
  amount: number;
}

export interface TimeReportOptions {
  entries: TimeReportEntry[];
  companyName: string;
  logoUrl?: string | null;
  startDate?: Date;
  endDate?: Date;
  /** Undertittel, f.eks. navnet på ansatt når en ansatt tar ut sin egen rapport */
  subtitle?: string;
  allowances?: TimeReportAllowance[];
}

const fmtTime = (t?: string | null) => (t ? String(t).substring(0, 5) : "");

/** "7 t 30 m" + linje 2 "07:00 - 15:00" */
function durationCell(e: TimeReportEntry): string {
  const h = Number(e.hours) || 0;
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  const dur = `${hh} t ${mm} m`;
  const from = fmtTime(e.start_time);
  const to = fmtTime(e.end_time);
  return from && to ? `${dur}\n${from} - ${to}` : dur;
}

/** Pause i minutter: registrert pause, ellers utledet av fra/til minus timer */
export function breakMinutes(e: TimeReportEntry): number {
  if (e.total_break_minutes != null) return Number(e.total_break_minutes) || 0;
  const from = fmtTime(e.start_time);
  const to = fmtTime(e.end_time);
  if (!from || !to) return 0;
  const [fh, fm] = from.split(":").map(Number);
  const [th, tm] = to.split(":").map(Number);
  let span = th * 60 + tm - (fh * 60 + fm);
  if (span < 0) span += 24 * 60;
  const worked = (Number(e.hours) || 0) * 60;
  const diff = Math.round(span - worked);
  return diff > 0 && diff <= 180 ? diff : 0;
}

/** "50%", "100%", "50% / 100%" eller tom */
function overtimeCell(e: TimeReportEntry): string {
  const rates = new Set<string>();
  if (e.hour_type === "overtime_50") rates.add("50%");
  if (e.hour_type === "overtime_100") rates.add("100%");
  const segs = Array.isArray(e.overtime_segments) ? e.overtime_segments : [];
  segs.forEach((s: any) => {
    if (s?.rate === "overtime_50") rates.add("50%");
    if (s?.rate === "overtime_100") rates.add("100%");
  });
  return Array.from(rates).join(" / ");
}

const isKm = (a: TimeReportAllowance) =>
  a.unit === "km" || /(^|\s)km(\s|$)/i.test(a.type_name);
const isCost = (a: TimeReportAllowance) => a.unit === "fixed";

/** Henter tillegg for de aktuelle timeføringene */
export async function fetchTimeReportAllowances(
  entryIds: string[]
): Promise<TimeReportAllowance[]> {
  if (entryIds.length === 0) return [];
  const out: TimeReportAllowance[] = [];
  for (let i = 0; i < entryIds.length; i += 200) {
    const { data, error } = await supabase
      .from("time_entry_allowances")
      .select("time_entry_id, type_name, unit, quantity, amount")
      .in("time_entry_id", entryIds.slice(i, i + 200));
    if (error) throw error;
    (data ?? []).forEach((r: any) =>
      out.push({
        time_entry_id: r.time_entry_id,
        type_name: r.type_name,
        unit: r.unit,
        quantity: Number(r.quantity) || 0,
        amount: Number(r.amount) || 0,
      })
    );
  }
  // Materialforbruk vises i samme kolonne som materialtillegg
  for (let i = 0; i < entryIds.length; i += 200) {
    const { data, error } = await supabase
      .from("time_entry_materials")
      .select("time_entry_id, name, unit, quantity, amount")
      .in("time_entry_id", entryIds.slice(i, i + 200));
    if (error) throw error;
    (data ?? []).forEach((r: any) =>
      out.push({
        time_entry_id: r.time_entry_id,
        type_name: r.name,
        unit: r.unit,
        quantity: Number(r.quantity) || 0,
        amount: Number(r.amount) || 0,
      })
    );
  }
  return out;
}

export async function generateTimeReportPdf(opts: TimeReportOptions): Promise<string> {
  const { entries, companyName, logoUrl, startDate, endDate, subtitle } = opts;

  const allowances =
    opts.allowances ?? (await fetchTimeReportAllowances(entries.map((e) => e.id)));
  const byEntry = new Map<string, TimeReportAllowance[]>();
  allowances.forEach((a) => {
    const list = byEntry.get(a.time_entry_id) ?? [];
    list.push(a);
    byEntry.set(a.time_entry_id, list);
  });

  const sorted = [...entries].sort(
    (a, b) =>
      new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime() ||
      (a.user_name || "").localeCompare(b.user_name || "", "nb")
  );

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  await registerPdfFont(doc);
  doc.setFont("Inter", "normal");

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;

  const periodLabel =
    startDate && endDate
      ? `${format(startDate, "dd.MM.yyyy", { locale: nb })} – ${format(endDate, "dd.MM.yyyy", { locale: nb })}`
      : format(new Date(), "dd.MM.yyyy", { locale: nb });

  let logoBase64: string | null = null;
  if (logoUrl) {
    try {
      logoBase64 = await loadImageAsBase64(logoUrl);
    } catch {
      logoBase64 = null;
    }
  }

  doc.setFont("Inter", "bold");
  doc.setFontSize(18);
  doc.text(`Timeliste ${periodLabel}`, margin, 16);
  doc.setFont("Inter", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(subtitle ? `${companyName} • ${subtitle}` : companyName, margin, 22);
  doc.setTextColor(0);

  if (logoBase64) {
    try {
      const props = doc.getImageProperties(logoBase64);
      const maxW = 35;
      const maxH = 16;
      const ratio = Math.min(maxW / props.width, maxH / props.height);
      const w = props.width * ratio;
      const h = props.height * ratio;
      doc.addImage(logoBase64, "PNG", pageWidth - margin - w, 8, w, h);
    } catch {
      /* logo er valgfri */
    }
  }

  let totalHours = 0;
  let totalBreak = 0;
  let totalKm = 0;
  let totalCost = 0;
  const materialTotals: Record<string, number> = {};

  const body = sorted.map((e) => {
    const list = byEntry.get(e.id) ?? [];
    const kmList = list.filter(isKm);
    const costList = list.filter((a) => !isKm(a) && isCost(a));
    const matList = list.filter((a) => !isKm(a) && !isCost(a));

    const km = kmList.reduce((s, a) => s + a.quantity, 0);
    const cost = costList.reduce((s, a) => s + a.amount, 0);
    const brk = breakMinutes(e);

    totalHours += Number(e.hours) || 0;
    totalBreak += brk;
    totalKm += km;
    totalCost += cost;
    kmList.forEach((a) => {
      materialTotals[a.type_name] = (materialTotals[a.type_name] || 0) + a.quantity;
    });
    matList.forEach((a) => {
      materialTotals[a.type_name] = (materialTotals[a.type_name] || 0) + a.quantity;
    });

    return [
      format(new Date(e.entry_date), "dd.MM.yyyy", { locale: nb }),
      e.customer_name || "",
      e.project_name || "",
      e.project_number || "",
      e.subproject || "",
      e.user_name || "",
      durationCell(e),
      brk ? `${brk} m` : "",
      (e.tags ?? []).join(", "),
      overtimeCell(e),
      km ? km.toFixed(2) : "",
      cost ? cost.toFixed(2) : "",
      [...kmList, ...matList]
        .map((a) => `${a.quantity.toFixed(2)} stk. ${a.type_name}`)
        .join("\n"),
      e.description || "",
    ];
  });

  autoTable(doc, {
    startY: 28,
    head: [
      [
        "Dato",
        "Kunde",
        "Prosjekt",
        "Prosjektnr.",
        "Underprosjekt",
        "Bruker",
        "Varighet",
        "Pause",
        "Tagger",
        "Overtid",
        "KM",
        "Kostnader",
        "Materialforbruk",
        "Notat",
      ],
    ],
    body,
    theme: "grid",
    margin: { left: margin, right: margin },
    styles: {
      font: "Inter",
      fontSize: 7,
      cellPadding: 1.4,
      overflow: "linebreak",
      valign: "middle",
      lineColor: [210, 210, 210],
      textColor: [30, 30, 30],
    },
    headStyles: {
      font: "Inter",
      fontStyle: "bold",
      fontSize: 7,
      fillColor: [242, 244, 247],
      textColor: [30, 30, 30],
      lineColor: [200, 200, 200],
    },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 23 },
      2: { cellWidth: 25 },
      3: { cellWidth: 21 },
      4: { cellWidth: 21 },
      5: { cellWidth: 24 },
      6: { cellWidth: 19, halign: "center" },
      7: { cellWidth: 11, halign: "center" },
      8: { cellWidth: 16 },
      9: { cellWidth: 13, halign: "center" },
      10: { cellWidth: 12, halign: "right" },
      11: { cellWidth: 16, halign: "right" },
      12: { cellWidth: 22 },
      13: { cellWidth: "auto" },
    },
    didDrawPage: () => {
      const page = doc.getNumberOfPages();
      doc.setFont("Inter", "normal");
      doc.setFontSize(7);
      doc.setTextColor(130);
      doc.text(
        `${companyName} • Timeliste ${periodLabel}`,
        margin,
        doc.internal.pageSize.getHeight() - 6
      );
      doc.text(
        `Side ${page}`,
        pageWidth - margin,
        doc.internal.pageSize.getHeight() - 6,
        { align: "right" }
      );
      doc.setTextColor(0);
    },
  });

  // Oppsummering
  const lastY = (doc as any).lastAutoTable?.finalY ?? 28;
  const summaryStart = lastY + 10 > doc.internal.pageSize.getHeight() - 45 ? undefined : lastY + 10;
  if (summaryStart === undefined) doc.addPage();

  const y = summaryStart ?? 20;
  doc.setFont("Inter", "bold");
  doc.setFontSize(12);
  doc.text("Oppsummering", margin, y);

  const brkH = Math.floor(totalBreak / 60);
  const brkM = totalBreak % 60;
  const materialText =
    Object.entries(materialTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([name, qty]) => `${qty.toFixed(2)} ${name} (stk.)`)
      .join("   ") || "-";

  autoTable(doc, {
    startY: y + 3,
    body: [
      ["Timer", `${totalHours.toFixed(2).replace(".", ",")} t`],
      ["Pause", brkM ? `${brkH} t ${brkM} m` : `${brkH} t`],
      ["Kostnader", totalCost.toFixed(2).replace(".", ",")],
      ["KM", totalKm.toFixed(2).replace(".", ",")],
      ["Materialforbruk", materialText],
    ],
    theme: "grid",
    margin: { left: margin, right: margin },
    styles: { font: "Inter", fontSize: 8, cellPadding: 2, overflow: "linebreak" },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: "bold" },
      1: { cellWidth: "auto" },
    },
  });

  const fileName = `Timeliste_${companyName.replace(/[^a-zA-Z0-9æøåÆØÅ]/g, "_")}_${
    startDate ? format(startDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
  }.pdf`;
  doc.save(fileName);
  return fileName;
}
