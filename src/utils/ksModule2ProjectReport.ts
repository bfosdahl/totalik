import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

// Helper to load image as base64 data URL
const loadImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Failed to load image:", url, error);
    return null;
  }
};

interface ProjectReportData {
  project: {
    project_name: string;
    project_number: string;
    address?: string;
    client_name?: string;
    gnr_bnr?: string;
    municipality?: string;
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
    checkpoints?: Array<{
      label: string;
      response: string;
      comment?: string;
      photos?: string[];
    }>;
    photos?: string[];
  }>;
  avvik: Array<{
    avvik_number: string;
    title: string;
    category: string;
    severity: string;
    status: string;
    discovered_date: string;
    responsible_name?: string;
    description?: string;
    corrective_action?: string;
    closed_date?: string;
    closed_by_name?: string;
    photos?: string[];
  }>;
  ukControls: Array<{
    uk_number: string;
    control_area: string;
    status: string;
    controller_company?: string;
    result?: string;
    control_date?: string;
    description?: string;
    comments?: string;
  }>;
  sjaList: Array<{
    sja_number: string;
    title: string;
    work_description?: string;
    location?: string;
    planned_date: string;
    responsible_name: string;
    status: string;
    overall_risk_level: string;
    identified_risks?: Array<{ description: string; consequence: string; probability: string }>;
    risk_reducing_measures?: Array<{ risk: string; measure: string; responsible: string }>;
    completed_at?: string;
    completed_by_name?: string;
  }>;
  vernerunder: Array<{
    vernerunde_number: string;
    title: string;
    scheduled_date: string;
    completed_date?: string;
    responsible_name: string;
    status: string;
    findings_count: number;
    completed_by_name?: string;
    findings?: Array<{
      description: string;
      severity?: string;
      status?: string;
      responsible?: string;
    }>;
  }>;
  routines: Array<{
    routine_number: string;
    name: string;
    description?: string;
    category: string;
    responsible_role?: string;
    is_document: boolean;
    approved_by?: string;
    approved_at?: string;
  }>;
  documents: Array<{
    document_name: string;
    category: string;
    uploaded_at: string;
  }>;
  // New data types
  shaPlan?: {
    plan_type: string;
    status: string;
    project_name?: string | null;
    client_name?: string | null;
    sha_coordinator_kp?: string | null;
    sha_coordinator_ku?: string | null;
    planned_start_date?: string | null;
    planned_end_date?: string | null;
    risk_areas?: Array<{ paragraph: string; description: string; measures: string }>;
    entrepreneur_approved?: boolean;
  };
  stoffkartotek: Array<{
    product_name: string;
    manufacturer?: string | null;
    danger_classes: string[];
    location?: string | null;
    last_updated: string;
  }>;
  milestones: Array<{
    title: string;
    description?: string | null;
    start_date: string;
    end_date: string;
    status: string;
    progress: number;
    responsible_name?: string | null;
  }>;
  meetings: Array<{
    meeting_number: string;
    meeting_type: string;
    title: string;
    meeting_date: string;
    location?: string | null;
    participants: Array<{ name: string; role?: string }>;
    status: string;
  }>;
  finances?: {
    contract_sum: number;
    budget_materials: number;
    budget_labor: number;
    budget_subcontractors: number;
    budget_other: number;
    actual_materials: number;
    actual_labor: number;
    actual_subcontractors: number;
    actual_other: number;
    invoiced_amount: number;
    paid_amount: number;
    change_orders_sum: number;
  };
  invoices: Array<{
    invoice_number: string;
    description?: string | null;
    amount: number;
    invoice_date: string;
    due_date?: string | null;
    status: string;
  }>;
  changeOrders: Array<{
    change_order_number: string;
    title: string;
    description?: string | null;
    total_cost?: number | null;
    status: string;
    customer_approved: boolean;
    customer_approved_at?: string | null;
  }>;
  claims: Array<{
    claim_number: string;
    title: string;
    description?: string | null;
    category: string;
    priority: string;
    status: string;
    reported_date: string;
    responsible_name?: string | null;
    resolution?: string | null;
    cost_estimate?: number | null;
    actual_cost?: number | null;
  }>;
  subcontractors: Array<{
    firm_name: string;
    org_number?: string | null;
    contact_person?: string | null;
    work_scope: string;
    trade?: string | null;
    contract_value?: number | null;
    approval_status: string;
    is_active: boolean;
  }>;
  companyName: string;
  companyLogoUrl?: string;
  generatedBy: string;
  ksHandbok?: KsHandbokData;
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
  planned: "Planlagt",
  active: "Aktiv",
  resolved: "Løst",
  sent: "Sendt",
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

const ROUTINE_CATEGORY_LABELS: Record<string, string> = {
  general: "Generell",
  kvalitet: "Kvalitet",
  hms: "HMS",
  dokumentasjon: "Dokumentasjon",
  kommunikasjon: "Kommunikasjon",
  innkjop: "Innkjøp",
  prosjektering: "Prosjektering",
  utforelse: "Utførelse",
  kontroll: "Kontroll",
  avslutning: "Avslutning",
  annet: "Annet",
};

const RISK_LEVEL_LABELS: Record<string, string> = {
  low: "Lav risiko",
  medium: "Middels risiko",
  high: "Høy risiko",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Lav",
  medium: "Medium",
  high: "Høy",
  critical: "Kritisk",
};

const APPROVAL_STATUS_LABELS: Record<string, string> = {
  pending: "Venter",
  approved: "Godkjent",
  approved_with_remarks: "Godkjent med merknader",
  rejected: "Avvist",
};

export interface ReportSections {
  includeProjectInfo: boolean;
  includeChecklists: boolean;
  includeChecklistDetails: boolean;
  includeChecklistPhotos: boolean;
  includeAvvik: boolean;
  includeAvvikDetails: boolean;
  includeAvvikPhotos: boolean;
  includeUk: boolean;
  includeUkDetails: boolean;
  includeSja: boolean;
  includeSjaDetails: boolean;
  includeVernerunder: boolean;
  includeVernerundeDetails: boolean;
  includeRoutines: boolean;
  includeDocuments: boolean;
  // New sections
  includeShaPlan: boolean;
  includeStoffkartotek: boolean;
  includeMilestones: boolean;
  includeMeetings: boolean;
  includeFinances: boolean;
  includeChangeOrders: boolean;
  includeClaims: boolean;
  includeSubcontractors: boolean;
  includeKsHandbok: boolean;
}

export interface KsHandbokData {
  systemGoals: Array<{ goal_text: string; description?: string }>;
  goals: Array<{ goal_text: string }>;
  organization?: { custom_content: string } | null;
  routines: Array<{ routine_name: string; description?: string; content?: string }>;
}

export const generateProjectReportPdf = async (data: ProjectReportData, sections: ReportSections) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;
  let sectionNumber = 0;

