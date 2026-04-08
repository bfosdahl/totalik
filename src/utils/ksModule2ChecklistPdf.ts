import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { generatePdfHeader, addPdfFooter, PdfHeaderInfo } from "./ksModule2PdfHeader";
import { KsModule2Checklist, ChecklistItem } from "@/hooks/useKsModule2Checklists";
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

interface GenerateChecklistPdfOptions {
  checklist: KsModule2Checklist;
  project: KsModule2Project;
  company: Company;
  checklistNumber?: string;
  includePhotos?: boolean;
}

export async function generateKsModule2ChecklistPdf(options: GenerateChecklistPdfOptions): Promise<{ blob: Blob; fileName: string }> {
  const { checklist, project, company, checklistNumber } = options;
  const doc = new jsPDF();

  const headerInfo: PdfHeaderInfo = {
    documentType: "EGENKONTROLL",
    documentNumber: checklistNumber || `EK-${checklist.id.substring(0, 8).toUpperCase()}`,
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
    responsible: checklist.responsible_user_name,
    createdDate: checklist.created_at,
    completedDate: checklist.completed_at,
  };

  let yPos = generatePdfHeader(doc, headerInfo);

  // Checklist title
  yPos += 5;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(checklist.title, 15, yPos);
  yPos += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Mal: ${checklist.template_name}`, 15, yPos);
  yPos += 10;

  doc.setTextColor(0, 0, 0);

  // Status badge
  const statusColors: Record<string, [number, number, number]> = {
    completed: [34, 197, 94],
    in_progress: [234, 179, 8],
    planned: [156, 163, 175],
    rejected: [239, 68, 68],
  };
  const statusLabels: Record<string, string> = {
    completed: "Fullført",
    in_progress: "Under arbeid",
    planned: "Planlagt",
    rejected: "Avvist",
  };

  const statusColor = statusColors[checklist.status] || [156, 163, 175];
  doc.setFillColor(...statusColor);
  doc.roundedRect(15, yPos, 25, 7, 2, 2, "F");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text(statusLabels[checklist.status] || checklist.status, 17, yPos + 5);
  doc.setTextColor(0, 0, 0);

  yPos += 15;

  // Checklist items table
  const items = (checklist.checklist_items as ChecklistItem[]) || [];
  if (items.length === 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text("Ingen kontrollpunkter registrert.", 15, yPos);
    yPos += 15;
  }
  const tableData = items.map((item, index) => {
    let statusText = "-";
    if (item.value === true || item.value === "yes") statusText = "✓ Ja";
    else if (item.value === false || item.value === "no") statusText = "✗ Nei";
    else if (item.value !== null && item.value !== undefined) statusText = String(item.value);

    return [
      `${index + 1}. ${item.text}`,
      statusText,
      item.comment || "-",
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [["Kontrollpunkt", "Status", "Kommentar"]],
    body: tableData,
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 25, halign: "center" },
      2: { cellWidth: 55 },
    },
    didDrawPage: () => {
      // This runs on each new page
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Summary section
  const checkPageBreak = () => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
  };

  checkPageBreak();

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, yPos, 180, 35, 3, 3, "F");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("OPPSUMMERING", 20, yPos + 10);

  const okCount = items.filter(i => i.value === true || i.value === "yes").length;
  const notOkCount = items.filter(i => i.value === false || i.value === "no").length;
  const pendingCount = items.filter(i => i.value === null || i.value === undefined).length;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Totalt: ${items.length} punkter`, 20, yPos + 20);
  doc.text(`✓ OK: ${okCount}`, 80, yPos + 20);
  doc.text(`✗ Avvik: ${notOkCount}`, 120, yPos + 20);
  doc.text(`○ Ikke utfylt: ${pendingCount}`, 160, yPos + 20);

  doc.text(`Fremdrift: ${checklist.progress_percent}%`, 20, yPos + 28);

  yPos += 45;

  // Photos section
  if (options.includePhotos !== false) {
    const items = checklist.checklist_items as ChecklistItem[];
    const photosPerItem = items
      .map((item, idx) => ({ item, idx, photos: (item as any).photos as string[] | undefined }))
      .filter(p => p.photos && p.photos.length > 0);

    if (photosPerItem.length > 0) {
      checkPageBreak();
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("BILDER", 15, yPos);
      yPos += 8;

      for (const { item, idx, photos } of photosPerItem) {
        if (!photos) continue;
        for (const photo of photos) {
          if (yPos > 200) {
            doc.addPage();
            yPos = 20;
          }
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 116, 139);
          doc.text(`${idx + 1}. ${item.text}`, 15, yPos);
          doc.setTextColor(0, 0, 0);
          yPos += 5;

          try {
            const imgUrl = photo.startsWith("http")
              ? photo
              : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/ks-module2-checklist-photos/${photo}`;
            const response = await fetch(imgUrl);
            if (response.ok) {
              const blob = await response.blob();
              const dataUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });
              doc.addImage(dataUrl, "JPEG", 15, yPos, 80, 60);
              yPos += 65;
            }
          } catch (e) {
            doc.setFontSize(8);
            doc.text("[Bilde kunne ikke lastes]", 15, yPos);
            yPos += 8;
          }
        }
      }
      yPos += 10;
    }
  }

  // Signatures section
  if (checklist.signatures && (checklist.signatures as any[]).length > 0) {
    checkPageBreak();

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("SIGNATURER", 15, yPos);
    yPos += 10;

    for (const sig of checklist.signatures as any[]) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`${sig.name || "Ukjent"}`, 20, yPos);
      if (sig.date) {
        doc.text(`Signert: ${format(new Date(sig.date), "dd.MM.yyyy HH:mm", { locale: nb })}`, 80, yPos);
      }
      yPos += 8;

      // Draw signature image if available
      if (sig.signature && sig.signature.startsWith("data:image")) {
        try {
          doc.addImage(sig.signature, "PNG", 20, yPos, 60, 20);
          yPos += 25;
        } catch (e) {
          // Ignore signature image errors
          yPos += 5;
        }
      }
    }
  }

  // Add footer to all pages
  addPdfFooter(doc, headerInfo);

  const fileName = `Egenkontroll_${checklist.template_name.replace(/\s+/g, "_")}_${project.project_number}_${format(new Date(), "yyyyMMdd")}.pdf`;
  const blob = doc.output("blob");

  return { blob, fileName };
}

export function downloadKsModule2ChecklistPdf(options: GenerateChecklistPdfOptions): void {
  generateKsModule2ChecklistPdf(options).then(({ blob, fileName }) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  });
}
