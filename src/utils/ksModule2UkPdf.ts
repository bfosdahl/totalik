import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { generatePdfHeader, addPdfFooter, PdfHeaderInfo } from "./ksModule2PdfHeader";
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

interface KsModule2Uk {
  id: string;
  uk_number: string;
  control_area: string;
  description: string | null;
  status: string;
  controller_company: string | null;
  controller_name: string | null;
  controller_phone: string | null;
  controller_email: string | null;
  planned_date: string | null;
  completed_date: string | null;
  result: string | null;
  deviations_found: boolean;
  deviation_description: string | null;
  remarks: string | null;
  created_at: string;
}

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

const STATUS_LABELS: Record<string, string> = {
  planned: "Planlagt",
  in_progress: "Under gjennomføring",
  completed: "Gjennomført",
  approved: "Godkjent",
  rejected: "Ikke godkjent",
};

const RESULT_LABELS: Record<string, string> = {
  godkjent: "Godkjent",
  godkjent_med_anmerkninger: "Godkjent med anmerkninger",
  ikke_godkjent: "Ikke godkjent",
  avventer: "Avventer",
};

interface GenerateUkPdfOptions {
  uk: KsModule2Uk;
  project: KsModule2Project;
  company: Company;
}

export function generateKsModule2UkPdf(options: GenerateUkPdfOptions): { blob: Blob; fileName: string } {
  const { uk, project, company } = options;
  const doc = new jsPDF();

  const headerInfo: PdfHeaderInfo = {
    documentType: "UK-KONTROLL",
    documentNumber: uk.uk_number,
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
    createdDate: uk.created_at,
    completedDate: uk.completed_date,
  };

  let yPos = generatePdfHeader(doc, headerInfo);

  // Title
  yPos += 5;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(CONTROL_AREA_LABELS[uk.control_area] || uk.control_area, 15, yPos);
  yPos += 12;

  // Status badge
  const statusColors: Record<string, [number, number, number]> = {
    planned: [156, 163, 175],
    in_progress: [234, 179, 8],
    completed: [59, 130, 246],
    approved: [34, 197, 94],
    rejected: [239, 68, 68],
  };

  const statColor = statusColors[uk.status] || [156, 163, 175];
  doc.setFillColor(...statColor);
  doc.roundedRect(15, yPos, 30, 7, 2, 2, "F");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text(STATUS_LABELS[uk.status] || uk.status, 17, yPos + 5);
  doc.setTextColor(0, 0, 0);
  yPos += 15;

  // Control details table
  const detailsData = [
    ["Kontrollområde", CONTROL_AREA_LABELS[uk.control_area] || uk.control_area],
    ["Status", STATUS_LABELS[uk.status] || uk.status],
  ];

  if (uk.controller_company) {
    detailsData.push(["Kontrollfirma", uk.controller_company]);
  }

  if (uk.controller_name) {
    detailsData.push(["Kontrollør", uk.controller_name]);
  }

  if (uk.controller_phone) {
    detailsData.push(["Telefon", uk.controller_phone]);
  }

  if (uk.controller_email) {
    detailsData.push(["E-post", uk.controller_email]);
  }

  if (uk.planned_date) {
    detailsData.push(["Planlagt dato", format(new Date(uk.planned_date), "dd.MM.yyyy", { locale: nb })]);
  }

  if (uk.completed_date) {
    detailsData.push(["Gjennomført dato", format(new Date(uk.completed_date), "dd.MM.yyyy", { locale: nb })]);
  }

  if (uk.result) {
    detailsData.push(["Resultat", RESULT_LABELS[uk.result] || uk.result]);
  }

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: detailsData,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 45, textColor: [100, 116, 139] },
      1: { cellWidth: "auto" },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Description
  if (uk.description) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Beskrivelse av kontrollen", 15, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const descLines = doc.splitTextToSize(uk.description, 180);
    doc.text(descLines, 15, yPos);
    yPos += descLines.length * 5 + 10;
  }

  // Deviations
  if (uk.deviations_found) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(254, 226, 226);
    doc.roundedRect(15, yPos, 180, uk.deviation_description ? 30 : 12, 3, 3, "F");

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(185, 28, 28);
    doc.text("⚠ Avvik funnet", 20, yPos + 8);

    if (uk.deviation_description) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      const devLines = doc.splitTextToSize(uk.deviation_description, 170);
      doc.text(devLines, 20, yPos + 16);
      yPos += 35;
    } else {
      yPos += 17;
    }
  }

  // Remarks
  if (uk.remarks) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Anmerkninger", 15, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const remLines = doc.splitTextToSize(uk.remarks, 180);
    doc.text(remLines, 15, yPos);
    yPos += remLines.length * 5 + 10;
  }

  // Result summary box
  if (uk.result) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    const resultColors: Record<string, [number, number, number]> = {
      godkjent: [34, 197, 94],
      godkjent_med_anmerkninger: [234, 179, 8],
      ikke_godkjent: [239, 68, 68],
      avventer: [156, 163, 175],
    };

    const resColor = resultColors[uk.result] || [156, 163, 175];
    doc.setFillColor(...resColor);
    doc.roundedRect(15, yPos, 180, 25, 3, 3, "F");

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("RESULTAT", 20, yPos + 10);
    doc.setFontSize(14);
    doc.text(RESULT_LABELS[uk.result] || uk.result, 20, yPos + 19);
  }

  doc.setTextColor(0, 0, 0);

  // Add footer to all pages
  addPdfFooter(doc, headerInfo);

  const fileName = `UK_${uk.uk_number}_${project.project_number}_${format(new Date(), "yyyyMMdd")}.pdf`;
  const blob = doc.output("blob");

  return { blob, fileName };
}

export function downloadKsModule2UkPdf(options: GenerateUkPdfOptions): void {
  const { blob, fileName } = generateKsModule2UkPdf(options);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
