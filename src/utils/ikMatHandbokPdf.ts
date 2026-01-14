import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface OrganizationRole {
  id: string;
  title: string;
  personName: string;
  description?: string;
}

interface HandbokPdfData {
  companyName: string;
  companyInfo?: {
    name?: string;
    org_number?: string;
    address?: string;
    postal_code?: string;
    city?: string;
    logo_url?: string;
  };
  businessType?: string;
  numberOfEmployees?: string;
  hasCleanZone?: boolean;
  goals: string[];
  organization?: {
    roles: OrganizationRole[];
  };
  haccp: Array<{
    step: string;
    hazard: string;
    criticalLimit: string;
    monitoring: string;
    correctiveAction: string;
    verification: string;
  }>;
  risks: Array<{
    hazard: string;
    consequence: string;
    probability: string;
    riskLevel: string;
    measures: string;
  }>;
  routines: Array<{
    name: string;
    description: string;
    frequency: string;
    responsible: string;
  }>;
  checklists: Array<{
    name: string;
    description: string;
    checkpoints: string[];
  }>;
  cleaningPlan: Array<{
    area: string;
    frequency: string;
    method: string;
    responsible: string;
  }>;
  allergens: Array<{
    name: string;
    present: boolean;
    controlMeasures: string;
  }>;
  contracts: Array<{
    supplier: string;
    type: string;
    frequency: string;
    contact?: string;
    nextReview?: string;
  }>;
}

// Helper to load image as base64
const loadImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

