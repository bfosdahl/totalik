import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface ChecklistItem {
  id: string;
  status: string | null;
  comment: string | null;
  template_item?: {
    text: string;
    help_text?: string | null;
    category?: string | null;
    order_index: number;
  };
}

interface ChecklistData {
  id: string;
  created_at: string;
  filled_at: string | null;
  phase: string | null;
  template: {
    name: string;
    trade: string | null;
  };
  project?: {
    name: string;
    project_number: string | null;
    address: string | null;
  };
  items: ChecklistItem[];
  photos: Record<string, any[]>;
}

export const generateChecklistPdf = async (data: ChecklistData) => {
  const doc = new jsPDF();
  let yPosition = 20;

  const checkPageBreak = (neededSpace: number = 20) => {
    if (yPosition + neededSpace > 270) {
      doc.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("SJEKKLISTE", 105, yPosition, { align: "center" });
  yPosition += 10;

  doc.setFontSize(14);
  doc.text(data.template.name, 105, yPosition, { align: "center" });
  yPosition += 15;

  // Project info
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  if (data.project) {
    if (data.project.project_number) {
      doc.text(`Prosjekt: ${data.project.project_number} - ${data.project.name}`, 20, yPosition);
      yPosition += 6;
    }
    if (data.project.address) {
      doc.text(`Adresse: ${data.project.address}`, 20, yPosition);
      yPosition += 6;
    }
  }

  if (data.phase) {
    doc.text(`Fase: ${data.phase}`, 20, yPosition);
    yPosition += 6;
  }

  doc.text(`Opprettet: ${format(new Date(data.created_at), "dd.MM.yyyy", { locale: nb })}`, 20, yPosition);
  yPosition += 6;

  if (data.filled_at) {
    doc.text(`Utfylt: ${format(new Date(data.filled_at), "dd.MM.yyyy", { locale: nb })}`, 20, yPosition);
    yPosition += 6;
  }

  yPosition += 10;

  // Group items by category
  const itemsByCategory = data.items.reduce((acc, item) => {
    const category = item.template_item?.category || "Generelt";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  // Iterate through categories
  for (const [category, items] of Object.entries(itemsByCategory)) {
    checkPageBreak(30);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(category, 20, yPosition);
    yPosition += 8;
    doc.setFont("helvetica", "normal");

    const sortedItems = items.sort((a, b) => 
      (a.template_item?.order_index || 0) - (b.template_item?.order_index || 0)
    );

    for (const item of sortedItems) {
      checkPageBreak(50);

      // Item text
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      const itemText = item.template_item?.text || "Ukjent punkt";
      const splitText = doc.splitTextToSize(itemText, 140);
      doc.text(splitText, 25, yPosition);
      yPosition += splitText.length * 5 + 2;
      
      doc.setFont("helvetica", "normal");

      // Status
      const statusText = item.status === "OK" ? "✓ OK" : 
                        item.status === "AVVIK" ? "✗ Avvik" : 
                        item.status === "IKKE_AKTUELT" ? "○ Ikke aktuelt" : 
                        "○ Ikke utfylt";
      doc.text(`Status: ${statusText}`, 25, yPosition);
      yPosition += 6;

      // Comment
      if (item.comment) {
        doc.text("Kommentar:", 25, yPosition);
        yPosition += 5;
        const commentSplit = doc.splitTextToSize(item.comment, 160);
        doc.setFontSize(9);
        doc.text(commentSplit, 30, yPosition);
        yPosition += commentSplit.length * 4 + 3;
        doc.setFontSize(10);
      }

      // Photos
      const itemPhotos = data.photos[item.id];
      if (itemPhotos && itemPhotos.length > 0) {
        doc.text(`Bilder (${itemPhotos.length}):`, 25, yPosition);
        yPosition += 5;
        
        for (const photo of itemPhotos) {
          checkPageBreak(15);
          doc.setFontSize(9);
          doc.text(
            `- Tatt: ${format(new Date(photo.taken_at), "dd.MM.yyyy HH:mm", { locale: nb })}`,
            30,
            yPosition
          );
          yPosition += 5;
        }
        doc.setFontSize(10);
      }

      yPosition += 5;
    }

    yPosition += 5;
  }

  // Summary statistics
  checkPageBreak(40);
  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("OPPSUMMERING", 20, yPosition);
  yPosition += 8;

  const okCount = data.items.filter(i => i.status === "OK").length;
  const avvikCount = data.items.filter(i => i.status === "AVVIK").length;
  const naCount = data.items.filter(i => i.status === "IKKE_AKTUELT").length;
  const pendingCount = data.items.filter(i => !i.status || i.status === "pending").length;
  const totalCount = data.items.length;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Totalt antall punkter: ${totalCount}`, 25, yPosition);
  yPosition += 6;
  doc.text(`✓ OK: ${okCount}`, 25, yPosition);
  yPosition += 6;
  doc.text(`✗ Avvik: ${avvikCount}`, 25, yPosition);
  yPosition += 6;
  doc.text(`○ Ikke aktuelt: ${naCount}`, 25, yPosition);
  yPosition += 6;
  doc.text(`○ Ikke utfylt: ${pendingCount}`, 25, yPosition);

  // Save PDF
  const fileName = `Sjekkliste_${data.template.name.replace(/\s+/g, '_')}_${format(new Date(), "yyyyMMdd")}.pdf`;
  doc.save(fileName);
};

// Generate PDF and return as blob (for auto-save to document center)
export const generateChecklistPdfBlob = async (data: ChecklistData): Promise<{ blob: Blob; fileName: string }> => {
  const doc = new jsPDF();
  let yPosition = 20;

  const checkPageBreak = (neededSpace: number = 20) => {
    if (yPosition + neededSpace > 270) {
      doc.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("KS Egenkontroll", 105, yPosition, { align: "center" });
  yPosition += 10;

  doc.setFontSize(14);
  doc.text(data.template.name, 105, yPosition, { align: "center" });
  yPosition += 8;

  if (data.phase) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Fase: ${data.phase}`, 105, yPosition, { align: "center" });
    yPosition += 8;
  }

  // Project info
  if (data.project) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const projectInfo = [
      data.project.name,
      data.project.project_number ? `Prosjekt ${data.project.project_number}` : null,
      data.project.address
    ].filter(Boolean).join(" • ");
    doc.text(projectInfo, 105, yPosition, { align: "center" });
    yPosition += 6;
  }

  yPosition += 5;
  
  // Info box
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(20, yPosition, 170, 25, 3, 3, "F");
  
  doc.setFontSize(9);
  doc.text(`Opprettet: ${format(new Date(data.created_at), "dd.MM.yyyy", { locale: nb })}`, 25, yPosition + 8);
  if (data.filled_at) {
    doc.text(`Fullført: ${format(new Date(data.filled_at), "dd.MM.yyyy HH:mm", { locale: nb })}`, 25, yPosition + 16);
  }
  
  yPosition += 35;

  // Group items by category
  const itemsByCategory = data.items.reduce((acc, item) => {
    const category = item.template_item?.category || "Generelt";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  // Table for each category
  for (const [category, categoryItems] of Object.entries(itemsByCategory)) {
    checkPageBreak(40);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(category, 20, yPosition);
    yPosition += 8;

    const sortedItems = [...categoryItems].sort((a, b) => 
      (a.template_item?.order_index || 0) - (b.template_item?.order_index || 0)
    );

    const tableData = sortedItems.map((item, index) => {
      const statusText = item.status === "OK" ? "✓ OK" :
                         item.status === "AVVIK" ? "✗ Avvik" :
                         item.status === "IKKE_AKTUELT" ? "N/A" : "-";
      return [
        `${index + 1}. ${item.template_item?.text || ""}`,
        statusText,
        item.comment || ""
      ];
    });

    autoTable(doc, {
      startY: yPosition,
      head: [["Kontrollpunkt", "Status", "Kommentar"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 25, halign: "center" },
        2: { cellWidth: 55 }
      },
      styles: { fontSize: 9, cellPadding: 3 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Summary
  checkPageBreak(50);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Oppsummering", 20, yPosition);
  yPosition += 8;

  const okCount = data.items.filter(i => i.status === "OK").length;
  const avvikCount = data.items.filter(i => i.status === "AVVIK").length;
  const naCount = data.items.filter(i => i.status === "IKKE_AKTUELT").length;
  const totalCount = data.items.length;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Totalt antall punkter: ${totalCount}`, 25, yPosition);
  yPosition += 6;
  doc.text(`✓ OK: ${okCount}`, 25, yPosition);
  yPosition += 6;
  doc.text(`✗ Avvik: ${avvikCount}`, 25, yPosition);
  yPosition += 6;
  doc.text(`○ Ikke aktuelt: ${naCount}`, 25, yPosition);

  const fileName = `Egenkontroll_${data.template.name.replace(/\s+/g, '_')}_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`;
  const blob = doc.output('blob');
  
  return { blob, fileName };
};
