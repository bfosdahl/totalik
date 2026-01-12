import { jsPDF } from "jspdf";
import { ChecklistItem } from "@/hooks/useKsModule2Checklists";

interface ChecklistPdfOptions {
  title: string;
  templateName: string;
  projectName?: string;
  responsibleName?: string;
  deadlineDate?: string;
  items: Omit<ChecklistItem, "value" | "comment" | "photos">[];
  companyName?: string;
  companyLogo?: string;
}

export const generateChecklistTemplatePdf = async (options: ChecklistPdfOptions): Promise<Blob> => {
  const {
    title,
    templateName,
    projectName,
    responsibleName,
    deadlineDate,
    items,
    companyName,
  } = options;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("EGENKONTROLL - PAPIRSKJEMA", pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  doc.setFontSize(14);
  doc.text(templateName, pageWidth / 2, yPos, { align: "center" });
  yPos += 15;

  // Info box
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 45, 3, 3, "FD");

  yPos += 8;
  const col1 = margin + 5;
  const col2 = pageWidth / 2 + 10;

  doc.setFont("helvetica", "bold");
  doc.text("Tittel:", col1, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(title || "______________________________", col1 + 20, yPos);

  doc.setFont("helvetica", "bold");
  doc.text("Dato:", col2, yPos);
  doc.setFont("helvetica", "normal");
  doc.text("______________________________", col2 + 15, yPos);

  yPos += 10;
  if (projectName) {
    doc.setFont("helvetica", "bold");
    doc.text("Prosjekt:", col1, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(projectName, col1 + 25, yPos);
  }

  if (companyName) {
    doc.setFont("helvetica", "bold");
    doc.text("Firma:", col2, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(companyName, col2 + 20, yPos);
  }

  yPos += 10;
  doc.setFont("helvetica", "bold");
  doc.text("Ansvarlig:", col1, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(responsibleName || "______________________________", col1 + 28, yPos);

  doc.setFont("helvetica", "bold");
  doc.text("Frist:", col2, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(deadlineDate || "______________________________", col2 + 15, yPos);

  yPos += 10;
  doc.setFont("helvetica", "bold");
  doc.text("Utført av:", col1, yPos);
  doc.setFont("helvetica", "normal");
  doc.text("______________________________", col1 + 28, yPos);

  yPos += 20;

  // Checklist items
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Kontrollpunkter", margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  items.forEach((item, index) => {
    // Check if we need a new page
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }

    const itemHeight = item.type === "photo" || item.type === "signature" ? 35 : 25;
    
    // Draw item box
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, itemHeight, 2, 2, "FD");

    // Item number and text
    const textY = yPos + 6;
    doc.setFont("helvetica", "bold");
    doc.text(`${index + 1}.`, margin + 3, textY);
    
    doc.setFont("helvetica", "normal");
    const itemText = item.text + (item.required ? " *" : "");
    const maxTextWidth = pageWidth - 2 * margin - 70;
    const splitText = doc.splitTextToSize(itemText, maxTextWidth);
    doc.text(splitText, margin + 12, textY);

    // Response area based on type
    const responseX = pageWidth - margin - 50;
    
    if (item.type === "yes_no") {
      // Checkboxes for Ja / Nei / N/A
      doc.setDrawColor(100, 100, 100);
      doc.rect(responseX, yPos + 3, 10, 10);
      doc.text("Ja", responseX + 2, yPos + 10);
      
      doc.rect(responseX + 15, yPos + 3, 10, 10);
      doc.text("Nei", responseX + 15, yPos + 10);
      
      doc.rect(responseX + 32, yPos + 3, 10, 10);
      doc.text("N/A", responseX + 32, yPos + 10);
    } else if (item.type === "number") {
      doc.text("Verdi:", responseX - 10, yPos + 8);
      doc.setDrawColor(150, 150, 150);
      doc.line(responseX + 5, yPos + 10, responseX + 45, yPos + 10);
    } else if (item.type === "text") {
      doc.text("Tekst:", responseX - 10, yPos + 8);
      doc.setDrawColor(150, 150, 150);
      doc.line(responseX + 5, yPos + 10, responseX + 45, yPos + 10);
    } else if (item.type === "photo") {
      doc.text("Foto tatt:", responseX - 5, yPos + 8);
      doc.rect(responseX + 20, yPos + 3, 10, 10);
      doc.text("Bildebeskrivelse:", margin + 12, yPos + 18);
      doc.setDrawColor(150, 150, 150);
      doc.line(margin + 50, yPos + 20, pageWidth - margin - 5, yPos + 20);
    } else if (item.type === "signature") {
      doc.text("Signatur:", margin + 12, yPos + 18);
      doc.setDrawColor(150, 150, 150);
      doc.rect(margin + 35, yPos + 12, 80, 18);
    }

    // Comment line
    if (item.type !== "photo" && item.type !== "signature") {
      doc.setFontSize(8);
      doc.text("Kommentar:", margin + 12, yPos + 16);
      doc.setDrawColor(180, 180, 180);
      doc.line(margin + 35, yPos + 18, pageWidth - margin - 55, yPos + 18);
      doc.setFontSize(10);
    }

    yPos += itemHeight + 3;
  });

  // Signature section at the bottom
  if (yPos > 230) {
    doc.addPage();
    yPos = 20;
  }

  yPos += 15;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Signatur ved ferdigstillelse", margin, yPos);
  yPos += 10;

  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 35, 3, 3, "FD");

  yPos += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  doc.text("Kontrollør:", col1, yPos);
  doc.setDrawColor(150, 150, 150);
  doc.line(col1 + 25, yPos + 2, col1 + 70, yPos + 2);

  doc.text("Signatur:", col2, yPos);
  doc.rect(col2 + 22, yPos - 6, 50, 15);

  yPos += 15;
  doc.text("Dato:", col1, yPos);
  doc.line(col1 + 15, yPos + 2, col1 + 50, yPos + 2);

  // Footer
  yPos = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text("* = Obligatorisk punkt", margin, yPos);
  doc.text(`Generert: ${new Date().toLocaleDateString("nb-NO")}`, pageWidth - margin, yPos, { align: "right" });

  return doc.output("blob");
};

export const downloadChecklistTemplatePdf = async (options: ChecklistPdfOptions, filename?: string) => {
  const blob = await generateChecklistTemplatePdf(options);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `${options.templateName.replace(/\s+/g, "_")}_mal.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
