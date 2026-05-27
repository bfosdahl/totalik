import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { generatePdfHeader, addPdfFooter, PdfHeaderInfo } from "./ksModule2PdfHeader";
import type { DailyReport } from "@/hooks/useKsDailyReports";
import { compressDataUrl } from "./imageCompression";

const BUCKET = "daily-report-photos";

export type PdfProgressCallback = (current: number, total: number, label?: string) => void;

async function fetchAndCompressPhoto(path: string): Promise<{ dataUrl: string; w: number; h: number } | null> {
  try {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 600);
    if (!data?.signedUrl) return null;
    const res = await fetch(data.signedUrl);
    const blob = await res.blob();
    const rawDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    // Compress aggressively — 40+ photos at full resolution will OOM the PDF generator
    const compressed = await compressDataUrl(rawDataUrl, 1200, 0.75);
    return compressed;
  } catch (e) {
    console.warn("Could not load photo for PDF", path, e);
    return null;
  }
}

export interface DailyReportPdfProject {
  project_name?: string;
  project_number?: string;
  address?: string | null;
  gnr_bnr?: string | null;
  saksnr?: string | null;
  client_name?: string | null;
  partner_logo_url?: string | null;
  partner_name?: string | null;
  partner_org_number?: string | null;
}

export interface DailyReportPdfCompany {
  name?: string;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  org_number?: string | null;
  phone?: string | null;
  email?: string | null;
  logo_url?: string | null;
}

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function buildDailyReportPdf(
  report: DailyReport,
  project: DailyReportPdfProject | null,
  company: DailyReportPdfCompany | null,
  onProgress?: PdfProgressCallback
): Promise<{ doc: jsPDF; fileName: string }> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;

  const headerInfo: PdfHeaderInfo = {
    documentType: "EGENKONTROLL",
    documentNumber: report.report_number,
    project: {
      project_name: project?.project_name || "Ukjent prosjekt",
      project_number: project?.project_number || "—",
      address: project?.address,
      gnr_bnr: project?.gnr_bnr,
      saksnr: project?.saksnr,
      client_name: project?.client_name,
    },
    company: {
      name: company?.name || "—",
      address: company?.address,
      postal_code: company?.postal_code,
      city: company?.city,
      org_number: company?.org_number,
      phone: company?.phone,
      email: company?.email,
    },
    responsible: report.user_name,
    createdDate: report.created_at,
    completedDate: report.submitted_at,
  };

  // === Pre-load + compress logos so they embed cleanly in the blue header ===
  onProgress?.(0, 0, "Laster logoer...");
  const loadLogoCompressed = async (url: string | null | undefined) => {
    if (!url) return null;
    const raw = await loadImageAsDataUrl(url);
    if (!raw) return null;
    try {
      // Compress to a reasonable size for header (preserves aspect ratio)
      const c = await compressDataUrl(raw, 600, 0.92);
      return c.dataUrl;
    } catch {
      return raw;
    }
  };
  const ownLogoData = await loadLogoCompressed(company?.logo_url);
  const partnerLogoData = await loadLogoCompressed(project?.partner_logo_url);

  // === CUSTOM BLUE HEADER (replaces generatePdfHeader to avoid overlap) ===
  const headerH = 44;
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, headerH, "F");

  // Own logo: white pill in the blue band, left side
  let titleX = 15;
  if (ownLogoData) {
    const logoBoxW = 40;
    const logoBoxH = 28;
    const logoBoxX = 10;
    const logoBoxY = (headerH - logoBoxH) / 2;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(logoBoxX, logoBoxY, logoBoxW, logoBoxH, 2, 2, "F");
    try {
      const pad = 2;
      doc.addImage(
        ownLogoData,
        "JPEG",
        logoBoxX + pad,
        logoBoxY + pad,
        logoBoxW - pad * 2,
        logoBoxH - pad * 2,
        undefined,
        "FAST"
      );
    } catch { /* skip */ }
    titleX = logoBoxX + logoBoxW + 6;
  }

  // Title block (left, after logo)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("DAGSRAPPORT", titleX, 17);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Nr: ${report.report_number}`, titleX, 25);
  doc.setFontSize(8);
  doc.text(
    `Generert: ${format(new Date(), "dd.MM.yyyy HH:mm", { locale: nb })}`,
    titleX,
    32
  );

  // Right side: optional partner logo + company name
  let rightX = pageWidth - 10;
  if (partnerLogoData) {
    const pBoxW = 34;
    const pBoxH = 24;
    const pBoxX = pageWidth - pBoxW - 10;
    const pBoxY = (headerH - pBoxH) / 2;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(pBoxX, pBoxY, pBoxW, pBoxH, 2, 2, "F");
    try {
      doc.addImage(
        partnerLogoData,
        "JPEG",
        pBoxX + 2,
        pBoxY + 2,
        pBoxW - 4,
        pBoxH - 4,
        undefined,
        "FAST"
      );
    } catch { /* skip */ }
    rightX = pBoxX - 4;
  }

  // Partner attribution to the LEFT of the partner logo box (firmanavn vises i info-kortet under)
  if (project?.partner_name) {
    let rightY = 16;
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("i samarbeid med", rightX, rightY, { align: "right" });
    rightY += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(project.partner_name, rightX, rightY, { align: "right" });
    rightY += 4;
    if (project?.partner_org_number) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text(`Org.nr: ${project.partner_org_number}`, rightX, rightY, { align: "right" });
    }
  }

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");

  // === INFO CARD ===
  let y = headerH + 6;
  const cardH = 48;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(10, y, pageWidth - 20, cardH, 3, 3, "FD");

  const leftCol = 15;
  const rightCol = pageWidth / 2 + 5;
  let leftY = y + 8;
  let rightY2 = y + 8;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("PROSJEKT", leftCol, leftY); leftY += 5;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(headerInfo.project.project_name, leftCol, leftY); leftY += 5;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Prosjektnr: ${headerInfo.project.project_number}`, leftCol, leftY); leftY += 5;
  if (headerInfo.project.address) { doc.text(`Adresse: ${headerInfo.project.address}`, leftCol, leftY); leftY += 5; }
  if (headerInfo.project.client_name) {
    doc.setFont("helvetica", "italic");
    doc.text(`Byggherre: ${headerInfo.project.client_name}`, leftCol, leftY);
  }

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("UTFØRENDE FIRMA", rightCol, rightY2); rightY2 += 5;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  if (company?.address) { doc.text(company.address, rightCol, rightY2); rightY2 += 4; }
  if (company?.postal_code || company?.city) {
    doc.text([company.postal_code, company.city].filter(Boolean).join(" "), rightCol, rightY2);
    rightY2 += 4;
  }
  if (company?.phone) { doc.text(`Tlf: ${company.phone}`, rightCol, rightY2); rightY2 += 4; }
  if (company?.email) { doc.text(`E-post: ${company.email}`, rightCol, rightY2); rightY2 += 4; }
  rightY2 += 1;
  doc.setFont("helvetica", "bold");
  doc.text(`Ansvarlig: ${report.user_name}`, rightCol, rightY2);

  y += cardH + 6;
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  // Date banner
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 10, 2, 2, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text(
    `Rapportdato: ${format(new Date(report.report_date), "EEEE d. MMMM yyyy", { locale: nb })}`,
    margin + 3,
    y + 7
  );
  y += 16;
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 25) {
      doc.addPage();
      y = 20;
    }
  };

  const section = (title: string) => {
    ensureSpace(10);
    doc.setFillColor(59, 130, 246);
    doc.rect(margin, y, 3, 6, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(title.toUpperCase(), margin + 6, y + 5);
    y += 9;
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  };

  const para = (text: string) => {
    const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
    ensureSpace(lines.length * 5 + 2);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 2;
  };

  const kv = (label: string, value: string) => {
    ensureSpace(6);
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, margin + 35, y);
    y += 5;
  };

  // Weather
  if (report.weather_conditions || report.temperature_celsius != null || report.wind_conditions || report.precipitation) {
    section("Værforhold");
    if (report.weather_conditions) kv("Vær", report.weather_conditions);
    if (report.temperature_celsius != null) kv("Temperatur", `${report.temperature_celsius} °C`);
    if (report.wind_conditions) kv("Vind", report.wind_conditions);
    if (report.precipitation) kv("Nedbør", report.precipitation);
    y += 2;
  }

  // Crew
  if (report.own_crew_count > 0 || report.subcontractor_attendance?.length > 0) {
    section("Mannskap");
    if (report.own_crew_count > 0) kv("Egne ansatte", `${report.own_crew_count}`);
    if (report.subcontractor_attendance?.length > 0) {
      report.subcontractor_attendance.forEach((s: any) => kv(`UE ${s.name}`, `${s.count} pers`));
    }
    y += 2;
  }

  // Work
  if (report.work_description || report.work_areas) {
    section("Utført arbeid");
    if (report.work_description) para(report.work_description);
    if (report.work_areas) kv("Områder", report.work_areas);
    y += 2;
  }

  // Equipment / materials
  if (report.equipment_used?.length > 0 || report.materials_received?.length > 0) {
    section("Utstyr og materialer");
    if (report.equipment_used?.length > 0) {
      kv("Utstyr", report.equipment_used.map((e: any) => e.name || e).join(", "));
    }
    if (report.materials_received?.length > 0) {
      kv("Materialer", report.materials_received.map((m: any) => m.name || m).join(", "));
    }
    y += 2;
  }

  // Progress
  if (report.progress_description || report.progress_percentage != null) {
    section("Fremdrift");
    if (report.progress_description) para(report.progress_description);
    if (report.progress_percentage != null) kv("Fremdrift", `${report.progress_percentage} %`);
    kv("Status", report.on_schedule ? "I rute" : "Forsinket");
    if (!report.on_schedule && report.delay_reason) kv("Årsak", report.delay_reason);
    y += 2;
  }

  // Quality
  if (report.quality_controls?.length > 0) {
    section("Kvalitetskontroller");
    report.quality_controls.forEach((q: any) => para(`• ${q.description || q}`));
    y += 2;
  }

  // HMS
  if (report.hms_incidents?.length > 0 || report.hms_observations || report.safety_meeting_held) {
    section("HMS / Sikkerhet");
    if (report.safety_meeting_held) para("- Sikkerhetsmøte avholdt");
    if (report.hms_incidents?.length > 0) {
      report.hms_incidents.forEach((h: any) => para(`• ${h.description || h}`));
    }
    if (report.hms_observations) para(report.hms_observations);
    y += 2;
  }

  // Deviations
  if (report.deviations_today?.length > 0) {
    section("Avvik registrert i dag");
    report.deviations_today.forEach((d: any) => para(`• ${d.description || d}`));
    y += 2;
  }

  // Notes
  if (report.notes) {
    section("Merknader");
    para(report.notes);
  }

  // Photos — batch + compress to avoid OOM/hang on 40+ images
  if (report.photos?.length > 0) {
    section(`Vedlagte bilder (${report.photos.length})`);
    const cols = 2;
    const gap = 4;
    const imgW = (pageWidth - 2 * margin - gap) / cols;
    let col = 0;
    let rowMaxH = 0;
    let rowStartY = y;

    const photos = report.photos as any[];
    const BATCH = 5;
    let processed = 0;

    for (let i = 0; i < photos.length; i += BATCH) {
      const slice = photos.slice(i, i + BATCH);
      const loaded = await Promise.all(slice.map((p) => fetchAndCompressPhoto(p.path)));
      for (const data of loaded) {
        processed++;
        onProgress?.(processed, photos.length, `Behandler bilde ${processed} av ${photos.length}…`);
        if (!data) continue;
        const ratio = data.h / data.w;
        const imgH = Math.min(imgW * ratio, 80);

        if (col === 0) {
          ensureSpace(imgH + 6);
          rowStartY = y;
          rowMaxH = 0;
        }

        const x = margin + col * (imgW + gap);
        try {
          doc.addImage(data.dataUrl, "JPEG", x, rowStartY, imgW, imgH, undefined, "FAST");
        } catch (e) {
          console.warn("addImage failed", e);
        }
        rowMaxH = Math.max(rowMaxH, imgH);

        col++;
        if (col >= cols) {
          col = 0;
          y = rowStartY + rowMaxH + gap;
        }
      }
      // Yield to UI thread so progress can render
      await new Promise((r) => setTimeout(r, 0));
    }

    if (col !== 0) {
      y = rowStartY + rowMaxH + gap;
    }
  }

  // Signature line
  ensureSpace(25);
  y += 8;
  doc.setDrawColor(148, 163, 184);
  doc.line(margin, y, margin + 70, y);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Rapportert av", margin, y + 4);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(report.user_name, margin, y - 2);

  addPdfFooter(doc, headerInfo);

  const fileName = `Dagsrapport_${report.report_number}_${format(new Date(report.report_date), "yyyy-MM-dd")}.pdf`;
  return { doc, fileName };
}

export async function generateDailyReportPdf(
  report: DailyReport,
  project: DailyReportPdfProject | null,
  company: DailyReportPdfCompany | null,
  onProgress?: PdfProgressCallback
): Promise<void> {
  const { doc, fileName } = await buildDailyReportPdf(report, project, company, onProgress);
  doc.save(fileName);
}

export async function generateDailyReportPdfBase64(
  report: DailyReport,
  project: DailyReportPdfProject | null,
  company: DailyReportPdfCompany | null
): Promise<{ base64: string; fileName: string }> {
  const { doc, fileName } = await buildDailyReportPdf(report, project, company);
  const dataUri = doc.output("datauristring");
  const base64 = dataUri.split(",")[1] || "";
  return { base64, fileName };
}
