import jsPDF from "jspdf";
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
