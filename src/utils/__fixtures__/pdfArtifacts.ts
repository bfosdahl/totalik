import { mkdirSync, writeFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import path from "node:path";
import type { jsPDF } from "jspdf";
import {
  DIFF_DIR,
  createCanvas,
  encodePng,
  fillRect,
  setPx,
  strokeRect,
  type Canvas,
} from "./pdfDiffImage";

/**
 * Feilsokingsartefakter for PDF-testene.
 *
 * Naar en test feiler lagres:
 *  1. den faktisk genererte PDF-en (.pdf) slik at den kan aapnes direkte,
 *  2. et for/etter-overlay (.png) som viser kildebildet tegnet med korrekt
 *     sideforhold (FOR / gronn) mot slik det faktisk havnet i PDF-en
 *     (ETTER / rod), inkludert et utsnitt (crop) av selve bildet,
 *  3. en .txt med tallene bak avviket.
 *
 * Alt havner i test-artifacts/pdf-diff/ som lastes opp som artefakt i CI.
 */

export const ARTIFACT_DIR = DIFF_DIR;

export function artifactSlug(name: string): string {
  return name.replace(/[^\w.-]+/g, "_").slice(0, 120);
}

/** Lagrer en generert PDF for feilsoking. Returnerer filstien. */
export function savePdfArtifact(name: string, doc: jsPDF): string {
  mkdirSync(ARTIFACT_DIR, { recursive: true });
  const file = path.join(ARTIFACT_DIR, `${artifactSlug(name)}.pdf`);
  writeFileSync(file, Buffer.from(doc.output("arraybuffer")));
  return file;
}

/** Lagrer fritekst-metadata ved siden av et artefakt. */
export function saveTextArtifact(name: string, lines: string[]): string {
  mkdirSync(ARTIFACT_DIR, { recursive: true });
  const file = path.join(ARTIFACT_DIR, `${artifactSlug(name)}.txt`);
  writeFileSync(file, lines.join("\n") + "\n");
  return file;
}

/* ------------------------------------------------------------------ */
/* Minimal PNG-dekoder (8-bit truecolor/RGBA) for bildecrop i overlay   */
/* ------------------------------------------------------------------ */

interface DecodedImage {
  w: number;
  h: number;
  rgb: Uint8Array; // w*h*3
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

/** Dekoder en base64 PNG (8-bit, fargetype 2 eller 6). Returnerer null ellers. */
export function decodePngDataUrl(dataUrl: string): DecodedImage | null {
  try {
    const b64 = dataUrl.split(",")[1];
    if (!b64) return null;
    const buf = Buffer.from(b64, "base64");
    if (buf.readUInt32BE(0) !== 0x89504e47) return null;
    let off = 8;
    let w = 0;
    let h = 0;
    let channels = 0;
    const idat: Buffer[] = [];
    while (off < buf.length) {
      const len = buf.readUInt32BE(off);
      const type = buf.toString("latin1", off + 4, off + 8);
      const data = buf.subarray(off + 8, off + 8 + len);
      if (type === "IHDR") {
        w = data.readUInt32BE(0);
        h = data.readUInt32BE(4);
        if (data[8] !== 8) return null; // kun 8-bit
        if (data[9] === 2) channels = 3;
        else if (data[9] === 6) channels = 4;
        else return null;
        if (data[12] !== 0) return null; // ingen interlace
      } else if (type === "IDAT") {
        idat.push(Buffer.from(data));
      } else if (type === "IEND") {
        break;
      }
      off += 12 + len;
    }
    if (!w || !h || !channels) return null;
    const raw = inflateSync(Buffer.concat(idat));
    const stride = w * channels;
    const out = new Uint8Array(w * h * 3);
    const prev = new Uint8Array(stride);
    const cur = new Uint8Array(stride);
    let p = 0;
    for (let y = 0; y < h; y++) {
      const filter = raw[p++];
      for (let i = 0; i < stride; i++) {
        const x = raw[p + i];
        const a = i >= channels ? cur[i - channels] : 0;
        const b = prev[i];
        const c = i >= channels ? prev[i - channels] : 0;
        let v: number;
        switch (filter) {
          case 0: v = x; break;
          case 1: v = x + a; break;
          case 2: v = x + b; break;
          case 3: v = x + ((a + b) >> 1); break;
          case 4: v = x + paeth(a, b, c); break;
          default: return null;
        }
        cur[i] = v & 0xff;
      }
      p += stride;
      for (let x = 0; x < w; x++) {
        const si = x * channels;
        const di = (y * w + x) * 3;
        out[di] = cur[si];
        out[di + 1] = cur[si + 1];
        out[di + 2] = cur[si + 2];
      }
      prev.set(cur);
    }
    return { w, h, rgb: out };
  } catch {
    return null;
  }
}

/** Tegner et bilde (eller et sjakkbrettmonster som fallback) inn i en boks. */
function drawImageBox(
  c: Canvas,
  img: DecodedImage | null,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const x0 = Math.round(x);
  const y0 = Math.round(y);
  const bw = Math.max(1, Math.round(w));
  const bh = Math.max(1, Math.round(h));
  for (let yy = 0; yy < bh; yy++) {
    for (let xx = 0; xx < bw; xx++) {
      let rgb: [number, number, number];
      if (img) {
        const sx = Math.min(img.w - 1, Math.floor((xx / bw) * img.w));
        const sy = Math.min(img.h - 1, Math.floor((yy / bh) * img.h));
        const si = (sy * img.w + sx) * 3;
        rgb = [img.rgb[si], img.rgb[si + 1], img.rgb[si + 2]];
      } else {
        // Fallback (f.eks. JPEG): rutenett som gjor strekk godt synlig
        const cell = 16;
        const on = (Math.floor(xx / cell) + Math.floor(yy / cell)) % 2 === 0;
        rgb = on ? [150, 170, 200] : [210, 220, 235];
      }
      setPx(c, x0 + xx, y0 + yy, rgb);
    }
  }
}

export interface BeforeAfterInput {
  /** Kort navn brukt i filnavnet */
  name: string;
  /** Kildebildets naturlige piksler */
  sourceWidth: number;
  sourceHeight: number;
  /** Kildebildet som data-URL (PNG dekodes og vises, JPEG faar rutemonster) */
  sourceDataUrl?: string;
  /** Slik bildet faktisk ble tegnet i PDF-en (mm) */
  actualW: number;
  actualH: number;
  /** Ekstra linjer til .txt-filen */
  notes?: string[];
}

/**
 * Skriver et for/etter-overlay: venstre panel viser bildet med korrekt
 * sideforhold (FOR, gronn ramme), hoyre panel viser bildet slik det faktisk
 * ble tegnet i PDF-en (ETTER, rod ramme), med forventet boks lagt oppa som
 * halvgjennomsiktig overlegg.
 */
export function writeBeforeAfterOverlay(input: BeforeAfterInput): { png: string; txt: string } {
  const PANEL = 320;
  const W = PANEL * 2 + 30;
  const H = PANEL + 60;
  const c = createCanvas(W, H);
  const img = input.sourceDataUrl ? decodePngDataUrl(input.sourceDataUrl) : null;

  const expectedRatio = input.sourceWidth / input.sourceHeight;
  const actualRatio = input.actualW / input.actualH;
  const boxMax = PANEL - 40;

  // Venstre: FOR (korrekt sideforhold)
  const eScale = Math.min(boxMax / expectedRatio > boxMax ? boxMax : boxMax, boxMax);
  let eW = eScale;
  let eH = eScale / expectedRatio;
  if (eH > boxMax) {
    eH = boxMax;
    eW = boxMax * expectedRatio;
  }
  const lx = 10 + (PANEL - eW) / 2;
  const ly = 40 + (PANEL - eH) / 2;
  drawImageBox(c, img, lx, ly, eW, eH);
  strokeRect(c, lx, ly, eW, eH, [20, 130, 60], 3);

  // Hoyre: ETTER (faktisk tegnet, samme hoyde-skala)
  let aW = boxMax;
  let aH = boxMax / actualRatio;
  if (aH > boxMax) {
    aH = boxMax;
    aW = boxMax * actualRatio;
  }
  const rx = PANEL + 20 + (PANEL - aW) / 2;
  const ry = 40 + (PANEL - aH) / 2;
  drawImageBox(c, img, rx, ry, aW, aH);
  strokeRect(c, rx, ry, aW, aH, [200, 30, 30], 3);
  // Forventet boks lagt oppa faktisk boks (samme hoyde) for direkte sammenligning
  const oW = aH * expectedRatio;
  fillRect(c, rx + (aW - oW) / 2, ry, oW, aH, [40, 160, 80], 0.22);
  strokeRect(c, rx + (aW - oW) / 2, ry, oW, aH, [20, 130, 60], 2);

  // Fargeforklaring: gronn = FOR/forventet (venstre), rod = ETTER/faktisk (hoyre)
  fillRect(c, 10, 10, 40, 16, [40, 160, 80], 1);
  fillRect(c, PANEL + 20, 10, 40, 16, [200, 30, 30], 1);

  mkdirSync(ARTIFACT_DIR, { recursive: true });
  const slug = artifactSlug(input.name);
  const png = path.join(ARTIFACT_DIR, `${slug}-for-etter.png`);
  writeFileSync(png, encodePng(W, H, c.px));

  const txt = saveTextArtifact(`${slug}-for-etter`, [
    `Bilde: ${input.name}`,
    `Kilde: ${input.sourceWidth}x${input.sourceHeight} px (sideforhold ${expectedRatio.toFixed(4)})`,
    `Tegnet i PDF: ${input.actualW.toFixed(2)} x ${input.actualH.toFixed(2)} mm (sideforhold ${actualRatio.toFixed(4)})`,
    `Avvik i sideforhold: ${(((actualRatio - expectedRatio) / expectedRatio) * 100).toFixed(2)} %`,
    "",
    "Overlay: VENSTRE panel = FOR (korrekt sideforhold, gronn ramme).",
    "         HOYRE panel  = ETTER (slik PDF-en faktisk tegner det, rod ramme),",
    "         med forventet boks lagt oppa som gronn, halvgjennomsiktig flate.",
    ...(img ? [] : ["Merk: JPEG-kilde kan ikke dekodes i Node - rutemonster brukes i stedet."]),
    ...(input.notes ?? []),
  ]);

  return { png, txt };
}
