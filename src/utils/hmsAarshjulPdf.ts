import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { registerPdfFont, PDF_FONT } from "@/utils/pdfFont";
import { AARSHJUL_MONTH_NAMES, type AarshjulRow } from "@/utils/hmsAarshjulData";

export interface AarshjulPdfMeta {
  companyName: string;
  orgNumber?: string | null;
  year?: number;
}

/**
 * Draws the årshjul (annual wheel) overview table into an existing PDF document.
 * Returns the Y position after the table.
 */
export function drawAarshjulTable(
  doc: jsPDF,
  rows: AarshjulRow[],
  opts: { startY: number; margin: number; year?: number }
): number {
  const { startY, margin } = opts;
  const year = opts.year ?? new Date().getFullYear();

  const body: any[] = [];
  for (let month = 1; month <= 12; month++) {
    const monthRows = rows.filter((r) => r.month === month);
    if (monthRows.length === 0) {
      body.push([AARSHJUL_MONTH_NAMES[month - 1], "-", "", "", ""]);
      continue;
    }
    monthRows.forEach((r, i) => {
      body.push([
        i === 0 ? AARSHJUL_MONTH_NAMES[month - 1] : "",
        r.name,
        r.description,
        r.responsible,
        r.completedDate ? `Utført ${r.completedDate}` : "Planlagt",
      ]);
    });
  }

  autoTable(doc, {
    startY,
    head: [["Måned", "Aktivitet", "Beskrivelse", "Ansvarlig", `Status ${year}`]],
    body,
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246], fontSize: 9, fontStyle: "bold" },
    bodyStyles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 22, fontStyle: "bold" },
      1: { cellWidth: 40 },
      2: { cellWidth: 55 },
      3: { cellWidth: 28 },
      4: { cellWidth: 25 },
    },
    margin: { left: margin, right: margin },
  });

  return (doc as any).lastAutoTable.finalY + 10;
}

/** Generates and downloads a standalone PDF containing only the årshjul. */
export async function downloadAarshjulPdf(rows: AarshjulRow[], meta: AarshjulPdfMeta) {
  const year = meta.year ?? new Date().getFullYear();
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  await registerPdfFont(doc);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, pageWidth, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont(PDF_FONT, "bold");
  doc.setFontSize(18);
  doc.text(`HMS-årshjul ${year}`, margin, 15);
  doc.setFontSize(11);
  doc.setFont(PDF_FONT, "normal");
  doc.text(meta.companyName || "", margin, 24);
  if (meta.orgNumber) {
    doc.text(`Org.nr: ${meta.orgNumber}`, pageWidth - margin, 24, { align: "right" });
  }

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  let y = 44;
  doc.text(
    "Oversikt over planlagte HMS-aktiviteter gjennom året, med ansvarlig og status.",
    margin,
    y
  );
  y += 8;

  y = drawAarshjulTable(doc, rows, { startY: y, margin, year });

  const total = rows.length;
  const done = rows.filter((r) => r.completedDate).length;
  if (y > pageHeight - 30) {
    doc.addPage();
    y = margin;
  }
  doc.setFont(PDF_FONT, "bold");
  doc.setFontSize(10);
  doc.text(`Totalt ${total} planlagte aktiviteter — ${done} utført hittil i ${year}.`, margin, y);

  doc.setFont(PDF_FONT, "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Generert ${new Date().toLocaleDateString("nb-NO")} · Totalik.no`,
    margin,
    pageHeight - 10
  );

  const safeName = (meta.companyName || "bedrift").replace(/[^a-zA-Z0-9æøåÆØÅ]+/g, "_");
  doc.save(`HMS-arshjul_${safeName}_${year}.pdf`);
}
