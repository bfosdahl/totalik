import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface KsSja {
  id: string;
  company_id: string;
  project_id?: string | null;
  sja_nr: string;
  title: string;
  aktivitet: string;
  identifisert_risiko: string;
  risikoreduserende_tiltak: string;
  utfort_sted?: string;
  utfort_dato?: string;
  utfort_navn?: string;
  tiltak_sted?: string;
  tiltak_dato?: string;
  tiltak_navn?: string;
  status: string;
  created_at: string;
}

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "Ikke satt";
  try {
    return format(new Date(dateString), "dd.MM.yyyy", { locale: nb });
  } catch {
    return dateString;
  }
};

const statusLabels: Record<string, string> = {
  active: "Aktiv",
  completed: "Fullført",
  archived: "Arkivert",
};

export const exportKsSjaToPDF = (sjaList: KsSja[], companyName?: string) => {
  const doc = new jsPDF();
  const title = "Sikker Jobb Analyse (SJA) Oversikt";
  const subtitle = companyName || "SJA Rapport";
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
    total: sjaList.length,
    active: sjaList.filter(s => s.status === "active").length,
    completed: sjaList.filter(s => s.status === "completed").length,
    archived: sjaList.filter(s => s.status === "archived").length,
  };

  doc.setFontSize(10);
  doc.text(`Totalt: ${stats.total} | Aktive: ${stats.active} | Fullførte: ${stats.completed} | Arkiverte: ${stats.archived}`, 14, 45);

  // Table
  const tableData = sjaList.map(sja => [
    sja.sja_nr,
    sja.title,
    sja.aktivitet.substring(0, 40) + (sja.aktivitet.length > 40 ? "..." : ""),
    statusLabels[sja.status] || sja.status,
    formatDate(sja.utfort_dato),
    sja.utfort_navn || "-",
  ]);

  autoTable(doc, {
    startY: 52,
    head: [["SJA Nr.", "Tittel", "Aktivitet", "Status", "Utført dato", "Utført av"]],
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
      1: { cellWidth: 45 },
      2: { cellWidth: 50 },
      3: { cellWidth: 22 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25 },
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

  const filename = `ks-sja-oversikt_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(filename);
};

export const exportSingleKsSjaToPDF = (sja: KsSja, companyName?: string) => {
  const doc = new jsPDF();
  const title = "Sikker Jobb Analyse (SJA)";
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
  
  doc.text(`SJA Nr: ${sja.sja_nr}`, 14, yPos);
  yPos += 6;
  doc.text(`Tittel: ${sja.title}`, 14, yPos);
  yPos += 6;
  doc.text(`Status: ${statusLabels[sja.status] || sja.status}`, 14, yPos);
  yPos += 6;
  doc.text(`Opprettet: ${formatDate(sja.created_at)}`, 14, yPos);
  yPos += 10;

  // SJA utført
  doc.setFont(undefined, 'bold');
  doc.text('Sikker jobb analyse utført', 14, yPos);
  yPos += 7;
  doc.setFont(undefined, 'normal');
  
  if (sja.utfort_sted) {
    doc.text(`Sted: ${sja.utfort_sted}`, 14, yPos);
    yPos += 6;
  }
  if (sja.utfort_dato) {
    doc.text(`Dato: ${formatDate(sja.utfort_dato)}`, 14, yPos);
    yPos += 6;
  }
  if (sja.utfort_navn) {
    doc.text(`Navn: ${sja.utfort_navn}`, 14, yPos);
    yPos += 6;
  }
  yPos += 5;

  // 1. Aktivitet
  if (sja.aktivitet) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFont(undefined, 'bold');
    doc.text('1. Aktivitet - Hva skal gjøres?', 14, yPos);
    yPos += 7;
    doc.setFont(undefined, 'normal');
    
    const aktivitetLines = doc.splitTextToSize(sja.aktivitet, 180);
    doc.text(aktivitetLines, 14, yPos);
    yPos += aktivitetLines.length * 5 + 8;
  }

  // 2. Identifisert risiko
  if (sja.identifisert_risiko) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFont(undefined, 'bold');
    doc.text('2. Identifisert risiko - Hva kan gå galt?', 14, yPos);
    yPos += 7;
    doc.setFont(undefined, 'normal');
    
    const risikoLines = doc.splitTextToSize(sja.identifisert_risiko, 180);
    doc.text(risikoLines, 14, yPos);
    yPos += risikoLines.length * 5 + 8;
  }

  // 3. Risikoreduserende tiltak
  if (sja.risikoreduserende_tiltak) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFont(undefined, 'bold');
    doc.text('3. Risikoreduserende tiltak', 14, yPos);
    yPos += 7;
    doc.setFont(undefined, 'normal');
    
    const tiltakLines = doc.splitTextToSize(sja.risikoreduserende_tiltak, 180);
    doc.text(tiltakLines, 14, yPos);
    yPos += tiltakLines.length * 5 + 8;
  }

  // Tiltak gjennomført
  if (sja.tiltak_sted || sja.tiltak_dato || sja.tiltak_navn) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFont(undefined, 'bold');
    doc.text('Tiltak gjennomført', 14, yPos);
    yPos += 7;
    doc.setFont(undefined, 'normal');
    
    if (sja.tiltak_sted) {
      doc.text(`Sted: ${sja.tiltak_sted}`, 14, yPos);
      yPos += 6;
    }
    if (sja.tiltak_dato) {
      doc.text(`Dato: ${formatDate(sja.tiltak_dato)}`, 14, yPos);
      yPos += 6;
    }
    if (sja.tiltak_navn) {
      doc.text(`Navn: ${sja.tiltak_navn}`, 14, yPos);
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

  const filename = `sja-${sja.sja_nr.replace(/[^a-zA-Z0-9]/g, '-')}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(filename);
};
