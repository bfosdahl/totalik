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
      photoUrl?: string;
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
  documents: Array<{
    document_name: string;
    category: string;
    uploaded_at: string;
  }>;
  companyName: string;
  companyLogoUrl?: string;
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
  planned: "Planlagt",
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

const RISK_LEVEL_LABELS: Record<string, string> = {
  low: "Lav risiko",
  medium: "Middels risiko",
  high: "Høy risiko",
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
  includeDocuments: boolean;
}

export const generateProjectReportPdf = (data: ProjectReportData, sections: ReportSections) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;
  let sectionNumber = 0;

  // Helper to add new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > 270) {
      doc.addPage();
      yPos = 20;
    }
  };

  const addSectionHeader = (title: string) => {
    sectionNumber++;
    doc.addPage();
    yPos = 20;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`${sectionNumber}. ${title}`, 20, yPos);
    yPos += 15;
    doc.setFont("helvetica", "normal");
  };

  // ============ Title Page ============
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("PROSJEKTRAPPORT", pageWidth / 2, 50, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Kvalitetssikring og dokumentasjon", pageWidth / 2, 62, { align: "center" });

  // Project name box
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(30, 80, pageWidth - 60, 50, 3, 3, "F");
  
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(data.project.project_name, pageWidth / 2, 100, { align: "center" });
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(data.project.project_number, pageWidth / 2, 115, { align: "center" });
  
  if (data.project.address) {
    doc.text(data.project.address, pageWidth / 2, 125, { align: "center" });
  }

  // Metadata
  doc.setFontSize(10);
  yPos = 160;
  
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
  doc.text(`Generert: ${format(new Date(), "d. MMMM yyyy 'kl.' HH:mm", { locale: nb })}`, pageWidth / 2, 240, { align: "center" });
  doc.text(`Utført av: ${data.generatedBy}`, pageWidth / 2, 248, { align: "center" });
  doc.text(`Bedrift: ${data.companyName}`, pageWidth / 2, 256, { align: "center" });

  // ============ Table of Contents ============
  doc.addPage();
  yPos = 20;
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Innholdsfortegnelse", 20, yPos);
  yPos += 15;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  let tocNumber = 1;

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
  if (sections.includeSja) {
    tocItems.push({ title: "Sikker Jobb Analyse (SJA)", count: data.sjaList.length });
  }
  if (sections.includeVernerunder) {
    tocItems.push({ title: "Vernerunder", count: data.vernerunder.length });
  }
  if (sections.includeDocuments) {
    tocItems.push({ title: "Dokumentoversikt", count: data.documents.length });
  }

  tocItems.forEach((item, index) => {
    const countStr = item.count !== undefined ? ` (${item.count})` : "";
    doc.text(`${index + 1}. ${item.title}${countStr}`, 25, yPos);
    yPos += 8;
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

    // Summary table
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
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Detailed checkpoint responses if enabled
    if (sections.includeChecklistDetails) {
      const completedChecklists = data.checklists.filter(c => c.status === "completed" && c.checkpoints?.length);
      
      completedChecklists.forEach((checklist, idx) => {
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
            headStyles: { fillColor: [59, 130, 246] },
            columnStyles: {
              0: { cellWidth: 80 },
              1: { cellWidth: 30 },
              2: { cellWidth: "auto" },
            },
          });
        }
      });
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
      headStyles: { fillColor: [239, 68, 68] },
    });

    // Detailed avvik information
    if (sections.includeAvvikDetails) {
      data.avvik.forEach((avvik) => {
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
      });
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
      headStyles: { fillColor: [34, 197, 94] },
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
      headStyles: { fillColor: [245, 158, 11] },
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
            headStyles: { fillColor: [245, 158, 11] },
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
            headStyles: { fillColor: [34, 197, 94] },
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
      headStyles: { fillColor: [139, 92, 246] },
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
            headStyles: { fillColor: [139, 92, 246] },
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
      headStyles: { fillColor: [107, 114, 128] },
    });
  }

  // ============ Footer on all pages ============
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 285, pageWidth - 20, 285);
    doc.text(
      `${data.project.project_number} - ${data.project.project_name}`,
      20,
      290
    );
    doc.text(
      `Side ${i} av ${pageCount}`,
      pageWidth - 20,
      290,
      { align: "right" }
    );
  }

  // Download
  const fileName = `Prosjektrapport_${data.project.project_number}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
};
