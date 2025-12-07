import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface ProjectData {
  project: any;
  goals?: any[];
  organization?: any;
  risks?: any[];
  actions?: any[];
  documents?: any[];
  checklists?: any[];
  sja?: any[];
  deviations?: any[];
  changeOrders?: any[];
  safetyRounds?: any[];
  hazardousConditions?: any[];
  subcontractors?: any[];
  activityLog?: any[];
}

interface IncludeOptions {
  projectInfo: boolean;
  hmsPlan: boolean;
  documents: boolean;
  checklists: boolean;
  sja: boolean;
  deviations: boolean;
  changeOrders: boolean;
  safetyRounds: boolean;
  hazardousConditions: boolean;
  subcontractors: boolean;
  activityLog: boolean;
}

export const generateProjectReport = async (data: ProjectData, options: IncludeOptions) => {
  const doc = new jsPDF();
  let yPosition = 20;

  // Helper function to add new page if needed
  const checkPageBreak = (neededSpace: number = 20) => {
    if (yPosition + neededSpace > 270) {
      doc.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };

  // Helper to add section header
  const addSectionHeader = (title: string) => {
    checkPageBreak(15);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(title, 20, yPosition);
    yPosition += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  };

  // Cover page
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("PROSJEKTPERM", 105, 80, { align: "center" });
  
  doc.setFontSize(16);
  doc.text(data.project.name || "Prosjekt", 105, 100, { align: "center" });
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  if (data.project.project_number) {
    doc.text(`Prosjektnr: ${data.project.project_number}`, 105, 115, { align: "center" });
  }
  if (data.project.address) {
    doc.text(data.project.address, 105, 125, { align: "center" });
  }
  
  doc.setFontSize(10);
  doc.text(`Generert: ${format(new Date(), "dd.MM.yyyy HH:mm", { locale: nb })}`, 105, 260, { align: "center" });

  doc.addPage();
  yPosition = 20;

  // Table of contents
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Innhold", 20, yPosition);
  yPosition += 10;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  let pageNum = 3;
  const contents: string[] = [];
  
  if (options.projectInfo) contents.push(`${pageNum++}. Prosjektinformasjon`);
  if (options.hmsPlan) contents.push(`${pageNum++}. HMS-plan`);
  if (options.documents) contents.push(`${pageNum++}. Dokumenter`);
  if (options.checklists) contents.push(`${pageNum++}. Sjekklister`);
  if (options.sja) contents.push(`${pageNum++}. SJA`);
  if (options.deviations) contents.push(`${pageNum++}. Avvik`);
  if (options.changeOrders) contents.push(`${pageNum++}. Endringsmeldinger`);
  if (options.safetyRounds) contents.push(`${pageNum++}. Vernerunder`);
  if (options.hazardousConditions) contents.push(`${pageNum++}. Farlige forhold`);
  if (options.subcontractors) contents.push(`${pageNum++}. Underleverandører`);
  if (options.activityLog) contents.push(`${pageNum++}. Tiltakslogg`);
  
  contents.forEach(item => {
    doc.text(item, 20, yPosition);
    yPosition += 7;
  });

  doc.addPage();
  yPosition = 20;

  // Project Information
  if (options.projectInfo) {
    addSectionHeader("1. PROSJEKTINFORMASJON");
    
    const projectInfo = [
      ["Prosjektnavn", data.project.name || "-"],
      ["Prosjektnummer", data.project.project_number || "-"],
      ["Adresse", data.project.address || "-"],
      ["Kunde", data.project.client_name || "-"],
      ["Tiltaksklasse", data.project.tiltaksklasse || "-"],
      ["Ansvarsrolle", data.project.ansvarsrolle || "-"],
      ["Startdato", data.project.start_date ? format(new Date(data.project.start_date), "dd.MM.yyyy", { locale: nb }) : "-"],
      ["Sluttdato", data.project.end_date ? format(new Date(data.project.end_date), "dd.MM.yyyy", { locale: nb }) : "-"],
      ["Status", data.project.status || "-"],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [["Felt", "Verdi"]],
      body: projectInfo,
      theme: "grid",
      headStyles: { fillColor: [71, 85, 105] },
      margin: { left: 20, right: 20 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
    doc.addPage();
    yPosition = 20;
  }

  // HMS Plan
  if (options.hmsPlan && (data.goals || data.organization || data.risks || data.actions)) {
    addSectionHeader("2. HMS-PLAN");
    
    if (data.goals && data.goals.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("Mål:", 20, yPosition);
      yPosition += 7;
      doc.setFont("helvetica", "normal");
      
      data.goals.forEach((goal, index) => {
        checkPageBreak();
        doc.text(`${index + 1}. ${goal.goal_text}`, 25, yPosition);
        yPosition += 7;
      });
      yPosition += 5;
    }

    if (data.risks && data.risks.length > 0) {
      checkPageBreak(20);
      doc.setFont("helvetica", "bold");
      doc.text("Risikovurdering:", 20, yPosition);
      yPosition += 7;

      const riskData = data.risks.map(risk => [
        risk.hazard || "-",
        risk.probability?.toString() || "-",
        risk.consequence?.toString() || "-",
        risk.risk_score?.toString() || "-",
        risk.measures || "-",
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [["Fare", "Sann.", "Kons.", "Risiko", "Tiltak"]],
        body: riskData,
        theme: "grid",
        headStyles: { fillColor: [71, 85, 105] },
        margin: { left: 20, right: 20 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    if (data.actions && data.actions.length > 0) {
      checkPageBreak(20);
      doc.setFont("helvetica", "bold");
      doc.text("Handlingsplan:", 20, yPosition);
      yPosition += 7;

      const actionData = data.actions.map(action => [
        action.description || "-",
        action.responsible || "-",
        action.deadline ? format(new Date(action.deadline), "dd.MM.yyyy", { locale: nb }) : "-",
        action.status || "-",
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [["Tiltak", "Ansvarlig", "Frist", "Status"]],
        body: actionData,
        theme: "grid",
        headStyles: { fillColor: [71, 85, 105] },
        margin: { left: 20, right: 20 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    doc.addPage();
    yPosition = 20;
  }

  // Documents
  if (options.documents && data.documents && data.documents.length > 0) {
    addSectionHeader("3. DOKUMENTER");

    // Filter to only included documents
    const includedDocs = data.documents.filter(d => d.include_in_report);
    
    if (includedDocs.length > 0) {
      const docData = includedDocs.map(docItem => [
        docItem.document_name || "-",
        docItem.category || "-",
        docItem.document_number || "-",
        `v${docItem.version || 1}`,
        docItem.created_at ? format(new Date(docItem.created_at), "dd.MM.yyyy", { locale: nb }) : "-",
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [["Dokumentnavn", "Kategori", "Dok.nr", "Versjon", "Dato"]],
        body: docData,
        theme: "grid",
        headStyles: { fillColor: [71, 85, 105] },
        margin: { left: 20, right: 20 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    } else {
      doc.setFont("helvetica", "normal");
      doc.text("Ingen dokumenter merket for inkludering i rapport", 20, yPosition);
      yPosition += 10;
    }
    
    doc.addPage();
    yPosition = 20;
  }

  // Checklists with details
  if (options.checklists && data.checklists && data.checklists.length > 0) {
    addSectionHeader("4. SJEKKLISTER");

    for (const checklist of data.checklists) {
      checkPageBreak(30);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(checklist.template?.name || "Sjekkliste", 20, yPosition);
      yPosition += 7;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      if (checklist.template?.phase) {
        doc.text(`Fase: ${checklist.template.phase}`, 25, yPosition);
        yPosition += 5;
      }
      if (checklist.filled_at) {
        doc.text(`Utført: ${format(new Date(checklist.filled_at), "dd.MM.yyyy", { locale: nb })}`, 25, yPosition);
        yPosition += 5;
      }
      
      yPosition += 5;
      
      // Show checklist items
      if (checklist.items && checklist.items.length > 0) {
        for (const item of checklist.items) {
          checkPageBreak(40);
          
          doc.setFont("helvetica", "bold");
          doc.text(`${item.template_item?.text || 'Punkt'}`, 25, yPosition);
          yPosition += 5;
          
          doc.setFont("helvetica", "normal");
          doc.text(`Status: ${item.status || 'Ikke utfylt'}`, 30, yPosition);
          yPosition += 5;
          
          if (item.comment) {
            doc.text(`Kommentar: ${item.comment}`, 30, yPosition, { maxWidth: 160 });
            yPosition += Math.ceil(item.comment.length / 80) * 5 + 3;
          }
          
          // Add photos if any
          if (item.photos && item.photos.length > 0) {
            doc.text(`Bilder (${item.photos.length}):`, 30, yPosition);
            yPosition += 5;
            
            for (const photo of item.photos) {
              try {
                checkPageBreak(60);
                
                // Fetch signed URL for photo from storage
                const { data: signedData, error: signedError } = await supabase.storage
                  .from('project-documents')
                  .createSignedUrl(photo.file_path, 3600);
                
                if (!signedError && signedData?.signedUrl) {
                  // Note: jsPDF addImage requires base64 or data URL
                  // For production, you'd need to fetch and convert the image
                  doc.text(`- Bilde tatt: ${format(new Date(photo.taken_at), "dd.MM.yyyy HH:mm", { locale: nb })}`, 35, yPosition);
                  yPosition += 5;
                }
              } catch (error) {
                console.error('Error adding photo to PDF:', error);
              }
            }
            
            yPosition += 3;
          }
          
          yPosition += 3;
        }
      }
      
      yPosition += 5;
    }

    doc.addPage();
    yPosition = 20;
  }

  // SJA
  if (options.sja && data.sja && data.sja.length > 0) {
    addSectionHeader("5. SIKKER JOBB ANALYSE (SJA)");

    data.sja.forEach((sja, index) => {
      checkPageBreak(40);
      
      doc.setFont("helvetica", "bold");
      doc.text(`SJA ${index + 1}: ${sja.title}`, 20, yPosition);
      yPosition += 7;
      doc.setFont("helvetica", "normal");
      
      if (sja.sja_nr) {
        doc.text(`SJA-nr: ${sja.sja_nr}`, 25, yPosition);
        yPosition += 6;
      }
      if (sja.date) {
        doc.text(`Dato: ${format(new Date(sja.date), "dd.MM.yyyy", { locale: nb })}`, 25, yPosition);
        yPosition += 6;
      }
      if (sja.aktivitet) {
        doc.text(`Aktivitet: ${sja.aktivitet}`, 25, yPosition);
        yPosition += 6;
      }
      if (sja.identifisert_risiko) {
        doc.text(`Risiko: ${sja.identifisert_risiko}`, 25, yPosition);
        yPosition += 6;
      }
      if (sja.risikoreduserende_tiltak) {
        doc.text(`Tiltak: ${sja.risikoreduserende_tiltak}`, 25, yPosition);
        yPosition += 6;
      }
      
      yPosition += 5;
    });

    doc.addPage();
    yPosition = 20;
  }

  // Deviations
  if (options.deviations && data.deviations && data.deviations.length > 0) {
    addSectionHeader("6. AVVIK");

    const devData = data.deviations.map(dev => [
      dev.avvik_nummer || "-",
      dev.tittel || "-",
      dev.kategori || "-",
      dev.prioritet || "-",
      dev.status || "-",
      dev.frist ? format(new Date(dev.frist), "dd.MM.yyyy", { locale: nb }) : "-",
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Avviksnr", "Tittel", "Kategori", "Prioritet", "Status", "Frist"]],
      body: devData,
      theme: "grid",
      headStyles: { fillColor: [71, 85, 105] },
      margin: { left: 20, right: 20 },
      columnStyles: {
        1: { cellWidth: 50 },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
    doc.addPage();
    yPosition = 20;
  }

  // Change Orders
  if (options.changeOrders && data.changeOrders && data.changeOrders.length > 0) {
    addSectionHeader("7. ENDRINGSMELDINGER");

    const coData = data.changeOrders.map(co => [
      co.title || "-",
      co.price_ex_vat ? `${co.price_ex_vat} kr` : "-",
      co.customer_approved ? "Ja" : "Nei",
      co.created_at ? format(new Date(co.created_at), "dd.MM.yyyy", { locale: nb }) : "-",
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Tittel", "Pris (ex mva)", "Godkjent", "Dato"]],
      body: coData,
      theme: "grid",
      headStyles: { fillColor: [71, 85, 105] },
      margin: { left: 20, right: 20 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
    doc.addPage();
    yPosition = 20;
  }

  // Safety Rounds
  if (options.safetyRounds && data.safetyRounds && data.safetyRounds.length > 0) {
    addSectionHeader("8. VERNERUNDER");

    const srData = data.safetyRounds.map(sr => [
      sr.round_date ? format(new Date(sr.round_date), "dd.MM.yyyy", { locale: nb }) : "-",
      sr.participants || "-",
      sr.findings || "-",
      sr.status || "-",
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Dato", "Deltakere", "Funn", "Status"]],
      body: srData,
      theme: "grid",
      headStyles: { fillColor: [71, 85, 105] },
      margin: { left: 20, right: 20 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
    doc.addPage();
    yPosition = 20;
  }

  // Hazardous Conditions
  if (options.hazardousConditions && data.hazardousConditions && data.hazardousConditions.length > 0) {
    addSectionHeader("9. FARLIGE FORHOLD");

    const hcData = data.hazardousConditions.map(hc => [
      hc.condition_number || "-",
      hc.description || "-",
      hc.severity || "-",
      hc.status || "-",
      hc.deadline ? format(new Date(hc.deadline), "dd.MM.yyyy", { locale: nb }) : "-",
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Nr", "Beskrivelse", "Alvorlighet", "Status", "Frist"]],
      body: hcData,
      theme: "grid",
      headStyles: { fillColor: [71, 85, 105] },
      margin: { left: 20, right: 20 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
    doc.addPage();
    yPosition = 20;
  }

  // Subcontractors
  if (options.subcontractors && data.subcontractors && data.subcontractors.length > 0) {
    addSectionHeader("10. UNDERLEVERANDØRER");

    const subData = data.subcontractors.map(sub => [
      sub.subcontractor_name || "-",
      sub.work_scope || "-",
      sub.contact_person || "-",
      sub.contact_email || "-",
      sub.status || "-",
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Firma", "Arbeidsomfang", "Kontakt", "E-post", "Status"]],
      body: subData,
      theme: "grid",
      headStyles: { fillColor: [71, 85, 105] },
      margin: { left: 20, right: 20 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
    doc.addPage();
    yPosition = 20;
  }

  // Activity Log
  if (options.activityLog && data.activityLog && data.activityLog.length > 0) {
    addSectionHeader("11. TILTAKSLOGG / TIDSLINJE");

    const logData = data.activityLog.map(log => [
      log.created_at ? format(new Date(log.created_at), "dd.MM.yyyy HH:mm", { locale: nb }) : "-",
      log.activity_type || "-",
      log.activity_description || "-",
      log.performed_by_name || "-",
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Tidspunkt", "Type", "Beskrivelse", "Utført av"]],
      body: logData,
      theme: "grid",
      headStyles: { fillColor: [71, 85, 105] },
      margin: { left: 20, right: 20 },
      columnStyles: {
        2: { cellWidth: 70 },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Save PDF
  const fileName = `Prosjektperm_${data.project.project_number || data.project.name}_${format(new Date(), "yyyyMMdd")}.pdf`;
  doc.save(fileName);
};
