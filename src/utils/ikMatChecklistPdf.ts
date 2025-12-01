import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

interface CheckpointResponse {
  checkpoint: string;
  status: 'ok' | 'not_ok' | 'na';
  comment?: string;
}

interface ChecklistPdfData {
  checklistName: string;
  completedByName: string;
  completedAt: string;
  status: string;
  responses: CheckpointResponse[];
  notes?: string;
  companyName?: string;
}

export const generateChecklistPdf = async (data: ChecklistPdfData): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let yPos = 20;

  // Header
  doc.setFontSize(20);
  doc.text('IK/MAT Sjekkliste', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  doc.setFontSize(16);
  doc.text(data.checklistName, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Info section
  doc.setFontSize(10);
  doc.text(`Bedrift: ${data.companyName || 'N/A'}`, 14, yPos);
  yPos += 6;
  doc.text(`Utfylt av: ${data.completedByName}`, 14, yPos);
  yPos += 6;
  doc.text(`Dato: ${format(new Date(data.completedAt), 'dd.MM.yyyy HH:mm', { locale: nb })}`, 14, yPos);
  yPos += 6;
  doc.text(`Status: ${data.status === 'completed' ? 'Fullført' : 'Utkast'}`, 14, yPos);
  yPos += 10;

  // Summary
  const okCount = data.responses.filter(r => r.status === 'ok').length;
  const notOkCount = data.responses.filter(r => r.status === 'not_ok').length;
  const naCount = data.responses.filter(r => r.status === 'na').length;

  doc.setFontSize(12);
  doc.text('Sammendrag', 14, yPos);
  yPos += 7;
  doc.setFontSize(10);
  doc.text(`✓ OK: ${okCount}`, 14, yPos);
  doc.text(`✗ Ikke OK: ${notOkCount}`, 60, yPos);
  doc.text(`- N/A: ${naCount}`, 110, yPos);
  yPos += 10;

  // Checklist items table
  const tableData = data.responses.map((response) => {
    let statusText = '';
    if (response.status === 'ok') statusText = '✓ OK';
    else if (response.status === 'not_ok') statusText = '✗ Ikke OK';
    else statusText = '- N/A';

    return [
      response.checkpoint,
      statusText,
      response.comment || '-'
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [['Kontrollpunkt', 'Status', 'Kommentar']],
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
      0: { cellWidth: 70 },
      1: { cellWidth: 30 },
      2: { cellWidth: 'auto' }
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    didDrawCell: (data) => {
      // Color code status column
      if (data.column.index === 1 && data.section === 'body') {
        const statusText = data.cell.text[0];
        if (statusText.includes('✓ OK')) {
          doc.setTextColor(0, 150, 0);
          doc.text(statusText, data.cell.x + 2, data.cell.y + data.cell.height / 2 + 2);
        } else if (statusText.includes('✗ Ikke OK')) {
          doc.setTextColor(200, 0, 0);
          doc.text(statusText, data.cell.x + 2, data.cell.y + data.cell.height / 2 + 2);
        }
        doc.setTextColor(0, 0, 0); // Reset color
      }
    }
  });

  // Notes section if available
  if (data.notes) {
    const finalY = (doc as any).lastAutoTable.finalY || yPos;
    doc.setFontSize(12);
    doc.text('Notater', 14, finalY + 10);
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
  const dateStr = format(new Date(data.completedAt), 'yyyy-MM-dd-HHmm');
  const filename = `${data.checklistName.replace(/\s+/g, '_')}_${dateStr}.pdf`;
  
  doc.save(filename);
};