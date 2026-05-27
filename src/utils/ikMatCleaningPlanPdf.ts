import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { safeFormatDate } from './safeFormatDate';

interface CleaningRecord {
  area: string;
  completed: boolean;
  notes?: string;
  completedAt?: string;
}

interface CleaningPlanPdfData {
  completedByName: string;
  completedAt: string;
  status: string;
  cleaningRecords: CleaningRecord[];
  notes?: string;
  companyName?: string;
  frequencyType?: string | null;
}

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daglig',
  weekly: 'Ukentlig',
  monthly: 'Månedlig/Periodisk',
};

export const generateCleaningPlanPdf = async (data: CleaningPlanPdfData): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let yPos = 20;

  // Header
  const frequencyLabel = data.frequencyType ? FREQUENCY_LABELS[data.frequencyType] : null;
  const headerTitle = frequencyLabel 
    ? `IK/MAT ${frequencyLabel} Renholdsplan`
    : 'IK/MAT Renholdsplan';
  doc.setFontSize(20);
  doc.text(headerTitle, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Info section
  doc.setFontSize(10);
  doc.text(`Bedrift: ${data.companyName || 'N/A'}`, 14, yPos);
  yPos += 6;
  doc.text(`Utført av: ${data.completedByName}`, 14, yPos);
  yPos += 6;
  doc.text(`Dato: ${safeFormatDate(data.completedAt, 'dd.MM.yyyy HH:mm')}`, 14, yPos);
  yPos += 6;
  doc.text(`Status: ${data.status === 'completed' ? 'Fullført' : 'Utkast'}`, 14, yPos);
  yPos += 10;

  // Summary
  const completedCount = data.cleaningRecords.filter(r => r.completed).length;
  const totalCount = data.cleaningRecords.length;

  doc.setFontSize(12);
  doc.text('Sammendrag', 14, yPos);
  yPos += 7;
  doc.setFontSize(10);
  doc.text(`✓ Fullført: ${completedCount} av ${totalCount}`, 14, yPos);
  yPos += 10;

  // Cleaning records table
  const tableData = data.cleaningRecords.map((record) => {
    const statusText = record.completed ? '✓ Fullført' : '○ Ikke fullført';
    return [
      record.area,
      statusText,
      record.notes || '-'
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [['Område', 'Status', 'Notater']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 4
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 30 },
      2: { cellWidth: 'auto' }
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    didParseCell: (data) => {
      // Color code status column
      if (data.column.index === 1 && data.section === 'body') {
        const statusText = data.cell.text[0];
        if (statusText.includes('✓ Fullført')) {
          data.cell.styles.textColor = [0, 150, 0];
        } else if (statusText.includes('○ Ikke fullført')) {
          data.cell.styles.textColor = [150, 150, 150];
        }
      }
    }
  });

  // Notes section if available
  if (data.notes) {
    const finalY = (doc as any).lastAutoTable.finalY || yPos;
    doc.setFontSize(12);
    doc.text('Generelle notater', 14, finalY + 10);
    doc.setFontSize(10);
    
    const splitNotes = doc.splitTextToSize(data.notes, pageWidth - 28);
    doc.text(splitNotes, 14, finalY + 17);
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Side ${i} av ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // Generate filename
  const dateStr = safeFormatDate(data.completedAt, 'yyyy-MM-dd-HHmm', 'ukjent-dato');
  const freqPrefix = data.frequencyType ? `${FREQUENCY_LABELS[data.frequencyType]}_` : '';
  const filename = `Renholdsplan_${freqPrefix}${dateStr}.pdf`;
  
  doc.save(filename);
};