// Format date for PDF
const formatDateForPdf = (date: Date): string => {
  return date.toLocaleDateString('nb-NO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const toText = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  // Prevent accidental "[object Object]" in PDFs
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
};

const getImageFormatFromDataUrl = (dataUrl: string): 'PNG' | 'JPEG' | 'WEBP' => {
  const match = /^data:image\/(png|jpeg|jpg|webp);/i.exec(dataUrl);
  const fmt = (match?.[1] || 'png').toLowerCase();
  if (fmt === 'jpeg' || fmt === 'jpg') return 'JPEG';
  if (fmt === 'webp') return 'WEBP';
  return 'PNG';
};

export const generateIkMatHandbokPdf = async (data: HandbokPdfData): Promise<void> => {
  try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let yPos = margin;

    // Ensure all arrays exist with defaults
    const ensureArray = <T>(value: T[] | undefined | null): T[] => {
      if (Array.isArray(value)) return value;
      return [];
    };

    const safeData = {
      ...data,
      companyName: data.companyName || data.companyInfo?.name || 'Bedrift',
      goals: ensureArray(data.goals),
      organization: data.organization || { roles: [] },
      haccp: ensureArray(data.haccp),
      risks: ensureArray(data.risks),
      routines: ensureArray(data.routines),
      checklists: ensureArray(data.checklists),
      cleaningPlan: ensureArray(data.cleaningPlan),
      allergens: ensureArray(data.allergens),
      contracts: ensureArray(data.contracts),
    };

    // Load logo if available
    let logoBase64: string | null = null;
    if (data.companyInfo?.logo_url) {
      logoBase64 = await loadImageAsBase64(data.companyInfo.logo_url);
    }

    // Table of contents
    type TocEntry = { title: string; page: number };
    const tocEntries: TocEntry[] = [];
    let tocPageNumber = 0;

    const addTocEntry = (title: string) => {
      tocEntries.push({ title, page: doc.getNumberOfPages() });
    };

    const renderToc = () => {
      if (!tocPageNumber) return;
      doc.setPage(tocPageNumber);
      
      // Clear content area
      doc.setFillColor(255, 255, 255);
      doc.rect(margin, margin + 15, contentWidth, pageHeight - (margin + 15) - margin, 'F');

      let tocY = margin + 20;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');

      tocEntries.forEach((item) => {
        if (tocY > pageHeight - margin - 10) return;
        doc.text(item.title, margin, tocY);
        doc.text(String(item.page), pageWidth - margin, tocY, { align: 'right' });
        doc.link(margin, tocY - 5, contentWidth, 7, { pageNumber: item.page });
        tocY += 8;
      });
    };

    const checkPageBreak = (requiredSpace: number) => {
      if (yPos + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };

    const addSectionHeader = (title: string) => {
      checkPageBreak(20);
      doc.setFillColor(34, 139, 34); // Forest green for IK-MAT
      doc.rect(margin, yPos, contentWidth, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin + 5, yPos + 7);
      doc.setTextColor(0, 0, 0);
      yPos += 15;
    };

    // ==================== COVER PAGE ====================
    // Green header bar
    doc.setFillColor(34, 139, 34); // Forest green
    doc.rect(0, 0, pageWidth, 80, 'F');

    // Logo if available
    if (logoBase64) {
      try {
        const logoFormat = getImageFormatFromDataUrl(logoBase64);
        doc.addImage(logoBase64, logoFormat, pageWidth / 2 - 15, 85, 30, 30);
      } catch (e) {
        console.warn('Could not add logo to PDF:', e);
      }
    }

    // Title on header
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('INTERNKONTROLL', pageWidth / 2, 35, { align: 'center' });
    doc.setFontSize(20);
    doc.text('MATSIKKERHET', pageWidth / 2, 50, { align: 'center' });
    doc.setFontSize(14);
    doc.text('IK-MAT HÅNDBOK', pageWidth / 2, 65, { align: 'center' });

    // Company name below header
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    const companyName = safeData.companyName;
    const nameY = logoBase64 ? 130 : 110;
    doc.text(companyName, pageWidth / 2, nameY, { align: 'center' });

    // Company details
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    let detailsY = logoBase64 ? 145 : 125;
    
    const companyInfo = data.companyInfo;
    if (companyInfo?.org_number) {
      doc.text(`Org.nr: ${companyInfo.org_number}`, pageWidth / 2, detailsY, { align: 'center' });
      detailsY += 7;
    }
    if (companyInfo?.address) {
      doc.text(companyInfo.address, pageWidth / 2, detailsY, { align: 'center' });
      detailsY += 7;
    }
    if (companyInfo?.postal_code && companyInfo?.city) {
      doc.text(`${companyInfo.postal_code} ${companyInfo.city}`, pageWidth / 2, detailsY, { align: 'center' });
    }

    // Business type and employees
    detailsY += 15;
    if (safeData.businessType) {
      doc.text(`Virksomhetstype: ${safeData.businessType}`, pageWidth / 2, detailsY, { align: 'center' });
      detailsY += 7;
    }
    if (safeData.numberOfEmployees) {
      doc.text(`Antall ansatte: ${safeData.numberOfEmployees}`, pageWidth / 2, detailsY, { align: 'center' });
    }

    // Date at bottom
    doc.setFontSize(12);
    doc.text(`Dato: ${formatDateForPdf(new Date())}`, pageWidth / 2, pageHeight - 40, { align: 'center' });

    // Footer text
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Utarbeidet i henhold til forskrift om internkontroll', pageWidth / 2, pageHeight - 25, { align: 'center' });
    doc.text('for å oppfylle næringsmiddellovgivningen (IK-MAT)', pageWidth / 2, pageHeight - 18, { align: 'center' });

    // ==================== TABLE OF CONTENTS ====================
    doc.addPage();
    tocPageNumber = doc.getNumberOfPages();
    yPos = margin;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Innhold', margin, yPos);
    yPos += 15;

    // ==================== CONTENT PAGES ====================
    doc.addPage();
    yPos = margin;

    // Goals Section
    if (safeData.goals.length > 0) {
      addTocEntry('1. Målsettinger for matsikkerhet');
      addSectionHeader('1. Målsettinger for matsikkerhet');
      
      safeData.goals.forEach((goal, index) => {
        checkPageBreak(20);
        doc.setFillColor(240, 255, 240); // Light green background
        const goalText = typeof goal === 'string' ? goal : '';
        const lines = doc.splitTextToSize(goalText, contentWidth - 15);
        const boxHeight = lines.length * 6 + 6;
        doc.roundedRect(margin, yPos, contentWidth, boxHeight, 2, 2, 'F');
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(`${index + 1}. ${goalText}`, margin + 5, yPos + 5, { maxWidth: contentWidth - 10 });
        yPos += boxHeight + 3;
      });
      yPos += 10;
    }

    // Organization Section
    const orgRoles = safeData.organization?.roles || [];
    if (orgRoles.length > 0) {
      checkPageBreak(50);
      addTocEntry('2. Organisasjonskart');
      addSectionHeader('2. Organisasjonskart');
      
      autoTable(doc, {
        startY: yPos,
        head: [['Rolle', 'Ansvarlig', 'Beskrivelse']],
        body: orgRoles.map((role) => [
          toText(role.title),
          toText(role.personName) || 'Ikke tildelt',
          toText(role.description) || '-',
        ]),
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [34, 139, 34], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 255, 240] },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 45 },
          1: { cellWidth: 45 },
          2: { cellWidth: 'auto' },
        },
      });
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // HACCP Section
    if (safeData.haccp.length > 0) {
      checkPageBreak(30);
      addTocEntry('3. HACCP - Kritiske Kontrollpunkter');
      addSectionHeader('3. HACCP - Kritiske Kontrollpunkter');
      
      safeData.haccp.forEach((item, index) => {
        checkPageBreak(60);
        
        // Card header
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(margin, yPos, contentWidth, 14, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(34, 139, 34);
        doc.text(`KKP ${index + 1}: ${toText(item.step) || 'Kontrollpunkt'}`, margin + 5, yPos + 9);
        yPos += 18;

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);

        const fields = [
          { label: 'Fare:', value: toText(item.hazard) },
          { label: 'Kritisk grense:', value: toText(item.criticalLimit) },
          { label: 'Overvåking:', value: toText(item.monitoring) },
          { label: 'Korrigerende tiltak:', value: toText(item.correctiveAction) },
          { label: 'Verifisering:', value: toText(item.verification) },
        ];

        fields.forEach(field => {
          if (field.value) {
            checkPageBreak(15);
            doc.setFont('helvetica', 'bold');
            doc.text(field.label, margin + 3, yPos);
            doc.setFont('helvetica', 'normal');
            const lines = doc.splitTextToSize(field.value, contentWidth - 40);
            doc.text(lines, margin + 35, yPos);
            yPos += lines.length * 5 + 3;
          }
        });
        yPos += 8;
      });
    }

    // Risks Section
    if (safeData.risks.length > 0) {
      checkPageBreak(50);
      addTocEntry('4. Risikovurdering');
      addSectionHeader('4. Risikovurdering');
      
      autoTable(doc, {
        startY: yPos,
        head: [['Fare', 'Konsekvens', 'Sannsynlighet', 'Risikonivå', 'Tiltak']],
        body: safeData.risks.map((risk) => [
          toText((risk as any).hazard),
          toText((risk as any).consequence),
          toText((risk as any).probability),
          toText((risk as any).riskLevel),
          toText((risk as any).measures),
        ]),
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [34, 139, 34], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 255, 240] },
      });
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Routines Section
    if (safeData.routines.length > 0) {
      checkPageBreak(30);
      addTocEntry('5. Rutiner og Prosedyrer');
      addSectionHeader('5. Rutiner og Prosedyrer');
      
      safeData.routines.forEach((routine) => {
        checkPageBreak(40);
        
        // Routine header card
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(margin, yPos, contentWidth, 14, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(34, 139, 34);
        doc.text(toText(routine.name) || 'Rutine', margin + 5, yPos + 9);
        yPos += 18;

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        const routineDesc = toText(routine.description);
        if (routineDesc) {
          const descLines = doc.splitTextToSize(routineDesc, contentWidth - 10);
          doc.text(descLines, margin + 3, yPos);
          yPos += descLines.length * 5 + 5;
        }

        doc.setFont('helvetica', 'bold');
        doc.text('Frekvens: ', margin + 3, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(toText(routine.frequency) || 'Ikke oppgitt', margin + 25, yPos);
        yPos += 6;

        doc.setFont('helvetica', 'bold');
        doc.text('Ansvarlig: ', margin + 3, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(toText(routine.responsible) || 'Ikke oppgitt', margin + 25, yPos);
        yPos += 12;
      });
    }

    // Checklists Section
    if (safeData.checklists.length > 0) {
      checkPageBreak(30);
      addTocEntry('6. Sjekklister');
      addSectionHeader('6. Sjekklister');
      
      safeData.checklists.forEach((checklist) => {
        checkPageBreak(35);
        
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(margin, yPos, contentWidth, 14, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(34, 139, 34);
        doc.text(checklist.name || 'Sjekkliste', margin + 5, yPos + 9);
        yPos += 18;

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        
        if (checklist.description) {
          doc.setFont('helvetica', 'italic');
          doc.text(checklist.description, margin + 3, yPos);
          yPos += 7;
        }

        doc.setFont('helvetica', 'normal');
        const checkpoints = checklist.checkpoints || [];
        checkpoints.forEach((point) => {
          checkPageBreak(12);
          // Checkbox style
          doc.setFillColor(34, 139, 34);
          doc.rect(margin + 3, yPos - 3, 3, 3, 'F');
          const pointLines = doc.splitTextToSize(toText(point), contentWidth - 15);
          doc.text(pointLines, margin + 10, yPos);
          yPos += pointLines.length * 5 + 2;
        });
        yPos += 8;
      });
    }

    // Cleaning Plan Section
    if (safeData.cleaningPlan.length > 0) {
      checkPageBreak(50);
      addTocEntry('7. Renholdsplan');
      addSectionHeader('7. Renholdsplan');
      
      autoTable(doc, {
        startY: yPos,
        head: [['Område', 'Frekvens', 'Metode', 'Ansvarlig']],
        body: safeData.cleaningPlan.map((task) => [
          toText((task as any).area),
          toText((task as any).frequency),
          toText((task as any).method),
          toText((task as any).responsible),
        ]),
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [34, 139, 34], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 255, 240] },
      });
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Allergens Section
    if (safeData.allergens.length > 0) {
      checkPageBreak(50);
      addTocEntry('8. Allergenhåndtering');
      addSectionHeader('8. Allergenhåndtering');
      
      autoTable(doc, {
        startY: yPos,
        head: [['Allergen', 'Status', 'Kontrolltiltak']],
        body: safeData.allergens.map((allergen) => [
          toText((allergen as any).name),
          Boolean((allergen as any).present) ? '✓ Tilstede' : '✗ Ikke i bruk',
          toText((allergen as any).controlMeasures) || 'Ingen spesifikke tiltak',
        ]),
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [34, 139, 34], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 255, 240] },
        didParseCell: function(data) {
          if (data.section === 'body' && data.column.index === 1) {
            const text = data.cell.raw as string;
            if (text.startsWith('✓')) {
              data.cell.styles.textColor = [34, 139, 34];
              data.cell.styles.fontStyle = 'bold';
            } else if (text.startsWith('✗')) {
              data.cell.styles.textColor = [150, 150, 150];
            }
          }
        }
      });
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Contracts Section
    if (safeData.contracts.length > 0) {
      checkPageBreak(50);
      addTocEntry('9. Faste Avtaler og Leverandører');
      addSectionHeader('9. Faste Avtaler og Leverandører');
      
      autoTable(doc, {
        startY: yPos,
        head: [['Leverandør', 'Type', 'Frekvens', 'Kontakt', 'Neste revisjon']],
        body: safeData.contracts.map((contract) => [
          toText((contract as any).supplier),
          toText((contract as any).type),
          toText((contract as any).frequency),
          toText((contract as any).contact) || '-',
          toText((contract as any).nextReview) || '-',
        ]),
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [34, 139, 34], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 255, 240] },
      });
    }

    // Render table of contents
    renderToc();

    // Add page numbers
    const totalPages = doc.getNumberOfPages();
    for (let i = 2; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(`Side ${i} av ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.text('IK-MAT Håndbok', margin, pageHeight - 10);
      doc.text(companyName, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }

    // Save PDF
    const companyNameSafe = companyName.replace(/[^a-zA-Z0-9æøåÆØÅ\s-]/g, '').replace(/\s+/g, '-');
    const fileName = `IK-MAT-Handbok-${companyNameSafe}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(`Kunne ikke generere PDF: ${error instanceof Error ? error.message : 'Ukjent feil'}`);
  }
};
