import { describe, it, expect, beforeAll } from "vitest";
import {
  PDF_PERF_SCENARIOS,
  measureScenario,
  runCalibration,
  formatPerfRow,
  type PerfResult,
} from "./pdfPerf";

/**
 * Enkel ytelsestest for alle PDF-eksporter (dagsrapport med mange bilder,
 * HMS-handbok og avviksrapport). Maaler genereringstid og minnebruk og feiler
 * hvis noe overskrider budsjettet - dvs. ved en ytelsesregresjon.
 *
 * Tiden normaliseres mot en kalibreringsjobb i samme prosess, slik at testen
 * er stabil paa tvers av maskiner og CI-runnere.
 */
describe("PDF-ytelse (dagsrapport, handbok, avvik)", () => {
  let calibrationMs = 0;
  const results: PerfResult[] = [];

  beforeAll(() => {
    // Varm opp jsPDF/fonter, kalibrer deretter paa median av 3 kjoringer.
    runCalibration();
    const samples = [runCalibration(), runCalibration(), runCalibration()].sort((a, b) => a - b);
    calibrationMs = Math.max(samples[1], 1);
  });

  for (const scenario of PDF_PERF_SCENARIOS) {
    it(
      `holder seg innenfor budsjettet: ${scenario.name}`,
      async () => {
        const result = await measureScenario(scenario, calibrationMs);
        results.push(result);
        // eslint-disable-next-line no-console
        console.log(formatPerfRow(result));

        expect(result.bytes).toBeGreaterThan(1000);
        expect(
          result.units,
          `Ytelsesregresjon i genereringstid - ${formatPerfRow(result)}`,
        ).toBeLessThanOrEqual(scenario.budget.maxUnits);
        expect(
          result.heapMb,
          `Ytelsesregresjon i minnebruk - ${formatPerfRow(result)}`,
        ).toBeLessThanOrEqual(scenario.budget.maxHeapMb);
      },
      60_000,
    );
  }

  it("skalerer omtrent lineaert med antall bilder", async () => {
    const small = results.find((r) => r.id === "dagsrapport-30-bilder");
    const large = results.find((r) => r.id === "dagsrapport-80-bilder");
    expect(small && large).toBeTruthy();
    if (!small || !large) return;
    // 80 bilder skal ikke koste mer enn 6x tiden for 30 bilder (2,67x lineaert).
    const ratio = large.ms / Math.max(small.ms, 1);
    expect(ratio, `Ikke-lineaer vekst i PDF-generering: ${ratio.toFixed(2)}x`).toBeLessThan(6);
  });
});
