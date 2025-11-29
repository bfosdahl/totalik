import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { KsAvvik } from "@/hooks/useKsAvvik";

const priorityLabels: Record<string, string> = {
  low: "Lav",
  medium: "Middels",
  high: "Høy",
};

const statusLabels: Record<string, string> = {
  open: "Åpen",
  in_progress: "Under arbeid",
  closed: "Lukket",
};

const categoryLabels: Record<string, string> = {
  quality: "Kvalitet",
  safety: "Sikkerhet",
  environment: "Miljø",
  documentation: "Dokumentasjon",
  other: "Annet",
};

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "Ikke satt";
  try {
    return format(new Date(dateString), "dd.MM.yyyy", { locale: nb });
  } catch {
    return dateString;
  }
};

export const exportKsAvvikToPDF = (avvikList: KsAvvik[], companyName?: string) => {
  const doc = new jsPDF();
  const title = "KS Avvik / RUH Rapport";
  const subtitle = companyName || "Avvik og hendelsesrapport";
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
    total: avvikList.length,
    avvik: avvikList.filter(a => a.type === 'avvik').length,
    ruh: avvikList.filter(a => a.type === 'ruh').length,
    open: avvikList.filter(a => a.status === "open").length,
    inProgress: avvikList.filter(a => a.status === "in_progress").length,
    closed: avvikList.filter(a => a.status === "closed").length,
  };

  doc.setFontSize(10);
  doc.text(`Totalt: ${stats.total} | Avvik: ${stats.avvik} | RUH: ${stats.ruh}`, 14, 45);
  doc.text(`Åpne: ${stats.open} | Under arbeid: ${stats.inProgress} | Lukket: ${stats.closed}`, 14, 52);

  // Table
  const tableData = avvikList.map(avvik => [
    avvik.avvik_nummer,
    avvik.type === 'ruh' ? 'RUH' : 'Avvik',
    avvik.tittel,
    avvik.type === 'avvik' ? (categoryLabels[avvik.kategori] || avvik.kategori) : '-',
    priorityLabels[avvik.prioritet] || avvik.prioritet,
    statusLabels[avvik.status] || avvik.status,
    avvik.ansvarlig || "Ikke tildelt",
    formatDate(avvik.frist),
  ]);

  autoTable(doc, {
    startY: 59,
    head: [["Nr.", "Type", "Tittel", "Kategori", "Prioritet", "Status", "Ansvarlig", "Frist"]],
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
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 15 },
      2: { cellWidth: 45 },
      3: { cellWidth: 22 },
      4: { cellWidth: 20 },
      5: { cellWidth: 22 },
      6: { cellWidth: 25 },
      7: { cellWidth: 20 },
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

  const filename = `ks-avvik-rapport_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(filename);
};

export const exportKsAvvikToExcel = (avvikList: KsAvvik[], companyName?: string) => {
  const worksheetData = avvikList.map(avvik => ({
    "Type": avvik.type === 'ruh' ? 'RUH' : 'Avvik',
    "Nummer": avvik.avvik_nummer,
    "Tittel": avvik.tittel,
    "Beskrivelse": avvik.beskrivelse || "",
    "Kategori": avvik.type === 'avvik' ? (categoryLabels[avvik.kategori] || avvik.kategori) : 'N/A',
    "Prioritet": priorityLabels[avvik.prioritet] || avvik.prioritet,
    "Status": statusLabels[avvik.status] || avvik.status,
    "Ansvarlig": avvik.ansvarlig || "Ikke tildelt",
    "Frist": formatDate(avvik.frist),
    "Oppdaget dato": formatDate(avvik.oppdaget_dato),
    "Sted": avvik.oppdaget_sted || "",
    // RUH-spesifikke felt
    "Hendelsestype": avvik.incident_type || "",
    "Alvorlighetsgrad": avvik.severity || "",
    "Konsekvenser": avvik.consequences || "",
    "Involverte personer": avvik.involved_persons || "",
    "Rotårsaksanalyse": avvik.root_cause_analysis || "",
    "Umiddelbare tiltak": avvik.immediate_actions || "",
    "Forebyggende tiltak": avvik.preventive_measures || "",
    "Varsle Arbeidstilsynet": avvik.notify_arbeidstilsynet ? 'Ja' : 'Nei',
    "Varsle forsikring": avvik.notify_insurance ? 'Ja' : 'Nei',
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  
  // Set column widths
  worksheet["!cols"] = [
    { wch: 10 }, // Type
    { wch: 15 }, // Nummer
    { wch: 35 }, // Tittel
    { wch: 50 }, // Beskrivelse
    { wch: 15 }, // Kategori
    { wch: 12 }, // Prioritet
    { wch: 15 }, // Status
    { wch: 20 }, // Ansvarlig
    { wch: 12 }, // Frist
    { wch: 12 }, // Oppdaget dato
    { wch: 20 }, // Sted
    { wch: 20 }, // Hendelsestype
    { wch: 15 }, // Alvorlighetsgrad
    { wch: 40 }, // Konsekvenser
    { wch: 30 }, // Involverte personer
    { wch: 50 }, // Rotårsaksanalyse
    { wch: 40 }, // Umiddelbare tiltak
    { wch: 40 }, // Forebyggende tiltak
    { wch: 12 }, // Varsle Arbeidstilsynet
    { wch: 12 }, // Varsle forsikring
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "KS Avvik");

  const filename = `ks-avvik-rapport_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
  XLSX.writeFile(workbook, filename);
};

