import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { generatePdfHeader, addPdfFooter, PdfHeaderInfo } from "./ksModule2PdfHeader";
import { KsModule2Avvik } from "@/hooks/useKsModule2Avvik";
import { KsModule2Project } from "@/hooks/useKsModule2Projects";

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

export function generateKsModule2AvvikPdf(options: GenerateAvvikPdfOptions): { blob: Blob; fileName: string } {
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

  // Corrective action
  if (avvik.corrective_action) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Korrigerende tiltak", 15, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const corrLines = doc.splitTextToSize(avvik.corrective_action, 180);
    doc.text(corrLines, 15, yPos);
    yPos += corrLines.length * 5 + 10;
  }

  // Preventive action
  if (avvik.preventive_action) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Forebyggende tiltak", 15, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const prevLines = doc.splitTextToSize(avvik.preventive_action, 180);
    doc.text(prevLines, 15, yPos);
    yPos += prevLines.length * 5 + 10;
  }

  // Closure info
  if (avvik.closed_at && avvik.closed_by_name) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(34, 197, 94, 30);
    doc.roundedRect(15, yPos, 180, 20, 3, 3, "F");

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Avvik lukket", 20, yPos + 8);

    doc.setFont("helvetica", "normal");
    doc.text(`Lukket av: ${avvik.closed_by_name}`, 20, yPos + 15);
    doc.text(`Dato: ${format(new Date(avvik.closed_at), "dd.MM.yyyy HH:mm", { locale: nb })}`, 100, yPos + 15);
  }

  // Add footer to all pages
  addPdfFooter(doc, headerInfo);

  const fileName = `Avvik_${avvik.avvik_number}_${project.project_number}_${format(new Date(), "yyyyMMdd")}.pdf`;
  const blob = doc.output("blob");

  return { blob, fileName };
}

export function downloadKsModule2AvvikPdf(options: GenerateAvvikPdfOptions): void {
  const { blob, fileName } = generateKsModule2AvvikPdf(options);
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