  // Construction theme colors (matching KS Håndbok)
  const COLORS = {
    darkBlue: [30, 58, 82] as [number, number, number],
    orange: [232, 119, 34] as [number, number, number],
    lightGray: [240, 243, 246] as [number, number, number],
    medGray: [180, 190, 200] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
    textDark: [33, 37, 41] as [number, number, number],
  };

  // Load company logo if available
  let logoImg: string | null = null;
  if (data.companyLogoUrl) {
    try {
      const response = await fetch(data.companyLogoUrl);
      const blob = await response.blob();
      logoImg = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn("Could not load company logo for PDF:", e);
    }
  }

  // Page decoration helper
  const addPageDecoration = () => {
    doc.setFillColor(...COLORS.darkBlue);
    doc.rect(0, 0, pageWidth, 8, 'F');
    doc.setFillColor(...COLORS.orange);
    doc.rect(0, 8, pageWidth, 2, 'F');
    // Footer
    doc.setFillColor(...COLORS.darkBlue);
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.white);
    doc.text(data.companyName, 15, pageHeight - 4.5);
    doc.text(`${data.project.project_number} – ${data.project.project_name}`, pageWidth / 2, pageHeight - 4.5, { align: "center" });
    doc.text(`Side ${doc.getNumberOfPages()}`, pageWidth - 15, pageHeight - 4.5, { align: "right" });
    doc.setTextColor(...COLORS.textDark);
  };

  const addNewPage = () => {
    doc.addPage();
    addPageDecoration();
    yPos = 22;
  };

  // Helper to add new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - 25) {
      addNewPage();
    }
  };

  const addSectionHeader = (title: string) => {
    sectionNumber++;
    addNewPage();
    // Styled section header with colored background
    doc.setFillColor(...COLORS.darkBlue);
    doc.roundedRect(15, yPos - 5, pageWidth - 30, 12, 2, 2, 'F');
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.white);
    doc.text(`${sectionNumber}. ${title}`, 20, yPos + 3);
    doc.setTextColor(...COLORS.textDark);
    yPos += 16;
    doc.setFont("helvetica", "normal");
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return "-";
    return new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK", maximumFractionDigits: 0 }).format(amount);
  };

  // ============ Title Page ============
  addPageDecoration();

  // Large colored area for cover
  doc.setFillColor(...COLORS.lightGray);
  doc.rect(0, 10, pageWidth, 80, 'F');

  // Logo
  if (logoImg) {
    try {
      doc.addImage(logoImg, "PNG", pageWidth / 2 - 20, 18, 40, 40);
    } catch {}
  }

  const coverTextStart = logoImg ? 65 : 35;

  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkBlue);
  doc.text("PROSJEKTRAPPORT", pageWidth / 2, coverTextStart, { align: "center" });

  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.orange);
  doc.text("Kvalitetssikring og dokumentasjon", pageWidth / 2, coverTextStart + 12, { align: "center" });

  // Orange divider line
  doc.setDrawColor(...COLORS.orange);
  doc.setLineWidth(1);
  doc.line(pageWidth / 2 - 40, coverTextStart + 20, pageWidth / 2 + 40, coverTextStart + 20);

  doc.setTextColor(...COLORS.textDark);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(data.project.project_name, pageWidth / 2, coverTextStart + 35, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(data.project.project_number, pageWidth / 2, coverTextStart + 45, { align: "center" });

  if (data.project.address) {
    doc.text(data.project.address, pageWidth / 2, coverTextStart + 53, { align: "center" });
  }

  // Metadata
  yPos = 160;
  doc.setFontSize(10);
  if (data.project.client_name) {
    doc.text(`Byggherre: ${data.project.client_name}`, pageWidth / 2, yPos, { align: "center" });
    yPos += 10;
  }
  if (data.project.gnr_bnr) {
    doc.text(`Gnr/Bnr: ${data.project.gnr_bnr}`, pageWidth / 2, yPos, { align: "center" });
    yPos += 10;
  }
  if (data.project.municipality) {
    doc.text(`Kommune: ${data.project.municipality}`, pageWidth / 2, yPos, { align: "center" });
    yPos += 10;
  }

  // Generation info at bottom
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.medGray);
  doc.text(`Generert: ${format(new Date(), "d. MMMM yyyy 'kl.' HH:mm", { locale: nb })}`, pageWidth / 2, pageHeight - 50, { align: "center" });
  doc.text(`Utført av: ${data.generatedBy}`, pageWidth / 2, pageHeight - 42, { align: "center" });
  doc.text(`Bedrift: ${data.companyName}`, pageWidth / 2, pageHeight - 34, { align: "center" });
  doc.setTextColor(...COLORS.textDark);

  // ============ Table of Contents ============
  addNewPage();

  doc.setFillColor(...COLORS.darkBlue);
  doc.roundedRect(15, yPos - 5, pageWidth - 30, 12, 2, 2, 'F');
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.white);
  doc.text("Innholdsfortegnelse", 20, yPos + 3);
  doc.setTextColor(...COLORS.textDark);
  yPos += 18;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");

  const tocItems: { title: string; count?: number }[] = [];
  
  if (sections.includeProjectInfo) {
    tocItems.push({ title: "Prosjektinformasjon" });
  }
  if (sections.includeChecklists) {
    tocItems.push({ title: "Sjekklister og egenkontroller", count: data.checklists.length });
  }
  if (sections.includeAvvik) {
    tocItems.push({ title: "Avvik", count: data.avvik.length });
  }
  if (sections.includeUk) {
    tocItems.push({ title: "Uavhengig kontroll", count: data.ukControls.length });
  }
  if (sections.includeShaPlan && data.shaPlan) {
    tocItems.push({ title: "SHA-plan" });
  }
  if (sections.includeSja) {
    tocItems.push({ title: "Sikker Jobb Analyse (SJA)", count: data.sjaList.length });
  }
  if (sections.includeVernerunder) {
    tocItems.push({ title: "Vernerunder", count: data.vernerunder.length });
  }
  if (sections.includeStoffkartotek) {
    tocItems.push({ title: "Stoffkartotek", count: data.stoffkartotek.length });
  }
  if (sections.includeMilestones) {
    tocItems.push({ title: "Fremdriftsplan / Milepæler", count: data.milestones.length });
  }
  if (sections.includeMeetings) {
    tocItems.push({ title: "Møtereferater", count: data.meetings.length });
  }
  if (sections.includeFinances && data.finances) {
    tocItems.push({ title: "Økonomioversikt" });
  }
  if (sections.includeChangeOrders) {
    tocItems.push({ title: "Endringsmeldinger", count: data.changeOrders.length });
  }
  if (sections.includeClaims) {
    tocItems.push({ title: "Reklamasjoner", count: data.claims.length });
  }
  if (sections.includeSubcontractors) {
    tocItems.push({ title: "Underleverandører", count: data.subcontractors.length });
  }
  if (sections.includeRoutines) {
    tocItems.push({ title: "Rutiner", count: data.routines.length });
  }
  if (sections.includeDocuments) {
    tocItems.push({ title: "Dokumentoversikt", count: data.documents.length });
  }
  if (sections.includeKsHandbok && data.ksHandbok) {
    tocItems.push({ title: "KS Håndbok" });
  }

  tocItems.forEach((item, index) => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.textDark);
    const countStr = item.count !== undefined ? ` (${item.count})` : "";
    doc.text(`${index + 1}. ${item.title}${countStr}`, 25, yPos);
    // Dotted line to page number area
    doc.setDrawColor(...COLORS.medGray);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(100, yPos, pageWidth - 25, yPos);
    doc.setLineDashPattern([], 0);
    yPos += 9;
  });

  // ============ Project Information ============
  if (sections.includeProjectInfo) {
    addSectionHeader("Prosjektinformasjon");

    const projectInfoData = [
      ["Prosjektnavn", data.project.project_name],
      ["Prosjektnummer", data.project.project_number],
      ["Status", STATUS_LABELS[data.project.status] || data.project.status],
    ];

    if (data.project.address) {
      projectInfoData.push(["Adresse", data.project.address]);
    }
    if (data.project.gnr_bnr) {
      projectInfoData.push(["Gnr/Bnr", data.project.gnr_bnr]);
    }
    if (data.project.municipality) {
      projectInfoData.push(["Kommune", data.project.municipality]);
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

  // ============ Checklists ============
  if (sections.includeChecklists && data.checklists.length > 0) {
    addSectionHeader("Sjekklister og egenkontroller");

    const completedCount = data.checklists.filter(c => c.status === "completed").length;
    doc.setFontSize(10);
    doc.text(`Totalt: ${data.checklists.length} sjekklister | Fullført: ${completedCount}`, 20, yPos);
    yPos += 10;

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
      headStyles: { fillColor: [30, 58, 82] },
    });

    // Detailed checkpoint responses if enabled
    if (sections.includeChecklistDetails) {
      const completedChecklists = data.checklists.filter(c => c.status === "completed" && c.checkpoints?.length);
      
      for (const checklist of completedChecklists) {
        doc.addPage();
        yPos = 20;
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`Detaljert sjekkliste: ${checklist.title}`, 20, yPos);
        yPos += 8;
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`Mal: ${checklist.template_name} | Fullført: ${checklist.completed_at ? format(new Date(checklist.completed_at), "d. MMM yyyy", { locale: nb }) : "-"} | Av: ${checklist.completed_by_name || "-"}`, 20, yPos);
        yPos += 10;

        if (checklist.checkpoints && checklist.checkpoints.length > 0) {
          const checkpointData = checklist.checkpoints.map(cp => [
            cp.label,
            cp.response,
            cp.comment || "-",
          ]);

          autoTable(doc, {
            startY: yPos,
            head: [["Sjekkpunkt", "Svar", "Kommentar"]],
            body: checkpointData,
            theme: "striped",
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [30, 58, 82] },
            columnStyles: {
              0: { cellWidth: 80 },
              1: { cellWidth: 30 },
              2: { cellWidth: "auto" },
            },
          });

          yPos = (doc as any).lastAutoTable.finalY + 10;

          // Add checklist photos if enabled
          if (sections.includeChecklistPhotos) {
            const allPhotos: { label: string; url: string }[] = [];
            checklist.checkpoints.forEach(cp => {
              if (cp.photos && cp.photos.length > 0) {
                cp.photos.forEach(url => allPhotos.push({ label: cp.label, url }));
              }
            });

            if (allPhotos.length > 0) {
              checkPageBreak(50);
              doc.setFontSize(10);
              doc.setFont("helvetica", "bold");
              doc.text(`Bilder (${allPhotos.length}):`, 20, yPos);
              yPos += 8;

              let xPos = 20;
              const imageWidth = 50;
              const imageHeight = 40;
              const margin = 5;

              for (const photo of allPhotos) {
                try {
                  const base64 = await loadImageAsBase64(photo.url);
                  if (base64) {
                    if (xPos + imageWidth > pageWidth - 20) {
                      xPos = 20;
                      yPos += imageHeight + 15;
                    }
                    if (yPos + imageHeight + 20 > 270) {
                      doc.addPage();
                      yPos = 20;
                      xPos = 20;
                    }

                    doc.addImage(base64, "JPEG", xPos, yPos, imageWidth, imageHeight);
                    doc.setFontSize(6);
                    doc.setFont("helvetica", "normal");
                    const truncLabel = photo.label.length > 20 ? photo.label.substring(0, 17) + "..." : photo.label;
                    doc.text(truncLabel, xPos, yPos + imageHeight + 4);
                    xPos += imageWidth + margin;
                  }
                } catch (err) {
                  console.error("Error adding checklist image:", err);
                }
              }
              yPos += imageHeight + 20;
            }
          }
        }
      }
    }
  }

  // ============ Avvik ============
  if (sections.includeAvvik && data.avvik.length > 0) {
    addSectionHeader("Avvik");

    const closedCount = data.avvik.filter(a => a.status === "closed").length;
    doc.setFontSize(10);
    doc.text(`Totalt: ${data.avvik.length} avvik | Lukket: ${closedCount} | Åpne: ${data.avvik.length - closedCount}`, 20, yPos);
    yPos += 10;

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
      headStyles: { fillColor: [30, 58, 82] },
    });

    // Detailed avvik information
    if (sections.includeAvvikDetails) {
      for (const avvik of data.avvik) {
        doc.addPage();
        yPos = 20;
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`Avvik: ${avvik.avvik_number} - ${avvik.title}`, 20, yPos);
        yPos += 10;
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        
        const avvikDetails = [
          ["Kategori", CATEGORY_LABELS[avvik.category] || avvik.category],
          ["Alvorlighet", SEVERITY_LABELS[avvik.severity] || avvik.severity],
          ["Status", STATUS_LABELS[avvik.status] || avvik.status],
          ["Oppdaget", avvik.discovered_date ? format(new Date(avvik.discovered_date), "d. MMM yyyy", { locale: nb }) : "-"],
          ["Ansvarlig", avvik.responsible_name || "-"],
        ];
        
        if (avvik.closed_date) {
          avvikDetails.push(["Lukket", format(new Date(avvik.closed_date), "d. MMM yyyy", { locale: nb })]);
        }

        autoTable(doc, {
          startY: yPos,
          head: [],
          body: avvikDetails,
          theme: "plain",
          styles: { fontSize: 9 },
          columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 } },
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;

        if (avvik.description) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text("Beskrivelse:", 20, yPos);
          yPos += 6;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          const descLines = doc.splitTextToSize(avvik.description, pageWidth - 40);
          doc.text(descLines, 20, yPos);
          yPos += descLines.length * 5 + 8;
        }

        if (avvik.corrective_action) {
          checkPageBreak(30);
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text("Korrigerende tiltak:", 20, yPos);
          yPos += 6;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          const actionLines = doc.splitTextToSize(avvik.corrective_action, pageWidth - 40);
          doc.text(actionLines, 20, yPos);
          yPos += actionLines.length * 5 + 8;
        }

        // Add avvik photos if enabled
        if (sections.includeAvvikPhotos && avvik.photos && avvik.photos.length > 0) {
          checkPageBreak(50);
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text(`Bilder (${avvik.photos.length}):`, 20, yPos);
          yPos += 8;

          let xPos = 20;
          const imageWidth = 50;
          const imageHeight = 40;
          const margin = 5;

          for (const photoUrl of avvik.photos) {
            try {
              const base64 = await loadImageAsBase64(photoUrl);
              if (base64) {
                if (xPos + imageWidth > pageWidth - 20) {
                  xPos = 20;
                  yPos += imageHeight + 10;
                }
                if (yPos + imageHeight + 20 > 270) {
                  doc.addPage();
                  yPos = 20;
                  xPos = 20;
                }

                doc.addImage(base64, "JPEG", xPos, yPos, imageWidth, imageHeight);
                xPos += imageWidth + margin;
              }
            } catch (err) {
              console.error("Error adding avvik image:", err);
            }
          }
          yPos += imageHeight + 15;
        }
      }
    }
  }

  // ============ UK Controls ============
  if (sections.includeUk && data.ukControls.length > 0) {
    addSectionHeader("Uavhengig kontroll");

    const approvedCount = data.ukControls.filter(u => u.status === "approved").length;
    doc.setFontSize(10);
    doc.text(`Totalt: ${data.ukControls.length} kontroller | Godkjent: ${approvedCount}`, 20, yPos);
    yPos += 10;

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
      headStyles: { fillColor: [30, 58, 82] },
    });

    // Detailed UK information
    if (sections.includeUkDetails) {
      data.ukControls.forEach((uk) => {
        if (uk.description || uk.comments) {
          doc.addPage();
          yPos = 20;
          
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text(`UK: ${uk.uk_number} - ${CONTROL_AREA_LABELS[uk.control_area] || uk.control_area}`, 20, yPos);
          yPos += 10;
          
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          
          const ukDetails = [
            ["Status", STATUS_LABELS[uk.status] || uk.status],
            ["Kontrollfirma", uk.controller_company || "-"],
            ["Resultat", uk.result || "-"],
          ];
          
          if (uk.control_date) {
            ukDetails.push(["Kontrolldato", format(new Date(uk.control_date), "d. MMM yyyy", { locale: nb })]);
          }

          autoTable(doc, {
            startY: yPos,
            head: [],
            body: ukDetails,
            theme: "plain",
            styles: { fontSize: 9 },
            columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 } },
          });

          yPos = (doc as any).lastAutoTable.finalY + 10;

          if (uk.description) {
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("Beskrivelse:", 20, yPos);
            yPos += 6;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            const descLines = doc.splitTextToSize(uk.description, pageWidth - 40);
            doc.text(descLines, 20, yPos);
            yPos += descLines.length * 5 + 8;
          }

          if (uk.comments) {
            checkPageBreak(30);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("Kommentarer:", 20, yPos);
            yPos += 6;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            const commentLines = doc.splitTextToSize(uk.comments, pageWidth - 40);
            doc.text(commentLines, 20, yPos);
            yPos += commentLines.length * 5 + 8;
          }
        }
      });
    }
  }

  // ============ SHA Plan ============
  if (sections.includeShaPlan && data.shaPlan) {
    addSectionHeader("SHA-plan");

    const shaPlanData = [
      ["Plantype", data.shaPlan.plan_type === "internal" ? "Intern SHA-plan" : "Ekstern SHA-plan"],
      ["Status", STATUS_LABELS[data.shaPlan.status] || data.shaPlan.status],
    ];

    if (data.shaPlan.client_name) {
      shaPlanData.push(["Byggherre", data.shaPlan.client_name]);
    }
    if (data.shaPlan.sha_coordinator_kp) {
      shaPlanData.push(["SHA-koordinator KP", data.shaPlan.sha_coordinator_kp]);
    }
    if (data.shaPlan.sha_coordinator_ku) {
      shaPlanData.push(["SHA-koordinator KU", data.shaPlan.sha_coordinator_ku]);
    }
    if (data.shaPlan.planned_start_date) {
      shaPlanData.push(["Planlagt start", format(new Date(data.shaPlan.planned_start_date), "d. MMM yyyy", { locale: nb })]);
    }
    if (data.shaPlan.planned_end_date) {
      shaPlanData.push(["Planlagt slutt", format(new Date(data.shaPlan.planned_end_date), "d. MMM yyyy", { locale: nb })]);
    }
    shaPlanData.push(["Entreprenør godkjent", data.shaPlan.entrepreneur_approved ? "Ja" : "Nei"]);

    autoTable(doc, {
      startY: yPos,
      head: [],
      body: shaPlanData,
      theme: "striped",
      styles: { fontSize: 10 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Risk areas
    if (data.shaPlan.risk_areas && data.shaPlan.risk_areas.length > 0) {
      checkPageBreak(40);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Identifiserte risikoområder (Byggherreforskriften §8):", 20, yPos);
      yPos += 10;

      const riskData = data.shaPlan.risk_areas.map(r => [
        r.paragraph,
        r.description,
        r.measures || "-",
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["§", "Risikoområde", "Tiltak"]],
        body: riskData,
        theme: "striped",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 58, 82] },
      });
    }
  }

  // ============ SJA ============
  if (sections.includeSja && data.sjaList.length > 0) {
    addSectionHeader("Sikker Jobb Analyse (SJA)");

    const completedSja = data.sjaList.filter(s => s.status === "completed").length;
    doc.setFontSize(10);
    doc.text(`Totalt: ${data.sjaList.length} SJA | Fullført: ${completedSja}`, 20, yPos);
    yPos += 10;

    const sjaData = data.sjaList.map(s => [
      s.sja_number,
      s.title,
      s.location || "-",
      format(new Date(s.planned_date), "d. MMM yyyy", { locale: nb }),
      RISK_LEVEL_LABELS[s.overall_risk_level] || s.overall_risk_level,
      STATUS_LABELS[s.status] || s.status,
      s.responsible_name,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Nr", "Tittel", "Sted", "Planlagt dato", "Risikonivå", "Status", "Ansvarlig"]],
      body: sjaData,
      theme: "striped",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 82] },
    });

    // Detailed SJA information
    if (sections.includeSjaDetails) {
      data.sjaList.forEach((sja) => {
        doc.addPage();
        yPos = 20;
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`SJA: ${sja.sja_number} - ${sja.title}`, 20, yPos);
        yPos += 10;
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        
        const sjaDetails = [
          ["Status", STATUS_LABELS[sja.status] || sja.status],
          ["Risikonivå", RISK_LEVEL_LABELS[sja.overall_risk_level] || sja.overall_risk_level],
          ["Sted", sja.location || "-"],
          ["Planlagt dato", format(new Date(sja.planned_date), "d. MMM yyyy", { locale: nb })],
          ["Ansvarlig", sja.responsible_name],
        ];
        
        if (sja.completed_at) {
          sjaDetails.push(["Fullført", format(new Date(sja.completed_at), "d. MMM yyyy", { locale: nb })]);
          sjaDetails.push(["Fullført av", sja.completed_by_name || "-"]);
        }

        autoTable(doc, {
          startY: yPos,
          head: [],
          body: sjaDetails,
          theme: "plain",
          styles: { fontSize: 9 },
          columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 } },
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;

        if (sja.work_description) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text("Arbeidsbeskrivelse:", 20, yPos);
          yPos += 6;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          const descLines = doc.splitTextToSize(sja.work_description, pageWidth - 40);
          doc.text(descLines, 20, yPos);
          yPos += descLines.length * 5 + 8;
        }

        // Identified risks
        if (sja.identified_risks && sja.identified_risks.length > 0) {
          checkPageBreak(40);
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text("Identifiserte risikoer:", 20, yPos);
          yPos += 8;

          const riskData = sja.identified_risks.map(r => [
            r.description,
            r.consequence,
            r.probability,
          ]);

          autoTable(doc, {
            startY: yPos,
            head: [["Risiko", "Konsekvens", "Sannsynlighet"]],
            body: riskData,
            theme: "striped",
            styles: { fontSize: 8 },
            headStyles: { fillColor: [30, 58, 82] },
          });

          yPos = (doc as any).lastAutoTable.finalY + 10;
        }

        // Risk reducing measures
        if (sja.risk_reducing_measures && sja.risk_reducing_measures.length > 0) {
          checkPageBreak(40);
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text("Risikoreduserende tiltak:", 20, yPos);
          yPos += 8;

          const measureData = sja.risk_reducing_measures.map(m => [
            m.risk,
            m.measure,
            m.responsible,
          ]);

          autoTable(doc, {
            startY: yPos,
            head: [["Risiko", "Tiltak", "Ansvarlig"]],
            body: measureData,
            theme: "striped",
            styles: { fontSize: 8 },
            headStyles: { fillColor: [30, 58, 82] },
          });

          yPos = (doc as any).lastAutoTable.finalY + 10;
        }
      });
    }
  }

  // ============ Vernerunder ============
  if (sections.includeVernerunder && data.vernerunder.length > 0) {
    addSectionHeader("Vernerunder");

    const completedVr = data.vernerunder.filter(v => v.status === "completed").length;
    const totalFindings = data.vernerunder.reduce((sum, v) => sum + v.findings_count, 0);
    doc.setFontSize(10);
    doc.text(`Totalt: ${data.vernerunder.length} vernerunder | Fullført: ${completedVr} | Funn totalt: ${totalFindings}`, 20, yPos);
    yPos += 10;

    const vrData = data.vernerunder.map(v => [
      v.vernerunde_number,
      v.title,
      format(new Date(v.scheduled_date), "d. MMM yyyy", { locale: nb }),
      v.completed_date ? format(new Date(v.completed_date), "d. MMM yyyy", { locale: nb }) : "-",
      STATUS_LABELS[v.status] || v.status,
      v.findings_count.toString(),
      v.responsible_name,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Nr", "Tittel", "Planlagt", "Fullført", "Status", "Funn", "Ansvarlig"]],
      body: vrData,
      theme: "striped",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 82] },
    });

    // Detailed vernerunde information
    if (sections.includeVernerundeDetails) {
      data.vernerunder.forEach((vr) => {
        if (vr.findings && vr.findings.length > 0) {
          doc.addPage();
          yPos = 20;
          
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text(`Vernerunde: ${vr.vernerunde_number} - ${vr.title}`, 20, yPos);
          yPos += 10;
          
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          
          const vrDetails = [
            ["Status", STATUS_LABELS[vr.status] || vr.status],
            ["Planlagt", format(new Date(vr.scheduled_date), "d. MMM yyyy", { locale: nb })],
            ["Ansvarlig", vr.responsible_name],
          ];
          
          if (vr.completed_date) {
            vrDetails.push(["Fullført", format(new Date(vr.completed_date), "d. MMM yyyy", { locale: nb })]);
            vrDetails.push(["Fullført av", vr.completed_by_name || "-"]);
          }

          autoTable(doc, {
            startY: yPos,
            head: [],
            body: vrDetails,
            theme: "plain",
            styles: { fontSize: 9 },
            columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 } },
          });

          yPos = (doc as any).lastAutoTable.finalY + 10;

          // Findings table
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text(`Funn (${vr.findings.length}):`, 20, yPos);
          yPos += 8;

          const findingsData = vr.findings.map((f, idx) => [
            (idx + 1).toString(),
            f.description,
            SEVERITY_LABELS[f.severity || ""] || f.severity || "-",
            STATUS_LABELS[f.status || ""] || f.status || "-",
            f.responsible || "-",
          ]);

          autoTable(doc, {
            startY: yPos,
            head: [["#", "Beskrivelse", "Alvorlighet", "Status", "Ansvarlig"]],
            body: findingsData,
            theme: "striped",
            styles: { fontSize: 8 },
            headStyles: { fillColor: [30, 58, 82] },
            columnStyles: {
              0: { cellWidth: 10 },
              1: { cellWidth: "auto" },
              2: { cellWidth: 25 },
              3: { cellWidth: 25 },
              4: { cellWidth: 35 },
            },
          });

          yPos = (doc as any).lastAutoTable.finalY + 10;
        }
      });
    }
  }

  // ============ Stoffkartotek ============
  if (sections.includeStoffkartotek && data.stoffkartotek.length > 0) {
    addSectionHeader("Stoffkartotek");

    doc.setFontSize(10);
    doc.text(`Totalt: ${data.stoffkartotek.length} kjemikalier`, 20, yPos);
    yPos += 10;

    const stoffData = data.stoffkartotek.map(s => [
      s.product_name,
      s.manufacturer || "-",
      s.danger_classes?.join(", ") || "-",
      s.location || "-",
      format(new Date(s.last_updated), "d. MMM yyyy", { locale: nb }),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Produktnavn", "Produsent", "Fareklasser", "Plassering", "Sist oppdatert"]],
      body: stoffData,
      theme: "striped",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 58, 82] },
    });
  }

  // ============ Milestones / Fremdriftsplan ============
  if (sections.includeMilestones && data.milestones.length > 0) {
    addSectionHeader("Fremdriftsplan / Milepæler");

    const completedMilestones = data.milestones.filter(m => m.status === "completed").length;
    doc.setFontSize(10);
    doc.text(`Totalt: ${data.milestones.length} milepæler | Fullført: ${completedMilestones}`, 20, yPos);
    yPos += 10;

    const milestoneData = data.milestones.map(m => [
      m.title,
      format(new Date(m.start_date), "d. MMM yyyy", { locale: nb }),
      format(new Date(m.end_date), "d. MMM yyyy", { locale: nb }),
      STATUS_LABELS[m.status] || m.status,
      `${m.progress}%`,
      m.responsible_name || "-",
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Milepæl", "Start", "Slutt", "Status", "Fremdrift", "Ansvarlig"]],
      body: milestoneData,
      theme: "striped",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 58, 82] },
    });
  }

  // ============ Meetings ============
  if (sections.includeMeetings && data.meetings.length > 0) {
    addSectionHeader("Møtereferater");

    const completedMeetings = data.meetings.filter(m => m.status === "completed").length;
    doc.setFontSize(10);
    doc.text(`Totalt: ${data.meetings.length} møter | Fullført: ${completedMeetings}`, 20, yPos);
    yPos += 10;

    const meetingData = data.meetings.map(m => [
      m.meeting_number,
      m.title,
      m.meeting_type,
      format(new Date(m.meeting_date), "d. MMM yyyy", { locale: nb }),
      m.location || "-",
      STATUS_LABELS[m.status] || m.status,
      m.participants?.length ? `${m.participants.length} deltakere` : "-",
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Nr", "Tittel", "Type", "Dato", "Sted", "Status", "Deltakere"]],
      body: meetingData,
      theme: "striped",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 82] },
    });
  }

  // ============ Finances ============
  if (sections.includeFinances && data.finances) {
    addSectionHeader("Økonomioversikt");

    const totalBudget = data.finances.budget_materials + data.finances.budget_labor + 
                        data.finances.budget_subcontractors + data.finances.budget_other;
    const totalActual = data.finances.actual_materials + data.finances.actual_labor + 
                        data.finances.actual_subcontractors + data.finances.actual_other;

    const financeData = [
      ["Kontraktssum", formatCurrency(data.finances.contract_sum)],
      ["", ""],
      ["Budsjett - Materialer", formatCurrency(data.finances.budget_materials)],
      ["Budsjett - Arbeidskraft", formatCurrency(data.finances.budget_labor)],
      ["Budsjett - Underleverandører", formatCurrency(data.finances.budget_subcontractors)],
      ["Budsjett - Annet", formatCurrency(data.finances.budget_other)],
      ["Totalt budsjett", formatCurrency(totalBudget)],
      ["", ""],
      ["Faktisk - Materialer", formatCurrency(data.finances.actual_materials)],
      ["Faktisk - Arbeidskraft", formatCurrency(data.finances.actual_labor)],
      ["Faktisk - Underleverandører", formatCurrency(data.finances.actual_subcontractors)],
      ["Faktisk - Annet", formatCurrency(data.finances.actual_other)],
      ["Totalt faktisk", formatCurrency(totalActual)],
      ["", ""],
      ["Endringsmeldinger sum", formatCurrency(data.finances.change_orders_sum)],
      ["Fakturert beløp", formatCurrency(data.finances.invoiced_amount)],
      ["Betalt beløp", formatCurrency(data.finances.paid_amount)],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [],
      body: financeData,
      theme: "striped",
      styles: { fontSize: 10 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 80 }, 1: { halign: "right" } },
    });

    // Invoices
    if (data.invoices && data.invoices.length > 0) {
      yPos = (doc as any).lastAutoTable.finalY + 15;
      checkPageBreak(40);
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Fakturaer:", 20, yPos);
      yPos += 8;

      const invoiceData = data.invoices.map(i => [
        i.invoice_number,
        i.description || "-",
        formatCurrency(i.amount),
        format(new Date(i.invoice_date), "d. MMM yyyy", { locale: nb }),
        i.due_date ? format(new Date(i.due_date), "d. MMM yyyy", { locale: nb }) : "-",
        STATUS_LABELS[i.status] || i.status,
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["Fakturanr", "Beskrivelse", "Beløp", "Fakturadato", "Forfallsdato", "Status"]],
        body: invoiceData,
        theme: "striped",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 58, 82] },
      });
    }
  }

  // ============ Change Orders ============
  if (sections.includeChangeOrders && data.changeOrders.length > 0) {
    addSectionHeader("Endringsmeldinger");

    const approvedCount = data.changeOrders.filter(c => c.status === "approved").length;
    const totalValue = data.changeOrders.reduce((sum, c) => sum + (c.total_cost || 0), 0);
    doc.setFontSize(10);
    doc.text(`Totalt: ${data.changeOrders.length} endringsmeldinger | Godkjent: ${approvedCount} | Sum: ${formatCurrency(totalValue)}`, 20, yPos);
    yPos += 10;

    const changeOrderData = data.changeOrders.map(c => [
      c.change_order_number,
      c.title,
      formatCurrency(c.total_cost),
      STATUS_LABELS[c.status] || c.status,
      c.customer_approved ? "Ja" : "Nei",
      c.customer_approved_at ? format(new Date(c.customer_approved_at), "d. MMM yyyy", { locale: nb }) : "-",
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Nr", "Tittel", "Beløp", "Status", "Kunde godkjent", "Godkjent dato"]],
      body: changeOrderData,
      theme: "striped",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 58, 82] },
    });
  }

  // ============ Claims ============
  if (sections.includeClaims && data.claims.length > 0) {
    addSectionHeader("Reklamasjoner");

    const resolvedCount = data.claims.filter(c => c.status === "resolved").length;
    doc.setFontSize(10);
    doc.text(`Totalt: ${data.claims.length} reklamasjoner | Løst: ${resolvedCount}`, 20, yPos);
    yPos += 10;

    const claimData = data.claims.map(c => [
      c.claim_number,
      c.title,
      CATEGORY_LABELS[c.category] || c.category,
      PRIORITY_LABELS[c.priority] || c.priority,
      STATUS_LABELS[c.status] || c.status,
      c.reported_date ? format(new Date(c.reported_date), "d. MMM yyyy", { locale: nb }) : "-",
      c.responsible_name || "-",
      formatCurrency(c.actual_cost || c.cost_estimate),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Nr", "Tittel", "Kategori", "Prioritet", "Status", "Rapportert", "Ansvarlig", "Kostnad"]],
      body: claimData,
      theme: "striped",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 82] },
    });
  }

  // ============ Subcontractors ============
  if (sections.includeSubcontractors && data.subcontractors.length > 0) {
    addSectionHeader("Underleverandører");

    const approvedCount = data.subcontractors.filter(s => s.approval_status === "approved").length;
    const totalValue = data.subcontractors.reduce((sum, s) => sum + (s.contract_value || 0), 0);
    doc.setFontSize(10);
    doc.text(`Totalt: ${data.subcontractors.length} underleverandører | Godkjent: ${approvedCount} | Kontraktsverdi: ${formatCurrency(totalValue)}`, 20, yPos);
    yPos += 10;

    const subcontractorData = data.subcontractors.map(s => [
      s.firm_name,
      s.org_number || "-",
      s.work_scope,
      s.trade || "-",
      formatCurrency(s.contract_value),
      APPROVAL_STATUS_LABELS[s.approval_status] || s.approval_status,
      s.is_active ? "Aktiv" : "Inaktiv",
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Firma", "Org.nr", "Arbeidsomfang", "Fag", "Kontraktsverdi", "Godkjenning", "Status"]],
      body: subcontractorData,
      theme: "striped",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 82] },
    });
  }

  // ============ Routines ============
  if (sections.includeRoutines && data.routines.length > 0) {
    addSectionHeader("Rutiner");

    doc.setFontSize(10);
    doc.text(`Totalt: ${data.routines.length} rutiner`, 20, yPos);
    yPos += 10;

    const routineData = data.routines.map(r => [
      r.routine_number,
      r.name,
      ROUTINE_CATEGORY_LABELS[r.category] || r.category,
      r.responsible_role || "-",
      r.is_document ? "Dokument" : "Manuell",
      r.approved_by ? "Godkjent" : "-",
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Nr", "Navn", "Kategori", "Ansvarlig rolle", "Type", "Status"]],
      body: routineData,
      theme: "striped",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 58, 82] },
    });
  }

  // ============ Documents ============
  if (sections.includeDocuments && data.documents.length > 0) {
    addSectionHeader("Dokumentoversikt");

    doc.setFontSize(10);
    doc.text(`Totalt: ${data.documents.length} dokumenter inkludert i rapporten`, 20, yPos);
    yPos += 10;

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
      headStyles: { fillColor: [30, 58, 82] },
    });
  }

  // ============ KS Håndbok ============
  if (sections.includeKsHandbok && data.ksHandbok) {
    addSectionHeader("KS Håndbok");
    const hb = data.ksHandbok;

    // Goals
    if (hb.systemGoals.length > 0) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Målsetting", 20, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      hb.systemGoals.forEach(g => {
        checkPageBreak(10);
        const lines = doc.splitTextToSize(`• ${g.goal_text}`, pageWidth - 45);
        doc.text(lines, 25, yPos);
        yPos += lines.length * 5 + 3;
      });
      yPos += 5;
    }

    if (hb.goals.length > 0) {
      checkPageBreak(15);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Kvalitetsmål", 20, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      hb.goals.forEach(g => {
        checkPageBreak(10);
        const lines = doc.splitTextToSize(`• ${g.goal_text}`, pageWidth - 45);
        doc.text(lines, 25, yPos);
        yPos += lines.length * 5 + 3;
      });
      yPos += 5;
    }

    // Organization
    if (hb.organization?.custom_content) {
      checkPageBreak(15);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Organisasjonsplan", 20, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      let roles: any[] = [];
      try {
        const parsed = JSON.parse(hb.organization.custom_content);
        if (parsed?.roles && Array.isArray(parsed.roles)) roles = parsed.roles;
        else if (Array.isArray(parsed)) roles = parsed;
      } catch {}

      if (roles.length > 0) {
        roles.sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        roles.forEach((role: any) => {
          checkPageBreak(15);
          doc.setFont("helvetica", "bold");
          const title = role.title || "Ukjent rolle";
          const person = role.personName ? ` – ${role.personName}` : "";
          doc.text(`${title}${person}`, 25, yPos);
          yPos += 5;
          doc.setFont("helvetica", "normal");
          if (role.description) {
            const descLines = doc.splitTextToSize(role.description, pageWidth - 50);
            descLines.forEach((line: string) => {
              checkPageBreak(6);
              doc.text(line, 30, yPos);
              yPos += 5;
            });
          }
          yPos += 3;
        });
      } else {
        const plainText = hb.organization.custom_content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        const lines = doc.splitTextToSize(plainText, pageWidth - 40);
        lines.forEach((line: string) => {
          checkPageBreak(7);
          doc.text(line, 25, yPos);
          yPos += 5;
        });
      }
      yPos += 5;
    }

    // Routines
    if (hb.routines.length > 0) {
      checkPageBreak(15);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Rutiner", 20, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      hb.routines.forEach((r, idx) => {
        checkPageBreak(12);
        doc.setFont("helvetica", "bold");
        doc.text(`${idx + 1}. ${r.routine_name}`, 25, yPos);
        yPos += 5;
        doc.setFont("helvetica", "normal");
        if (r.description) {
          const descLines = doc.splitTextToSize(r.description, pageWidth - 50);
          doc.text(descLines, 30, yPos);
          yPos += descLines.length * 5 + 3;
        }
      });
    }
  }

  // ============ Update page decorations on all pages ============
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    // Top bar
    doc.setFillColor(...COLORS.darkBlue);
    doc.rect(0, 0, pageWidth, 8, 'F');
    doc.setFillColor(...COLORS.orange);
    doc.rect(0, 8, pageWidth, 2, 'F');
    // Footer
    doc.setFillColor(...COLORS.darkBlue);
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.white);
    doc.text(data.companyName, 15, pageHeight - 4.5);
    doc.text(`${data.project.project_number} – ${data.project.project_name}`, pageWidth / 2, pageHeight - 4.5, { align: "center" });
    doc.text(`Side ${i} av ${pageCount}`, pageWidth - 15, pageHeight - 4.5, { align: "right" });
    doc.setTextColor(...COLORS.textDark);
  }

  // Download
  const fileName = `Prosjektrapport_${data.project.project_number}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
};
