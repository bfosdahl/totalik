import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FIXTURE_PHOTOS } from "./__fixtures__/dailyReportPhotos";
import { fitImageInCell } from "./ksDailyReportPdf";

/**
 * Felles ytelsesharness for alle PDF-eksporter (dagsrapport, handbok, avvik ...).
 *
 * Maalet er aa fange regresjoner i genereringstid og minnebruk. Fordi absolutt
 * tid varierer mellom maskiner og CI-runnere, normaliseres maalingene mot en
 * kalibreringsjobb som kjores i samme prosess. Budsjettene under er derfor
 * uttrykt i "kalibreringsenheter" (KE), ikke i millisekunder.
 */

export interface PerfBudget {
  /** Maks genereringstid i kalibreringsenheter (1 KE ~ tiden for kalibreringsjobben). */
  maxUnits: number;
  /** Maks oking i heap (MB) under generering. */
  maxHeapMb: number;
}

export interface PerfScenario {
  id: string;
  name: string;
  budget: PerfBudget;
  run: () => Promise<jsPDF> | jsPDF;
}

export interface PerfResult {
  id: string;
  name: string;
  ms: number;
  units: number;
  heapMb: number;
  bytes: number;
  budget: PerfBudget;
  /** Den genererte PDF-en, lagres som artefakt hvis testen feiler. */
  buffer: ArrayBuffer;
}

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 12;
const GAP = 4;
const COLS = 2;
const CELL_W = (PAGE_W - 2 * MARGIN - GAP) / COLS;
const MAX_H = 80;

const LOREM =
  "Rutinen skal sikre at arbeidet planlegges, gjennomfores og dokumenteres i " +
  "samsvar med arbeidsmiljoloven og internkontrollforskriften. Avvik registreres " +
  "fortlopende og behandles av naermeste leder innen fristen.";

/** Deterministisk pseudorandom slik at maalingene er stabile mellom kjoringer. */
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/** Bygger et dagsrapport-lignende bildegalleri med N bilder. */
export function buildPhotoGridPdf(photoCount: number): jsPDF {
  const doc = new jsPDF();
  const rnd = lcg(42);
  let x = MARGIN;
  let y = 40;
  let rowH = 0;
  doc.setFontSize(14);
  doc.text("Dagsrapport - bildevedlegg", MARGIN, 20);
  doc.setFontSize(9);

  for (let i = 0; i < photoCount; i++) {
    const photo = FIXTURE_PHOTOS[Math.floor(rnd() * FIXTURE_PHOTOS.length)];
    const fit = fitImageInCell(photo.width, photo.height, CELL_W, MAX_H);
    if (y + fit.drawH > PAGE_H - 20) {
      doc.addPage();
      y = 20;
      x = MARGIN;
      rowH = 0;
    }
    const offsetX = x + fit.offsetX;
    doc.addImage(
      photo.dataUrl,
      photo.mime === "image/png" ? "PNG" : "JPEG",
      offsetX,
      y,
      fit.drawW,
      fit.drawH,
    );
    rowH = Math.max(rowH, fit.drawH);
    if (i % COLS === COLS - 1) {
      x = MARGIN;
      y += rowH + GAP + 5;
      rowH = 0;
    } else {
      x += CELL_W + GAP;
    }
  }
  return doc;
}

/** Bygger en handbok-lignende, tekst- og kapitteltung PDF. */
export function buildHandbookLikePdf(chapters: number): jsPDF {
  const doc = new jsPDF();
  for (let c = 0; c < chapters; c++) {
    if (c > 0) doc.addPage();
    doc.setFontSize(16);
    doc.text(`${c + 1}. Kapittel i HMS-handboken`, MARGIN, 25);
    doc.setFontSize(10);
    let y = 35;
    for (let p = 0; p < 8; p++) {
      const lines = doc.splitTextToSize(`${p + 1}. ${LOREM}`, PAGE_W - 2 * MARGIN);
      if (y + lines.length * 5 > PAGE_H - 20) {
        doc.addPage();
        y = 25;
      }
      doc.text(lines, MARGIN, y);
      y += lines.length * 5 + 4;
    }
  }
  return doc;
}

/** Bygger en avvikrapport-lignende PDF med store autoTable-tabeller. */
export function buildAvvikLikePdf(rows: number): jsPDF {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text("Avviksoversikt", MARGIN, 20);
  const body = Array.from({ length: rows }, (_, i) => [
    `AVV-2026-${String(i + 1).padStart(4, "0")}`,
    "2026-03-14",
    ["Kvalitetsavvik", "HMS-avvik", "KS-avvik", "Materialavvik"][i % 4],
    ["Lav", "Middels", "Hoy", "Kritisk"][i % 4],
    ["Ny", "Under behandling", "Lukket"][i % 3],
    LOREM.slice(0, 120),
  ]);
  autoTable(doc, {
    startY: 26,
    head: [["Nr", "Dato", "Kategori", "Alvorlighet", "Status", "Beskrivelse"]],
    body,
    styles: { fontSize: 7 },
  });
  return doc;
}

/**
 * Kalibreringsjobb: en fast, moderat PDF-jobb som brukes til aa normalisere
 * maalingene mot maskinens hastighet.
 */
export function runCalibration(): number {
  const t0 = performance.now();
  buildHandbookLikePdf(4).output("arraybuffer");
  return performance.now() - t0;
}

export const PDF_PERF_SCENARIOS: PerfScenario[] = [
  {
    id: "dagsrapport-30-bilder",
    name: "Dagsrapport med 30 bilder",
    budget: { maxUnits: 45, maxHeapMb: 220 },
    run: () => buildPhotoGridPdf(30),
  },
  {
    id: "dagsrapport-80-bilder",
    name: "Dagsrapport med 80 bilder (verstefall)",
    budget: { maxUnits: 55, maxHeapMb: 450 },
    run: () => buildPhotoGridPdf(80),
  },
  {
    id: "handbok-40-kapitler",
    name: "HMS-handbok med 40 kapitler",
    budget: { maxUnits: 18, maxHeapMb: 200 },
    run: () => buildHandbookLikePdf(40),
  },
  {
    id: "avvik-400-rader",
    name: "Avviksrapport med 400 rader",
    budget: { maxUnits: 90, maxHeapMb: 250 },
    run: () => buildAvvikLikePdf(400),
  },
];

/** Kjorer ett scenario og maaler tid, minne og filstorrelse. */
export async function measureScenario(
  scenario: PerfScenario,
  calibrationMs: number,
): Promise<PerfResult> {
  const gc = (globalThis as { gc?: () => void }).gc;
  gc?.();
  const heapBefore = process.memoryUsage().heapUsed;
  const t0 = performance.now();
  const doc = await scenario.run();
  const buffer = doc.output("arraybuffer");
  const ms = performance.now() - t0;
  const heapAfter = process.memoryUsage().heapUsed;
  return {
    id: scenario.id,
    name: scenario.name,
    ms,
    units: ms / calibrationMs,
    heapMb: Math.max(0, (heapAfter - heapBefore) / (1024 * 1024)),
    bytes: buffer.byteLength,
    budget: scenario.budget,
    buffer,
  };
}

export function formatPerfRow(r: PerfResult): string {
  return (
    `${r.name}: ${r.ms.toFixed(0)} ms (${r.units.toFixed(2)} KE / budsjett ${r.budget.maxUnits} KE), ` +
    `heap +${r.heapMb.toFixed(1)} MB (budsjett ${r.budget.maxHeapMb} MB), ` +
    `${(r.bytes / 1024).toFixed(0)} kB PDF`
  );
}