export const exportSingleKsAvvikToPDF = (avvik: KsAvvik, companyName?: string) => {
  const doc = new jsPDF();
  const title = avvik.type === 'ruh' ? 'RUH Rapport' : 'Avviksrapport';
  const generatedDate = format(new Date(), "dd.MM.yyyy HH:mm", { locale: nb });

  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text(title, 14, 20);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  if (companyName) {
    doc.text(companyName, 14, 28);
    doc.text(`Generert: ${generatedDate}`, 14, 35);
  } else {
    doc.text(`Generert: ${generatedDate}`, 14, 28);
  }

  // Content
  let yPos = companyName ? 45 : 38;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  // Basic info
  doc.setFont(undefined, 'bold');
  doc.text('Grunnleggende informasjon', 14, yPos);
  yPos += 7;
  doc.setFont(undefined, 'normal');
  
  doc.text(`${avvik.type === 'ruh' ? 'RUH-nummer' : 'Avviksnummer'}: ${avvik.avvik_nummer}`, 14, yPos);
  yPos += 6;
  doc.text(`Type: ${avvik.type === 'ruh' ? 'RUH' : 'Avvik'}`, 14, yPos);
  yPos += 6;
  doc.text(`Tittel: ${avvik.tittel}`, 14, yPos);
  yPos += 6;
  doc.text(`Status: ${statusLabels[avvik.status] || avvik.status}`, 14, yPos);
  yPos += 6;
  doc.text(`Dato: ${formatDate(avvik.oppdaget_dato)}`, 14, yPos);
  yPos += 6;
  
  if (avvik.type === 'avvik' && avvik.oppdaget_sted) {
    doc.text(`Sted: ${avvik.oppdaget_sted}`, 14, yPos);
    yPos += 6;
  }

  if (avvik.type === 'ruh') {
    if (avvik.incident_location) {
      doc.text(`Sted: ${avvik.incident_location}`, 14, yPos);
      yPos += 6;
    }
    if (avvik.incident_time) {
      doc.text(`Klokkeslett: ${avvik.incident_time}`, 14, yPos);
      yPos += 6;
    }
    if (avvik.incident_type) {
      doc.text(`Hendelsestype: ${avvik.incident_type}`, 14, yPos);
      yPos += 6;
    }
    if (avvik.severity) {
      const severityLabels: Record<string, string> = {
        observation: 'Observasjon',
        near_miss: 'Nestenulykke',
        injury: 'Personskade',
        serious_injury: 'Alvorlig personskade'
      };
      doc.text(`Alvorlighetsgrad: ${severityLabels[avvik.severity] || avvik.severity}`, 14, yPos);
      yPos += 6;
    }
  }

  yPos += 3;

  // Description
  if (avvik.beskrivelse) {
    doc.setFont(undefined, 'bold');
    doc.text('Beskrivelse', 14, yPos);
    yPos += 7;
    doc.setFont(undefined, 'normal');
    
    const descLines = doc.splitTextToSize(avvik.beskrivelse, 180);
    doc.text(descLines, 14, yPos);
    yPos += descLines.length * 5 + 5;
  }

  // Category/Priority info
  if (avvik.type === 'avvik') {
    doc.setFont(undefined, 'bold');
    doc.text('Detaljer', 14, yPos);
    yPos += 7;
    doc.setFont(undefined, 'normal');
    
    doc.text(`Kategori: ${categoryLabels[avvik.kategori] || avvik.kategori}`, 14, yPos);
    yPos += 6;
    doc.text(`Prioritet: ${priorityLabels[avvik.prioritet] || avvik.prioritet}`, 14, yPos);
    yPos += 6;
  }

  // RUH-specific fields
  if (avvik.type === 'ruh') {
    if (avvik.consequences) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont(undefined, 'bold');
      doc.text('Konsekvenser', 14, yPos);
      yPos += 7;
      doc.setFont(undefined, 'normal');
      const consLines = doc.splitTextToSize(avvik.consequences, 180);
      doc.text(consLines, 14, yPos);
      yPos += consLines.length * 5 + 5;
    }

    if (avvik.involved_persons) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont(undefined, 'bold');
      doc.text('Involverte personer', 14, yPos);
      yPos += 7;
      doc.setFont(undefined, 'normal');
      const involvedLines = doc.splitTextToSize(avvik.involved_persons, 180);
      doc.text(involvedLines, 14, yPos);
      yPos += involvedLines.length * 5 + 5;
    }

    if (avvik.root_cause_analysis) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont(undefined, 'bold');
      doc.text('Rotårsaksanalyse', 14, yPos);
      yPos += 7;
      doc.setFont(undefined, 'normal');
      const rootLines = doc.splitTextToSize(avvik.root_cause_analysis, 180);
      doc.text(rootLines, 14, yPos);
      yPos += rootLines.length * 5 + 5;
    }

    if (avvik.immediate_actions) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont(undefined, 'bold');
      doc.text('Umiddelbare tiltak', 14, yPos);
      yPos += 7;
      doc.setFont(undefined, 'normal');
      const immLines = doc.splitTextToSize(avvik.immediate_actions, 180);
      doc.text(immLines, 14, yPos);
      yPos += immLines.length * 5 + 5;
    }

    if (avvik.preventive_measures) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont(undefined, 'bold');
      doc.text('Forebyggende tiltak', 14, yPos);
      yPos += 7;
      doc.setFont(undefined, 'normal');
      const prevLines = doc.splitTextToSize(avvik.preventive_measures, 180);
      doc.text(prevLines, 14, yPos);
      yPos += prevLines.length * 5 + 5;
    }

    if (avvik.reporter_contact || avvik.responsible_receiver) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont(undefined, 'bold');
      doc.text('Kontaktinformasjon', 14, yPos);
      yPos += 7;
      doc.setFont(undefined, 'normal');
      
      if (avvik.reporter_contact) {
        doc.text(`Melder: ${avvik.reporter_contact}`, 14, yPos);
        yPos += 6;
      }
      if (avvik.responsible_receiver) {
        doc.text(`Ansvarlig mottaker: ${avvik.responsible_receiver}`, 14, yPos);
        yPos += 6;
      }
    }

    if (avvik.notify_arbeidstilsynet || avvik.notify_insurance) {
      yPos += 3;
      doc.setFont(undefined, 'bold');
      doc.text('Varsling', 14, yPos);
      yPos += 7;
      doc.setFont(undefined, 'normal');
      
      if (avvik.notify_arbeidstilsynet) {
        doc.text('✓ Arbeidstilsynet skal varsles', 14, yPos);
        yPos += 6;
      }
      if (avvik.notify_insurance) {
        doc.text('✓ Forsikring skal varsles', 14, yPos);
        yPos += 6;
      }
    }
  }

  // Responsible and deadline
  if (avvik.ansvarlig || avvik.frist) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    yPos += 3;
    doc.setFont(undefined, 'bold');
    doc.text('Ansvar og frister', 14, yPos);
    yPos += 7;
    doc.setFont(undefined, 'normal');
    
    if (avvik.ansvarlig) {
      doc.text(`Ansvarlig: ${avvik.ansvarlig}`, 14, yPos);
      yPos += 6;
    }
    if (avvik.frist) {
      doc.text(`Frist: ${formatDate(avvik.frist)}`, 14, yPos);
      yPos += 6;
    }
  }

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

  const filename = `${avvik.type === 'ruh' ? 'ruh' : 'avvik'}-${avvik.avvik_nummer.replace(/[^a-zA-Z0-9]/g, '-')}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(filename);
};
