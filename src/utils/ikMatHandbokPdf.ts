import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface HandbokPdfData {
  companyName: string;
  businessType?: string;
  numberOfEmployees?: string;
  hasCleanZone?: boolean;
  goals: string[];
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

export const generateIkMatHandbokPdf = async (data: HandbokPdfData): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 14;
  let yPosition = 20;

  // Helper function to add new page if needed
  const checkPageBreak = (neededSpace: number = 30) => {
    if (yPosition + neededSpace > 280) {
      doc.addPage();
      yPosition = 20;
    }
  };

  // Helper to add section header
  const addSectionHeader = (title: string) => {
    checkPageBreak(20);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, yPosition);
    yPosition += 10;
  };

  // Title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('IK-MAT Håndbok', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Internkontroll Matsikkerhet', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Company Info
  addSectionHeader('Bedriftsinformasjon');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Bedriftsnavn: ${data.companyName}`, margin, yPosition);
  yPosition += 7;
  if (data.businessType) {
    doc.text(`Virksomhetstype: ${data.businessType}`, margin, yPosition);
    yPosition += 7;
  }
  if (data.numberOfEmployees) {
    doc.text(`Antall ansatte: ${data.numberOfEmployees}`, margin, yPosition);
    yPosition += 7;
  }
  doc.text(`Ren/uren sone: ${data.hasCleanZone ? 'Ja' : 'Nei'}`, margin, yPosition);
  yPosition += 12;

  // Goals
  if (data.goals.length > 0) {
    addSectionHeader('Målsettinger');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    data.goals.forEach((goal, index) => {
      checkPageBreak(10);
      const lines = doc.splitTextToSize(`${index + 1}. ${goal}`, pageWidth - margin * 2);
      doc.text(lines, margin, yPosition);
      yPosition += lines.length * 5 + 3;
    });
    yPosition += 5;
  }

  // HACCP
  if (data.haccp.length > 0) {
    addSectionHeader('HACCP - Kritiske Kontrollpunkter (KKP)');
    data.haccp.forEach((item) => {
      checkPageBreak(50);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(item.step, margin, yPosition);
      yPosition += 7;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Fare:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      const hazardLines = doc.splitTextToSize(item.hazard, pageWidth - margin * 2 - 30);
      doc.text(hazardLines, margin + 30, yPosition);
      yPosition += hazardLines.length * 5 + 2;

      doc.setFont('helvetica', 'bold');
      doc.text('Kritisk grense:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      const limitLines = doc.splitTextToSize(item.criticalLimit, pageWidth - margin * 2 - 30);
      doc.text(limitLines, margin + 30, yPosition);
      yPosition += limitLines.length * 5 + 2;

      doc.setFont('helvetica', 'bold');
      doc.text('Overvåking:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      const monitorLines = doc.splitTextToSize(item.monitoring, pageWidth - margin * 2 - 30);
      doc.text(monitorLines, margin + 30, yPosition);
      yPosition += monitorLines.length * 5 + 2;

      doc.setFont('helvetica', 'bold');
      doc.text('Korrigerende tiltak:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      const actionLines = doc.splitTextToSize(item.correctiveAction, pageWidth - margin * 2 - 30);
      doc.text(actionLines, margin + 30, yPosition);
      yPosition += actionLines.length * 5 + 2;

      doc.setFont('helvetica', 'bold');
      doc.text('Verifisering:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      const verifyLines = doc.splitTextToSize(item.verification, pageWidth - margin * 2 - 30);
      doc.text(verifyLines, margin + 30, yPosition);
      yPosition += verifyLines.length * 5 + 7;
    });
  }

  // Risks
  if (data.risks.length > 0) {
    addSectionHeader('Generell Risikovurdering');
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Fare', 'Konsekvens', 'Sannsynlighet', 'Risikonivå', 'Tiltak']],
      body: data.risks.map(risk => [
        risk.hazard,
        risk.consequence,
        risk.probability,
        risk.riskLevel,
        risk.measures
      ]),
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Routines
  if (data.routines.length > 0) {
    checkPageBreak(30);
    addSectionHeader('Rutiner og Prosedyrer');
    data.routines.forEach((routine) => {
      checkPageBreak(35);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(routine.name, margin, yPosition);
      yPosition += 7;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(routine.description, pageWidth - margin * 2);
      doc.text(descLines, margin, yPosition);
      yPosition += descLines.length * 5 + 3;

      doc.text(`Frekvens: ${routine.frequency}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Ansvarlig: ${routine.responsible}`, margin, yPosition);
      yPosition += 10;
    });
  }

  // Checklists
  if (data.checklists.length > 0) {
    checkPageBreak(30);
    addSectionHeader('Sjekklister');
    data.checklists.forEach((checklist) => {
      checkPageBreak(30);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(checklist.name, margin, yPosition);
      yPosition += 5;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text(checklist.description, margin, yPosition);
      yPosition += 7;

      doc.setFont('helvetica', 'normal');
      checklist.checkpoints?.forEach((point) => {
        checkPageBreak(10);
        const pointLines = doc.splitTextToSize(`• ${point}`, pageWidth - margin * 2 - 5);
        doc.text(pointLines, margin + 5, yPosition);
        yPosition += pointLines.length * 5 + 2;
      });
      yPosition += 5;
    });
  }

  // Cleaning Plan
  if (data.cleaningPlan.length > 0) {
    checkPageBreak(50);
    addSectionHeader('Renholdsplan');
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Område', 'Frekvens', 'Metode', 'Ansvarlig']],
      body: data.cleaningPlan.map(task => [
        task.area,
        task.frequency,
        task.method,
        task.responsible
      ]),
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Allergens
  if (data.allergens.length > 0) {
    checkPageBreak(50);
    addSectionHeader('Allergener');
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Allergen', 'Status', 'Kontrolltiltak']],
      body: data.allergens.map(allergen => [
        allergen.name,
        allergen.present ? 'Tilstede' : 'Ikke i bruk',
        allergen.controlMeasures || 'Ingen spesifikke tiltak nødvendig'
      ]),
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Contracts
  if (data.contracts.length > 0) {
    checkPageBreak(50);
    addSectionHeader('Faste Avtaler');
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Leverandør', 'Type', 'Frekvens', 'Neste revisjon']],
      body: data.contracts.map(contract => [
        contract.supplier,
        contract.type,
        contract.frequency,
        contract.nextReview || '-'
      ]),
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });
  }

  // Save PDF
  const fileName = `IK-MAT-Handbok-${data.companyName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
