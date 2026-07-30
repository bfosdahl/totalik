import { describe, it, expect } from "vitest";
import { fitImageInCell } from "./ksDailyReportPdf";

// Samme verdier som i dagsrapport-PDF-en
const PAGE_WIDTH = 210;
const MARGIN = 15;
const GAP = 4;
const COLS = 2;
const CELL_W = (PAGE_WIDTH - 2 * MARGIN - GAP) / COLS;
const MAX_H = 80;

const FORMATS: Array<[string, number, number]> = [
  ["4:3 landskap", 4032, 3024],
  ["3:4 portrett", 3024, 4032],
  ["kvadrat 1:1", 2000, 2000],
  ["16:9 panorama", 1920, 1080],
  ["ultrapanorama 3:1", 3000, 1000],
  ["ekstremt høyt 1:4", 800, 3200],
  ["liten miniatyr", 320, 240],
  ["odde 5:7", 500, 700],
];

describe("fitImageInCell — sideforhold i dagsrapport-PDF", () => {
  it.each(FORMATS)("bevarer sideforhold for %s", (_label, w, h) => {
    const { drawW, drawH } = fitImageInCell(w, h, CELL_W, MAX_H);
    expect(drawW / drawH).toBeCloseTo(w / h, 6);
  });

  it.each(FORMATS)("holder seg innenfor cellen for %s", (_label, w, h) => {
    const { drawW, drawH, offsetX } = fitImageInCell(w, h, CELL_W, MAX_H);
    expect(drawW).toBeGreaterThan(0);
    expect(drawH).toBeGreaterThan(0);
    expect(drawW).toBeLessThanOrEqual(CELL_W + 1e-9);
    expect(drawH).toBeLessThanOrEqual(MAX_H + 1e-9);
    expect(offsetX).toBeGreaterThanOrEqual(-1e-9);
    expect(offsetX + drawW).toBeLessThanOrEqual(CELL_W + 1e-9);
  });

  it("sentrerer bildet horisontalt", () => {
    const { drawW, offsetX } = fitImageInCell(800, 3200, CELL_W, MAX_H);
    expect(offsetX).toBeCloseTo((CELL_W - drawW) / 2, 9);
  });

  it("fyller bredden når bildet er bredere enn høyt", () => {
    const { drawW } = fitImageInCell(4000, 3000, CELL_W, MAX_H);
    expect(drawW).toBeCloseTo(CELL_W, 9);
  });

  it("begrenses av maks høyde for portrettbilder", () => {
    const { drawH } = fitImageInCell(3000, 4000, CELL_W, MAX_H);
    expect(drawH).toBeCloseTo(MAX_H, 9);
  });

  it("faller tilbake til 4:3 ved ugyldige dimensjoner", () => {
    for (const [w, h] of [[0, 0], [-1, 100], [100, 0], [NaN, NaN]]) {
      const { drawW, drawH } = fitImageInCell(w, h, CELL_W, MAX_H);
      expect(drawW / drawH).toBeCloseTo(4 / 3, 6);
      expect(drawH).toBeLessThanOrEqual(MAX_H + 1e-9);
    }
  });

  // Snapshot: låser eksakt layout-geometri per format, slik at en regresjon
  // som strekker bildene fanges opp umiddelbart.
  it("matcher layout-snapshot for alle formater", () => {
    const layout = FORMATS.map(([label, w, h]) => {
      const f = fitImageInCell(w, h, CELL_W, MAX_H);
      return {
        format: label,
        drawW: +f.drawW.toFixed(3),
        drawH: +f.drawH.toFixed(3),
        offsetX: +f.offsetX.toFixed(3),
        ratioAvvik: +Math.abs(f.drawW / f.drawH - w / h).toFixed(9),
      };
    });
    expect(layout).toMatchSnapshot();
  });
});
