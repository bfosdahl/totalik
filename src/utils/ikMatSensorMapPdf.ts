import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface SensorMapRow {
  externalId: string;
  name: string;
  provider: string;
  location: string;
  equipment: string;
  minTemp: number | null;
  maxTemp: number | null;
  offlineAfterMinutes: number;
  status: string;
  lastReadingAt: string | null;
  lastTemperature: number | null;
  lastBattery: number | null;
}

export interface SensorMapPdfData {
  companyName: string;
  rows: SensorMapRow[];
  webhookConfigured: boolean;
}

const fmtDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('nb-NO', { dateStyle: 'short', timeStyle: 'short' }) : 'Aldri';

const fmtRange = (min: number | null, max: number | null) => {
  if (min === null && max === null) return 'Ikke satt';
  const lo = min === null ? '—' : `${min} °C`;
  const hi = max === null ? '—' : `${max} °C`;
  return `${lo} til ${hi}`;
};

export function generateSensorMapPdf(data: SensorMapPdfData) {
  const doc = new jsPDF({ orientation: 'landscape' });
  const pageWidth = doc.internal.pageSize.width;
  let y = 16;

  doc.setFontSize(16);
  doc.text('Sensorkart – IK MAT', 14, y);
  y += 7;

  doc.setFontSize(10);
  doc.text(data.companyName || 'Ukjent bedrift', 14, y);
  y += 5;
  doc.text(`Utskrift: ${new Date().toLocaleString('nb-NO')}`, 14, y);
  y += 5;
  doc.text(
    `Antall sensorer: ${data.rows.length} · Sensormottak: ${data.webhookConfigured ? 'aktivert' : 'ikke aktivert'}`,
    14,
    y,
  );
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [[
      'Sensor-ID',
      'Navn',
      'Plassering',
      'Utstyr',
      'Grenser',
      'Frakoblet etter',
      'Status',
      'Siste data',
      'Siste temp.',
      'Batteri',
    ]],
    body: data.rows.map((r) => [
      r.externalId,
      r.name || '-',
      r.location || '-',
      r.equipment || 'Ikke koblet',
      fmtRange(r.minTemp, r.maxTemp),
      `${r.offlineAfterMinutes} min`,
      r.status,
      fmtDateTime(r.lastReadingAt),
      r.lastTemperature !== null ? `${r.lastTemperature.toFixed(1)} °C` : '-',
      r.lastBattery !== null ? `${Math.round(r.lastBattery)} %` : '-',
    ]),
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: [40, 78, 120], textColor: 255, fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { cellWidth: 34 },
      1: { cellWidth: 32 },
      2: { cellWidth: 30 },
      3: { cellWidth: 32 },
      4: { cellWidth: 30 },
      5: { cellWidth: 22 },
      6: { cellWidth: 22 },
      7: { cellWidth: 28 },
      8: { cellWidth: 20 },
      9: { cellWidth: 16 },
    },
    didDrawPage: () => {
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(7);
      doc.setTextColor(120);
      doc.text(
        'Dokumentasjon av automatisk temperaturovervåking (IK MAT / HACCP) – generert av Total-IK',
        14,
        pageHeight - 8,
      );
      doc.text(
        `Side ${doc.getNumberOfPages()}`,
        pageWidth - 14,
        pageHeight - 8,
        { align: 'right' },
      );
      doc.setTextColor(0);
    },
  });

  const fileName = `sensorkart_${getLocalDateString()}.pdf`;
  doc.save(fileName);
}
