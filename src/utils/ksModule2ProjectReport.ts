import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface ProjectReportData {
  project: {
    project_name: string;
    project_number: string;
    address?: string;
    client_name?: string;
    start_date?: string;
    end_date?: string;
    status: string;
  };
  checklists: Array<{
    id: string;
    title: string;
    template_name: string;
    status: string;
    completed_at?: string;
    completed_by_name?: string;
  }>;
  avvik: Array<{
    avvik_number: string;
    title: string;
    category: string;
    severity: string;
    status: string;
    discovered_date: string;
    responsible_name?: string;
  }>;
  ukControls: Array<{
    uk_number: string;
    control_area: string;
    status: string;
    controller_company?: string;
    result?: string;
  }>;
  documents: Array<{
    document_name: string;
    category: string;
    uploaded_at: string;
  }>;
  companyName: string;
  generatedBy: string;
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
  pending: "Venter",
  approved: "Godkjent",
  rejected: "Avvist",
  completed: "Fullført",
  draft: "Utkast",
};

const CONTROL_AREA_LABELS: Record<string, string> = {
  konstruksjon: "Konstruksjonssikkerhet",
  brannteknisk: "Brannteknisk prosjektering",
  geoteknikk: "Geoteknikk",
  bygningsfysikk: "Bygningsfysikk",
  lydteknisk: "Lydtekniske forhold",
  energi: "Energieffektivitet",
  tilgjengelighet: "Tilgjengelighet",
  annet: "Annet",
};

export const generateProjectReportPdf = (data: ProjectReportData, sections: {
  includeProjectInfo: boolean;
  includeChecklists: boolean;
  includeAvvik: boolean;
  includeUk: boolean;
  includeDocuments: boolean;
}) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Helper to add new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > 270) {
      doc.addPage();
      yPos = 20;
    }
  };

  // Title Page
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("PROSJEKTRAPPORT", pageWidth / 2, 60, { align: "center" });
  
  doc.setFontSize(18);
  doc.text(data.project.project_name, pageWidth / 2, 80, { align: "center" });
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(data.project.project_number, pageWidth / 2, 95, { align: "center" });
  
  if (data.project.address) {
    doc.text(data.project.address, pageWidth / 2, 105, { align: "center" });
  }

  doc.setFontSize(10);
  doc.text(`Generert: ${format(new Date(), "d. MMMM yyyy", { locale: nb })}`, pageWidth / 2, 140, { align: "center" });
  doc.text(`Av: ${data.generatedBy}`, pageWidth / 2, 148, { align: "center" });
  doc.text(`Bedrift: ${data.companyName}`, pageWidth / 2, 156, { align: "center" });

  // Table of Contents
  doc.addPage();
  yPos = 20;
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Innholdsfortegnelse", 20, yPos);
  yPos += 15;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  let tocNumber = 1;

  if (sections.includeProjectInfo) {
    doc.text(`${tocNumber}. Prosjektinformasjon`, 25, yPos);
    yPos += 8;
    tocNumber++;
  }
  if (sections.includeChecklists) {
    doc.text(`${tocNumber}. Sjekklister og egenkontroller (${data.checklists.length})`, 25, yPos);
    yPos += 8;
    tocNumber++;
  }
  if (sections.includeAvvik) {
    doc.text(`${tocNumber}. Avvik (${data.avvik.length})`, 25, yPos);
    yPos += 8;
    tocNumber++;
  }
  if (sections.includeUk) {
    doc.text(`${tocNumber}. Uavhengig kontroll (${data.ukControls.length})`, 25, yPos);
    yPos += 8;
    tocNumber++;
  }
  if (sections.includeDocuments) {
    doc.text(`${tocNumber}. Dokumentoversikt (${data.documents.length})`, 25, yPos);
    yPos += 8;
  }

  // Project Information
  if (sections.includeProjectInfo) {
    doc.addPage();
    yPos = 20;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("1. Prosjektinformasjon", 20, yPos);
    yPos += 15;

    const projectInfoData = [
      ["Prosjektnavn", data.project.project_name],
      ["Prosjektnummer", data.project.project_number],
      ["Status", STATUS_LABELS[data.project.status] || data.project.status],
    ];

    if (data.project.address) {
      projectInfoData.push(["Adresse", data.project.address]);
    }
    if (data.project.client_name) {
      projectInfoData.push(["Byggherre", data.project.client_name]);
    }
    if (data.project.start_date) {
      projectInfoData.push(["Startdato", format(new Date(data.project.start_date), "d. MMM yyyy", { locale: nb })]);
    }
    if (data.project.end_date) {
      projectInfoData.push(["Sluttdato", format(new Date(data.project.end_date), "d. MMM yyyy", { locale: nb })]);
    }

    autoTable(doc, {
      startY: yPos,
      head: [],
      body: projectInfoData,
      theme: "striped",
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 50 },
        1: { cellWidth: "auto" },
      },
    });
  }

  // Checklists
  if (sections.includeChecklists && data.checklists.length > 0) {
    doc.addPage();
    yPos = 20;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("2. Sjekklister og egenkontroller", 20, yPos);
    yPos += 15;

    const checklistData = data.checklists.map(c => [
      c.title,
      c.template_name,
      STATUS_LABELS[c.status] || c.status,
      c.completed_at ? format(new Date(c.completed_at), "d. MMM yyyy", { locale: nb }) : "-",
      c.completed_by_name || "-",
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Tittel", "Mal", "Status", "Fullført", "Utført av"]],
      body: checklistData,
      theme: "striped",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
    });
  }

  // Avvik
  if (sections.includeAvvik && data.avvik.length > 0) {
    doc.addPage();
    yPos = 20;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("3. Avvik", 20, yPos);
    yPos += 15;

    const avvikData = data.avvik.map(a => [
      a.avvik_number,
      a.title,
      CATEGORY_LABELS[a.category] || a.category,
      SEVERITY_LABELS[a.severity] || a.severity,
      STATUS_LABELS[a.status] || a.status,
      a.responsible_name || "-",
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Nr", "Tittel", "Kategori", "Alvorlighet", "Status", "Ansvarlig"]],
      body: avvikData,
      theme: "striped",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [239, 68, 68] },
    });
  }

  // UK Controls
  if (sections.includeUk && data.ukControls.length > 0) {
    doc.addPage();
    yPos = 20;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("4. Uavhengig kontroll", 20, yPos);
    yPos += 15;

    const ukData = data.ukControls.map(u => [
      u.uk_number,
      CONTROL_AREA_LABELS[u.control_area] || u.control_area,
      STATUS_LABELS[u.status] || u.status,
      u.controller_company || "-",
      u.result || "-",
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Nr", "Kontrollområde", "Status", "Kontrollfirma", "Resultat"]],
      body: ukData,
      theme: "striped",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [34, 197, 94] },
    });
  }

  // Documents
  if (sections.includeDocuments && data.documents.length > 0) {
    doc.addPage();
    yPos = 20;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("5. Dokumentoversikt", 20, yPos);
    yPos += 15;

    const docData = data.documents.map(d => [
      d.document_name,
      d.category,
      format(new Date(d.uploaded_at), "d. MMM yyyy", { locale: nb }),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Dokumentnavn", "Kategori", "Lastet opp"]],
      body: docData,
      theme: "striped",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [107, 114, 128] },
    });
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${data.project.project_number} - ${data.project.project_name} | Side ${i} av ${pageCount}`,
      pageWidth / 2,
      290,
      { align: "center" }
    );
  }

  // Download
  const fileName = `Prosjektrapport_${data.project.project_number}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
};
