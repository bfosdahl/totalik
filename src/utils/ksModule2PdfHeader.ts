import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export interface PdfHeaderInfo {
  documentType: "SJEKKLISTE" | "AVVIKSMELDING" | "VERNERUNDE" | "EGENKONTROLL" | "UK-KONTROLL" | "SJA";
  documentNumber: string;
  project: {
    project_name: string;
    project_number: string;
    address?: string | null;
    gnr_bnr?: string | null;
    saksnr?: string | null;
    client_name?: string | null;
  };
  company: {
    name: string;
    address?: string | null;
    postal_code?: string | null;
    city?: string | null;
    org_number?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  responsible?: string | null;
  createdDate?: string;
  completedDate?: string | null;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  SJEKKLISTE: "SJEKKLISTE",
  AVVIKSMELDING: "AVVIKSMELDING",
  VERNERUNDE: "VERNERUNDE",
  EGENKONTROLL: "EGENKONTROLL",
  "UK-KONTROLL": "UAVHENGIG KONTROLL",
  SJA: "SIKKER JOBB ANALYSE",
};

/**
 * Generates a professional header for KS Modul #2 PDFs
 * Returns the Y position after the header for continued content
 */
export function generatePdfHeader(doc: jsPDF, info: PdfHeaderInfo): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 15;

  // === TOP HEADER BAR ===
  doc.setFillColor(59, 130, 246); // Blue
  doc.rect(0, 0, pageWidth, 35, "F");

  // Document type and number
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(DOCUMENT_TYPE_LABELS[info.documentType] || info.documentType, 15, 15);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Nr: ${info.documentNumber}`, 15, 25);

  // Company name in header (right side)
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(info.company.name, pageWidth - 15, 15, { align: "right" });

  if (info.company.org_number) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Org.nr: ${info.company.org_number}`, pageWidth - 15, 23, { align: "right" });
  }

  // Generation date
  doc.setFontSize(8);
  doc.text(`Generert: ${format(new Date(), "dd.MM.yyyy HH:mm", { locale: nb })}`, pageWidth - 15, 31, { align: "right" });

  yPos = 45;
  doc.setTextColor(0, 0, 0);

  // === INFO BOX ===
  doc.setFillColor(248, 250, 252); // Light gray
  doc.setDrawColor(226, 232, 240); // Border
  doc.roundedRect(10, yPos, pageWidth - 20, 52, 3, 3, "FD");

  const leftCol = 15;
  const rightCol = pageWidth / 2 + 5;
  let leftY = yPos + 10;
  let rightY = yPos + 10;

  // Left column - Project info
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("PROSJEKT", leftCol, leftY);
  leftY += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(info.project.project_name, leftCol, leftY);
  leftY += 5;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Prosjektnr: ${info.project.project_number}`, leftCol, leftY);
  leftY += 5;

  if (info.project.address) {
    doc.text(`Adresse: ${info.project.address}`, leftCol, leftY);
    leftY += 5;
  }

  if (info.project.gnr_bnr) {
    doc.text(`Gnr/Bnr: ${info.project.gnr_bnr}`, leftCol, leftY);
    leftY += 5;
  }

  if (info.project.saksnr) {
    doc.text(`Saksnr: ${info.project.saksnr}`, leftCol, leftY);
    leftY += 5;
  }

  // Right column - Company & dates
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("UTFØRENDE FIRMA", rightCol, rightY);
  rightY += 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);

  if (info.company.address) {
    doc.text(info.company.address, rightCol, rightY);
    rightY += 4;
  }

  if (info.company.postal_code || info.company.city) {
    const location = [info.company.postal_code, info.company.city].filter(Boolean).join(" ");
    doc.text(location, rightCol, rightY);
    rightY += 4;
  }

  if (info.company.phone) {
    doc.text(`Tlf: ${info.company.phone}`, rightCol, rightY);
    rightY += 4;
  }

  if (info.company.email) {
    doc.text(`E-post: ${info.company.email}`, rightCol, rightY);
    rightY += 4;
  }

  // Dates section (below company info)
  rightY += 3;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("DATOER", rightCol, rightY);
  rightY += 5;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);

  if (info.createdDate) {
    doc.text(`Opprettet: ${format(new Date(info.createdDate), "dd.MM.yyyy", { locale: nb })}`, rightCol, rightY);
    rightY += 4;
  }

  if (info.completedDate) {
    doc.text(`Fullført: ${format(new Date(info.completedDate), "dd.MM.yyyy HH:mm", { locale: nb })}`, rightCol, rightY);
    rightY += 4;
  }

  if (info.responsible) {
    doc.text(`Ansvarlig: ${info.responsible}`, rightCol, rightY);
  }

  // Byggherre/client if available
  if (info.project.client_name) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 116, 139);
    doc.text(`Byggherre: ${info.project.client_name}`, leftCol, yPos + 48);
  }

  // Reset colors for content
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");

  return yPos + 62; // Return Y position after header
}

/**
 * Adds a professional footer to all pages
 */
export function addPdfFooter(
  doc: jsPDF,
  info: PdfHeaderInfo,
  pageRange?: { start: number; end: number }
): void {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const start = pageRange?.start ?? 1;
  const end = pageRange?.end ?? pageCount;

  for (let i = start; i <= end; i++) {
    doc.setPage(i);

    // Footer line
    doc.setDrawColor(226, 232, 240);
    doc.line(10, pageHeight - 15, pageWidth - 10, pageHeight - 15);

    // Footer text
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);

    // Left: Document info — wrap long names so they don't collide with page number
    const leftText = `${info.documentType} ${info.documentNumber} | ${info.project.project_number} - ${info.project.project_name}`;
    const maxLeftWidth = pageWidth - 50; // reserve room for "Side X av Y"
    const leftLines = doc.splitTextToSize(leftText, maxLeftWidth);
    doc.text(leftLines[0] ?? leftText, 10, pageHeight - 8);

    // Right: Page number
    doc.text(`Side ${i} av ${pageCount}`, pageWidth - 10, pageHeight - 8, { align: "right" });
  }
}

/**
 * Generates a document number based on type and existing count
 */
export function generateDocumentNumber(
  type: "SK" | "AV" | "VR" | "EK" | "UK" | "SJA",
  existingCount: number
): string {
  const paddedNumber = String(existingCount + 1).padStart(4, "0");
  return `${type}-${paddedNumber}`;
}
