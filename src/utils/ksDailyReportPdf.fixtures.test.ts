import { describe, it, expect } from "vitest";
import { jsPDF } from "jspdf";
import { fitImageInCell } from "./ksDailyReportPdf";
import { FIXTURE_REPORTS, FIXTURE_PHOTOS } from "./__fixtures__/dailyReports";

/**
 * Ende-til-ende-verifisering: bygger ekte PDF-er med jsPDF for et sett
 * representative dagsrapporter (ulike bildekilder og sideforhold), leser
 * tilbake den faktiske plasseringen av hvert bilde fra PDF-innholdsstrommen
 * og verifiserer at sideforholdet alltid er bevart.
 */

// Samme konstanter som i dagsrapport-PDF-en
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 12;
const GAP = 4;
const COLS = 2;
const CELL_W = (PAGE_W - 2 * MARGIN - GAP) / COLS;
const MAX_H = 80;
const PHOTO_TOP = 40; // start-y for bildeseksjonen i testen
const BOTTOM = PAGE_H - 20;

// Terskler
const MAX_RATIO_DEVIATION = 0.005; // maks 0,5 % avvik i sideforhold
const MAX_STRETCH = 1.005; // maks 0,5 % strekk i en akse
const MM_PER_PT = 25.4 / 72;

interface Placement {
  page: number;
  wMm: number;
  hMm: number;
  xMm: number;
  yMm: number;
}

/** Leser ut alle bildeplasseringer (cm-matriser) fra en generert PDF. */
function readImagePlacements(doc: jsPDF): Placement[] {
  const raw = Buffer.from(doc.output("arraybuffer")).toString("latin1");
  const streams = [...raw.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)].map((m) => m[1]);
  const placements: Placement[] = [];
  let page = 0;
  for (const stream of streams) {
    const matches = [
      ...stream.matchAll(
        /([\d.-]+) 0 0 ([\d.-]+) ([\d.-]+) ([\d.-]+) cm\s*\/I\d+ Do/g,
      ),
    ];
    if (matches.length === 0) continue;
    page++;
    for (const m of matches) {
      const wPt = parseFloat(m[1]);
      const hPt = parseFloat(m[2]);
      const xPt = parseFloat(m[3]);
      const yPt = parseFloat(m[4]);
      placements.push({
        page,
        wMm: wPt * MM_PER_PT,
        hMm: hPt * MM_PER_PT,
        xMm: xPt * MM_PER_PT,
        // PDF-origo er nede til venstre; gjor om til topp-y i mm
        yMm: PAGE_H - (yPt + hPt) * MM_PER_PT,
      });
    }
  }
  return placements;
}

/** Bygger en dagsrapport-PDF med samme bildegrid-logikk som eksporten. */
function buildReportPdf(photos: { dataUrl: string; mime: string; width: number; height: number }[]) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = PHOTO_TOP;
  let col = 0;
  let rowStartY = y;
  let rowMaxH = 0;

  const ensureSpace = (needed: number) => {
    if (y + needed > BOTTOM) {
      doc.addPage();
      y = 20;
    }
  };

  for (const photo of photos) {
    let natW = photo.width;
    let natH = photo.height;
    if (!(natW > 0 && natH > 0)) {
      const props = doc.getImageProperties(photo.dataUrl);
      natW = props.width;
      natH = props.height;
    }
    const { drawW, drawH, offsetX } = fitImageInCell(natW, natH, CELL_W, MAX_H);

    if (col === 0) {
      ensureSpace(MAX_H + 6);
      rowStartY = y;
      rowMaxH = 0;
    }
    const x = MARGIN + col * (CELL_W + GAP) + offsetX;
    doc.addImage(
      photo.dataUrl,
      photo.mime === "image/png" ? "PNG" : "JPEG",
      x,
      rowStartY,
      drawW,
      drawH,
      undefined,
      "FAST",
    );
    rowMaxH = Math.max(rowMaxH, drawH);
    col++;
    if (col >= COLS) {
      col = 0;
      y = rowStartY + rowMaxH + GAP;
    }
  }
  return doc;
}

describe("dagsrapport-PDF — fixtures med ekte bilder", () => {
  it("har fixtures for alle relevante kilder og formater", () => {
    expect(FIXTURE_PHOTOS.length).toBeGreaterThanOrEqual(8);
    expect(new Set(FIXTURE_PHOTOS.map((p) => p.mime))).toEqual(
      new Set(["image/jpeg", "image/png"]),
    );
    expect(new Set(FIXTURE_PHOTOS.map((p) => p.source)).size).toBeGreaterThanOrEqual(6);
    // Fixture-metadata må stemme med de faktiske bildefilene
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    for (const p of FIXTURE_PHOTOS) {
      const props = doc.getImageProperties(p.dataUrl);
      expect({ id: p.id, w: props.width, h: props.height }).toEqual({
        id: p.id,
        w: p.width,
        h: p.height,
      });
    }
  });

  describe.each(FIXTURE_REPORTS.map((r) => [r.name, r] as const))("%s", (_name, report) => {
    const doc = buildReportPdf(report.photos);
    const placements = readImagePlacements(doc);

    it("tegner alle bildene", () => {
      expect(placements).toHaveLength(report.photos.length);
    });

    it("bevarer sideforholdet for hvert bilde", () => {
      placements.forEach((pl, i) => {
        const photo = report.photos[i];
        const expected = photo.width / photo.height;
        const actual = pl.wMm / pl.hMm;
        const deviation = Math.abs(actual - expected) / expected;
        expect(
          deviation,
          `${photo.label}: forventet ${expected.toFixed(4)}, fikk ${actual.toFixed(4)}`,
        ).toBeLessThanOrEqual(MAX_RATIO_DEVIATION);
      });
    });

    it("strekker ikke bildene i noen akse", () => {
      placements.forEach((pl, i) => {
        const photo = report.photos[i];
        // Skalafaktor per akse relativt til bildets naturlige piksler
        const sx = pl.wMm / photo.width;
        const sy = pl.hMm / photo.height;
        const stretch = Math.max(sx / sy, sy / sx);
        expect(stretch, `${photo.label}: strekk ${stretch.toFixed(5)}`).toBeLessThanOrEqual(
          MAX_STRETCH,
        );
      });
    });

    it("holder alle bilder innenfor cellen og siden", () => {
      for (const pl of placements) {
        expect(pl.wMm).toBeLessThanOrEqual(CELL_W + 0.01);
        expect(pl.hMm).toBeLessThanOrEqual(MAX_H + 0.01);
        expect(pl.xMm).toBeGreaterThanOrEqual(MARGIN - 0.01);
        expect(pl.xMm + pl.wMm).toBeLessThanOrEqual(PAGE_W - MARGIN + 0.01);
        expect(pl.yMm).toBeGreaterThanOrEqual(0);
        expect(pl.yMm + pl.hMm).toBeLessThanOrEqual(PAGE_H - 10 + 0.01);
      }
    });

    it("sentrerer bildene horisontalt i kolonnen", () => {
      placements.forEach((pl, i) => {
        const col = i % COLS;
        const cellX = MARGIN + col * (CELL_W + GAP);
        expect(pl.xMm - cellX).toBeCloseTo((CELL_W - pl.wMm) / 2, 2);
      });
    });
  });
});
