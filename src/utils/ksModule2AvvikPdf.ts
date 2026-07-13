import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { generatePdfHeader, addPdfFooter, PdfHeaderInfo } from "./ksModule2PdfHeader";
import { KsModule2Avvik } from "@/hooks/useKsModule2Avvik";
import { KsModule2Project } from "@/hooks/useKsModule2Projects";
import { supabase } from "@/integrations/supabase/client";

const CLOSURE_PREFIX = "🔒 Lukkekommentar:";

async function pathToDataUrl(pathOrUrl: string): Promise<{ dataUrl: string; type: string } | null> {
  try {
    let url = pathOrUrl;
    if (!/^https?:\/\//i.test(pathOrUrl)) {
      const { data, error } = await supabase.storage
        .from("ks-module2-avvik-photos")
        .createSignedUrl(pathOrUrl, 3600);
      if (error || !data?.signedUrl) return null;
      url = data.signedUrl;
    }
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const type = blob.type.includes("png") ? "PNG" : "JPEG";
    const dataUrl: string = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
    return { dataUrl, type };
  } catch {
    return null;
  }
}

function splitClosureComment(text: string | null | undefined): { corrective: string; closure: string | null } {
  if (!text) return { corrective: "", closure: null };
  const idx = text.indexOf(CLOSURE_PREFIX);
  if (idx === -1) return { corrective: text, closure: null };
  const closure = text.slice(idx + CLOSURE_PREFIX.length).trim();
  const corrective = text.slice(0, idx).trim();
  return { corrective, closure: closure || null };
}

interface Company {
  name: string;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  org_number?: string | null;
  phone?: string | null;
  email?: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  kvalitet: "Kvalitetsavvik",
  hms: "HMS-avvik",
  ks: "KS-avvik",
  tegning: "Tegningsavvik",
  material: "Materialavvik",
  annet: "Annet",
};

const SEVERITY_LABELS: Record<string, string> = {
  low: "Lav",
  medium: "Medium",
  high: "Høy",
  critical: "Kritisk",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Åpen",
  in_progress: "Under arbeid",
  closed: "Lukket",
};

interface GenerateAvvikPdfOptions {
  avvik: KsModule2Avvik;
  project: KsModule2Project;
  company: Company;
}

