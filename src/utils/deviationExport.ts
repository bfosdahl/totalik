import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Deviation } from "@/hooks/useDeviations";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

const priorityLabels: Record<string, string> = {
  low: "Lav",
  medium: "Medium",
  high: "Høy",
  critical: "Kritisk",
};

const statusLabels: Record<string, string> = {
  open: "Åpen",
  "in-progress": "Under arbeid",
  resolved: "Løst",
  closed: "Lukket",
};

const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), "dd.MM.yyyy", { locale: nb });
  } catch {
    return dateString;
  }
};

export const exportDeviationsToPDF = (deviations: Deviation[], companyName?: string) => {
  const doc = new jsPDF();
  const title = "Avviksrapport";
  const subtitle = companyName || "Avviksoversikt";
  const generatedDate = format(new Date(), "dd.MM.yyyy HH:mm", { locale: nb });

  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text(title, 14, 20);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(subtitle, 14, 28);
  doc.text(`Generert: ${generatedDate}`, 14, 35);

  // Summary stats
  const stats = {
    total: deviations.length,
    open: deviations.filter(d => d.status === "open").length,
    inProgress: deviations.filter(d => d.status === "in-progress").length,
    resolved: deviations.filter(d => d.status === "resolved").length,
    closed: deviations.filter(d => d.status === "closed").length,
  };

  doc.setFontSize(10);
  doc.text(`Totalt: ${stats.total} | Åpne: ${stats.open} | Under arbeid: ${stats.inProgress} | Løst: ${stats.resolved} | Lukket: ${stats.closed}`, 14, 45);

  // Table
  const tableData = deviations.map(dev => [
    dev.deviation_number,
    dev.title,
    dev.category,
    priorityLabels[dev.priority] || dev.priority,
    statusLabels[dev.status] || dev.status,
    dev.assignee_name || "Ikke tildelt",
    formatDate(dev.due_date),
  ]);

  autoTable(doc, {
    startY: 52,
    head: [["Nr.", "Tittel", "Kategori", "Prioritet", "Status", "Ansvarlig", "Frist"]],
    body: tableData,
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 50 },
      2: { cellWidth: 20 },
      3: { cellWidth: 22 },
      4: { cellWidth: 25 },
      5: { cellWidth: 30 },
      6: { cellWidth: 22 },
    },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Side ${i} av ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }

  const filename = `avviksrapport_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(filename);
};

export const exportDeviationsToExcel = (deviations: Deviation[], companyName?: string) => {
  const worksheetData = deviations.map(dev => ({
    "Avviksnummer": dev.deviation_number,
    "Tittel": dev.title,
    "Beskrivelse": dev.description || "",
    "Kategori": dev.category,
    "Prioritet": priorityLabels[dev.priority] || dev.priority,
    "Status": statusLabels[dev.status] || dev.status,
    "Ansvarlig": dev.assignee_name || "Ikke tildelt",
    "Rapportert av": dev.reporter_name,
    "Frist": formatDate(dev.due_date),
    "Opprettet": formatDate(dev.created_at.split("T")[0]),
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  
  // Set column widths
  worksheet["!cols"] = [
    { wch: 15 }, // Avviksnummer
    { wch: 35 }, // Tittel
    { wch: 50 }, // Beskrivelse
    { wch: 12 }, // Kategori
    { wch: 12 }, // Prioritet
    { wch: 15 }, // Status
    { wch: 20 }, // Ansvarlig
    { wch: 20 }, // Rapportert av
    { wch: 12 }, // Frist
    { wch: 12 }, // Opprettet
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Avvik");

const filename = `avviksrapport_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
  XLSX.writeFile(workbook, filename);
};

export interface SingleDeviationExport {
  id: string;
  deviation_number?: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assignee: string;
  reporter: string;
  createdAt: string;
  dueDate: string;
  // Extended RUH fields
  type?: string;
  incident_location?: string;
  incident_time?: string;
  incident_type?: string;
  severity?: string;
  consequences?: string;
  involved_persons?: string;
  immediate_actions?: string;
  preventive_measures?: string;
  root_cause_analysis?: string;
  reporter_contact?: string;
  responsible_receiver?: string;
  additional_info?: string;
  notify_arbeidstilsynet?: boolean;
  notify_insurance?: boolean;
}

export interface DeviationAttachmentExport {
  file_name: string;
  file_type: string | null;
  image_data_url?: string;
}


export interface DeviationCommentExport {
  user_name: string;
  content: string;
  created_at: string;
}