export async function generateKsModule2AvvikPdf(options: GenerateAvvikPdfOptions): Promise<{ blob: Blob; fileName: string }> {
  const { avvik, project, company } = options;
  const doc = new jsPDF();

  const headerInfo: PdfHeaderInfo = {
    documentType: "AVVIKSMELDING",
    documentNumber: avvik.avvik_number,
    project: {
      project_name: project.project_name,
      project_number: project.project_number,
      address: project.address,
      gnr_bnr: project.gnr_bnr,
      client_name: project.client_name,
    },
    company: {
      name: company.name,
      address: company.address,
      postal_code: company.postal_code,
      city: company.city,
      org_number: company.org_number,
      phone: company.phone,
      email: company.email,
    },
    responsible: avvik.responsible_name,
    createdDate: avvik.created_at,
    completedDate: avvik.closed_at,
  };

  let yPos = generatePdfHeader(doc, headerInfo);

  // Title
  yPos += 5;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(avvik.title, 15, yPos);
  yPos += 12;

  // Status and severity badges
  const severityColors: Record<string, [number, number, number]> = {
    low: [34, 197, 94],
    medium: [234, 179, 8],
    high: [249, 115, 22],
    critical: [239, 68, 68],
  };

  const statusColors: Record<string, [number, number, number]> = {
    open: [239, 68, 68],
    in_progress: [234, 179, 8],
    closed: [34, 197, 94],
  };

  // Severity badge
  const sevColor = severityColors[avvik.severity] || [156, 163, 175];
  doc.setFillColor(...sevColor);
  doc.roundedRect(15, yPos, 25, 7, 2, 2, "F");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text(SEVERITY_LABELS[avvik.severity] || avvik.severity, 17, yPos + 5);

  // Status badge
  const statColor = statusColors[avvik.status] || [156, 163, 175];
  doc.setFillColor(...statColor);
  doc.roundedRect(45, yPos, 30, 7, 2, 2, "F");
  doc.text(STATUS_LABELS[avvik.status] || avvik.status, 47, yPos + 5);

  doc.setTextColor(0, 0, 0);
  yPos += 15;

  // Details table
  const detailsData = [
    ["Kategori", CATEGORY_LABELS[avvik.category] || avvik.category],
    ["Alvorlighetsgrad", SEVERITY_LABELS[avvik.severity] || avvik.severity],
    ["Status", STATUS_LABELS[avvik.status] || avvik.status],
    ["Oppdaget dato", format(new Date(avvik.discovered_date), "dd.MM.yyyy", { locale: nb })],
    ["Rapportert av", avvik.reported_by_name],
    ["Ansvarlig", avvik.responsible_name || "-"],
  ];

  if (avvik.location) {
    detailsData.push(["Lokasjon", avvik.location]);
  }

  if (avvik.deadline) {
    detailsData.push(["Frist", format(new Date(avvik.deadline), "dd.MM.yyyy", { locale: nb })]);
  }

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: detailsData,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 45, textColor: [100, 116, 139] },
      1: { cellWidth: "auto" },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Description
  if (avvik.description) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Beskrivelse", 15, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const descLines = doc.splitTextToSize(avvik.description, 180);
    doc.text(descLines, 15, yPos);
    yPos += descLines.length * 5 + 10;
  }

  // Root cause
  if (avvik.root_cause) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Rotårsak", 15, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const rootLines = doc.splitTextToSize(avvik.root_cause, 180);
    doc.text(rootLines, 15, yPos);
    yPos += rootLines.length * 5 + 10;
  }

  // Split closure comment (stored with 🔒 Lukkekommentar: prefix) out of corrective action
  const { corrective, closure } = splitClosureComment(avvik.corrective_action);

  const updatedLabel = avvik.updated_at
    ? format(new Date(avvik.updated_at), "dd.MM.yyyy HH:mm", { locale: nb })
    : null;
  const responsibleLabel = avvik.responsible_name || "Ikke tildelt";

  // Corrective action
  if (corrective) {
    if (yPos > 235) { doc.addPage(); yPos = 20; }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Korrigerende tiltak", 15, yPos);
    yPos += 6;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Ansvarlig: ${responsibleLabel}${updatedLabel ? `   ·   Sist endret: ${updatedLabel}` : ""}`,
      15,
      yPos
    );
    doc.setTextColor(0, 0, 0);
    yPos += 6;
    doc.setFontSize(10);
    const corrLines = doc.splitTextToSize(corrective, 180);
    doc.text(corrLines, 15, yPos);
    yPos += corrLines.length * 5 + 10;
  }

  // Preventive action
  if (avvik.preventive_action) {
    if (yPos > 235) { doc.addPage(); yPos = 20; }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Forebyggende tiltak", 15, yPos);
    yPos += 6;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Ansvarlig: ${responsibleLabel}`, 15, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 6;
    doc.setFontSize(10);
    const prevLines = doc.splitTextToSize(avvik.preventive_action, 180);
    doc.text(prevLines, 15, yPos);
    yPos += prevLines.length * 5 + 10;
  }

  // Closure info + closure comment
  if (avvik.closed_at && avvik.closed_by_name) {
    const closureLines = closure ? doc.splitTextToSize(closure, 170) : [];
    const boxHeight = 22 + (closureLines.length ? closureLines.length * 5 + 6 : 0);
    if (yPos + boxHeight > 275) { doc.addPage(); yPos = 20; }

    doc.setFillColor(220, 252, 231);
    doc.roundedRect(15, yPos, 180, boxHeight, 3, 3, "F");

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(21, 128, 61);
    doc.text("Avvik lukket", 20, yPos + 8);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(`Lukket av: ${avvik.closed_by_name}`, 20, yPos + 15);
    doc.text(`Dato: ${format(new Date(avvik.closed_at), "dd.MM.yyyy HH:mm", { locale: nb })}`, 100, yPos + 15);

    if (closureLines.length) {
      doc.setFont("helvetica", "bold");
      doc.text("Lukkekommentar:", 20, yPos + 22);
      doc.setFont("helvetica", "normal");
      doc.text(closureLines, 20, yPos + 27);
    }
    yPos += boxHeight + 8;
  } else if (updatedLabel && avvik.updated_at !== avvik.created_at) {
    // No closure yet, but show last-edited metadata to match dialog footer
    if (yPos > 260) { doc.addPage(); yPos = 20; }
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 116, 139);
    doc.text(`Sist endret: ${updatedLabel}   ·   Ansvarlig: ${responsibleLabel}`, 15, yPos);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    yPos += 8;
  }

  // Photos - each with a clear title in the same order as shown in the View/Close dialog
  const photoPaths: string[] = Array.isArray((avvik as any).photo_paths) ? (avvik as any).photo_paths : [];
  if (photoPaths.length > 0) {
    doc.addPage();
    yPos = 20;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Bilder (${photoPaths.length})`, 15, yPos);
    yPos += 10;

    const imgWidth = 85;
    const imgHeight = 65;
    const captionHeight = 10;
    const blockHeight = captionHeight + imgHeight + 6;
    const gap = 8;
    let col = 0;
    let rowTop = yPos;

    for (let i = 0; i < photoPaths.length; i++) {
      const p = photoPaths[i];
      const img = await pathToDataUrl(p);
      if (col === 0) rowTop = yPos;
      if (rowTop + blockHeight > 285) {
        doc.addPage();
        yPos = 20;
        rowTop = yPos;
        col = 0;
      }
      const x = 15 + col * (imgWidth + gap);
      const fileName = (p.split("/").pop() || `bilde-${i + 1}`).slice(0, 40);

      // Caption above image
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(`Bilde ${i + 1} av ${photoPaths.length}`, x, rowTop + 4);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(fileName, x, rowTop + 8);
      doc.setTextColor(0, 0, 0);

      if (img) {
        try {
          doc.addImage(img.dataUrl, img.type, x, rowTop + captionHeight, imgWidth, imgHeight, undefined, "FAST");
        } catch {
          doc.setFontSize(8);
          doc.text("(kunne ikke laste bilde)", x, rowTop + captionHeight + 10);
        }
      } else {
        doc.setFontSize(8);
        doc.text("(bilde utilgjengelig)", x, rowTop + captionHeight + 10);
      }

      col += 1;
      if (col >= 2) {
        col = 0;
        yPos = rowTop + blockHeight;
      }
    }
    if (col !== 0) yPos = rowTop + blockHeight;
  }

  // Add footer to all pages
  addPdfFooter(doc, headerInfo);

  const fileName = `Avvik_${avvik.avvik_number}_${project.project_number}_${format(new Date(), "yyyyMMdd")}.pdf`;
  const blob = doc.output("blob");

  return { blob, fileName };
}

export async function downloadKsModule2AvvikPdf(options: GenerateAvvikPdfOptions): Promise<void> {
  const { blob, fileName } = await generateKsModule2AvvikPdf(options);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

// Export multiple avvik to PDF
export function downloadKsModule2AvvikListPdf(
  avvikList: KsModule2Avvik[],
  project: KsModule2Project,
  company: Company
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  const headerInfo: PdfHeaderInfo = {
    documentType: "AVVIKSMELDING",
    documentNumber: `LISTE-${project.project_number}`,
    project: {
      project_name: project.project_name,
      project_number: project.project_number,
      address: project.address,
      gnr_bnr: project.gnr_bnr,
      client_name: project.client_name,
    },
    company: {
      name: company.name,
      address: company.address,
      postal_code: company.postal_code,
      city: company.city,
      org_number: company.org_number,
      phone: company.phone,
      email: company.email,
    },
    createdDate: new Date().toISOString(),
  };

  let yPos = generatePdfHeader(doc, headerInfo);

  // Title
  yPos += 5;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Avviksoversikt", 15, yPos);
  yPos += 12;

  // Summary
  const openCount = avvikList.filter(a => a.status === "open").length;
  const inProgressCount = avvikList.filter(a => a.status === "in_progress").length;
  const closedCount = avvikList.filter(a => a.status === "closed").length;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Totalt: ${avvikList.length} | Åpne: ${openCount} | Under arbeid: ${inProgressCount} | Lukket: ${closedCount}`, 15, yPos);
  yPos += 10;

  // Table
  const tableData = avvikList.map(a => [
    a.avvik_number,
    a.title,
    CATEGORY_LABELS[a.category] || a.category,
    SEVERITY_LABELS[a.severity] || a.severity,
    STATUS_LABELS[a.status] || a.status,
    a.responsible_name || "-",
    a.deadline ? format(new Date(a.deadline), "dd.MM.yy", { locale: nb }) : "-",
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Nr", "Tittel", "Kategori", "Alvorlighet", "Status", "Ansvarlig", "Frist"]],
    body: tableData,
    theme: "striped",
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 50 },
      2: { cellWidth: 30 },
      3: { cellWidth: 22 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25 },
      6: { cellWidth: 18 },
    },
  });

  // Add footer to all pages
  addPdfFooter(doc, headerInfo);

  const fileName = `Avviksliste_${project.project_number}_${format(new Date(), "yyyyMMdd")}.pdf`;
  doc.save(fileName);
}