export const exportSingleDeviationToPDF = (
  deviation: SingleDeviationExport,
  companyName?: string,
  attachments?: DeviationAttachmentExport[],
  comments?: DeviationCommentExport[]
) => {
  const doc = new jsPDF();
  const generatedDate = format(new Date(), "dd.MM.yyyy HH:mm", { locale: nb });

  // Header
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text("Avviksrapport", 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  if (companyName) {
    doc.text(companyName, 14, 28);
  }
  doc.text(`Generert: ${generatedDate}`, 14, companyName ? 35 : 28);

  // Deviation ID and title
  let yPos = companyName ? 50 : 43;
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Avviksnummer: ${deviation.deviation_number || deviation.id}`, 14, yPos);
  yPos += 10;

  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text(deviation.title, 14, yPos);
  yPos += 15;

  // Type badge if RUH
  if (deviation.type === "ruh") {
    doc.setFontSize(10);
    doc.setFillColor(254, 215, 170);
    doc.roundedRect(14, yPos - 5, 80, 8, 2, 2, "F");
    doc.setTextColor(154, 52, 18);
    doc.text("Rapport Uønsket Hendelse (RUH)", 16, yPos);
    yPos += 15;
  }

  // Basic info table
  const infoData: [string, string][] = [
    ["Kategori", deviation.category],
    ["Prioritet", priorityLabels[deviation.priority] || deviation.priority],
    ["Status", statusLabels[deviation.status] || deviation.status],
    ["Ansvarlig", deviation.assignee || "Ikke tildelt"],
    ["Rapportert av", deviation.reporter],
    ["Frist", formatDate(deviation.dueDate)],
    ["Opprettet", formatDate(deviation.createdAt)],
  ];

  // Add severity if present
  if (deviation.severity) {
    const severityLabels: Record<string, string> = {
      minor: "Mindre",
      moderate: "Moderat",
      serious: "Alvorlig",
      critical: "Kritisk"
    };
    infoData.push(["Alvorlighetsgrad", severityLabels[deviation.severity] || deviation.severity]);
  }

  autoTable(doc, {
    startY: yPos,
    body: infoData,
    theme: "plain",
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 45, textColor: [100, 100, 100] },
      1: { cellWidth: 100 },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Helper function for sections with page break check
  const addSection = (title: string, content: string | null | undefined) => {
    if (!content) return;
    
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text(title, 14, yPos);
    yPos += 6;

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(content, 180);
    doc.text(lines, 14, yPos);
    yPos += lines.length * 5 + 8;
  };

  // Description section
  addSection("Beskrivelse", deviation.description || "Ingen beskrivelse");

  // RUH-specific fields
  if (deviation.incident_location) {
    addSection("Hendelsessted", deviation.incident_location);
  }
  if (deviation.incident_time) {
    addSection("Tidspunkt for hendelse", deviation.incident_time);
  }
  if (deviation.incident_type) {
    const incidentTypeLabels: Record<string, string> = {
      near_miss: "Nestenulykke",
      injury: "Skade/personskade",
      property_damage: "Materiell skade",
      environmental: "Miljøhendelse",
      other: "Annet"
    };
    addSection("Type hendelse", incidentTypeLabels[deviation.incident_type] || deviation.incident_type);
  }
  if (deviation.consequences) {
    addSection("Konsekvenser", deviation.consequences);
  }
  if (deviation.involved_persons) {
    addSection("Involverte personer", deviation.involved_persons);
  }
  if (deviation.immediate_actions) {
    addSection("Umiddelbare tiltak", deviation.immediate_actions);
  }
  if (deviation.preventive_measures) {
    addSection("Forebyggende tiltak", deviation.preventive_measures);
  }
  if (deviation.root_cause_analysis) {
    addSection("Årsaksanalyse", deviation.root_cause_analysis);
  }
  if (deviation.reporter_contact) {
    addSection("Kontaktinfo rapportør", deviation.reporter_contact);
  }
  if (deviation.responsible_receiver) {
    addSection("Ansvarlig mottaker", deviation.responsible_receiver);
  }
  if (deviation.additional_info) {
    addSection("Tilleggsinformasjon", deviation.additional_info);
  }

  // Notifications
  if (deviation.notify_arbeidstilsynet || deviation.notify_insurance) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text("Varsling", 14, yPos);
    yPos += 6;
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    if (deviation.notify_arbeidstilsynet) {
      doc.text("• Arbeidstilsynet skal varsles", 14, yPos);
      yPos += 5;
    }
    if (deviation.notify_insurance) {
      doc.text("• Forsikringsselskap skal varsles", 14, yPos);
      yPos += 5;
    }
    yPos += 8;
  }

  // Attachments section
  if (attachments && attachments.length > 0) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text(`Vedlegg (${attachments.length})`, 14, yPos);
    yPos += 6;
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    attachments.forEach((att) => {
      doc.text(`• ${att.file_name}`, 14, yPos);
      yPos += 5;
    });
    yPos += 4;

    // Embed image previews for image attachments
    const images = attachments.filter((a) => a.image_data_url);
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const maxImgW = pageWidth - 28;
    const maxImgH = 90;
    for (const img of images) {
      try {
        const props = doc.getImageProperties(img.image_data_url!);
        const ratio = props.width / props.height;
        let w = maxImgW;
        let h = w / ratio;
        if (h > maxImgH) {
          h = maxImgH;
          w = h * ratio;
        }
        if (yPos + h + 10 > pageHeight - 15) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(img.file_name, 14, yPos);
        yPos += 4;
        const fmt = (img.file_type || "").toLowerCase().includes("png") ? "PNG" : "JPEG";
        doc.addImage(img.image_data_url!, fmt, 14, yPos, w, h);
        yPos += h + 8;
      } catch (e) {
        console.warn("Could not embed image in PDF:", img.file_name, e);
      }
    }
  }


  // Comments section
  if (comments && comments.length > 0) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text(`Kommentarer (${comments.length})`, 14, yPos);
    yPos += 8;
    
    comments.forEach((comment) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`${comment.user_name} - ${formatDate(comment.created_at.split("T")[0])}`, 14, yPos);
      yPos += 5;
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const commentLines = doc.splitTextToSize(comment.content, 180);
      doc.text(commentLines, 14, yPos);
      yPos += commentLines.length * 5 + 6;
    });
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Side ${i} av ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }

  const filename = `avvik_${deviation.deviation_number || deviation.id}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(filename);
};
