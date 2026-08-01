import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

/**
 * Enkel PNG-encoder + diff-bildegenerator for dagsrapport-PDF-testene.
 * Brukes KUN når en test feiler, slik at CI kan laste opp et forskjellsbilde
 * som viser forventet vs faktisk bildeboks (sideforhold / strekk).
 */

export const DIFF_DIR = path.resolve(process.cwd(), "test-artifacts/pdf-diff");

function crc32(buf: Buffer): number {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "latin1");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

export function encodePng(width: number, height: number, rgb: Uint8Array): Buffer {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 3 + 1)] = 0; // filter: none
    Buffer.from(rgb.subarray(y * width * 3, (y + 1) * width * 3)).copy(
      raw,
      y * (width * 3 + 1) + 1,
    );
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolor
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

export interface Canvas {
  w: number;
  h: number;
  px: Uint8Array;
}

export function createCanvas(w: number, h: number): Canvas {
  const px = new Uint8Array(w * h * 3).fill(255);
  return { w, h, px };
}

export function setPx(c: Canvas, x: number, y: number, rgb: [number, number, number]) {
  if (x < 0 || y < 0 || x >= c.w || y >= c.h) return;
  const i = (y * c.w + x) * 3;
  c.px[i] = rgb[0];
  c.px[i + 1] = rgb[1];
  c.px[i + 2] = rgb[2];
}

export function fillRect(
  c: Canvas,
  x: number,
  y: number,
  w: number,
  h: number,
  rgb: [number, number, number],
  alpha = 1,
) {
  for (let yy = Math.round(y); yy < Math.round(y + h); yy++) {
    for (let xx = Math.round(x); xx < Math.round(x + w); xx++) {
      if (xx < 0 || yy < 0 || xx >= c.w || yy >= c.h) continue;
      const i = (yy * c.w + xx) * 3;
      c.px[i] = Math.round(c.px[i] * (1 - alpha) + rgb[0] * alpha);
      c.px[i + 1] = Math.round(c.px[i + 1] * (1 - alpha) + rgb[1] * alpha);
      c.px[i + 2] = Math.round(c.px[i + 2] * (1 - alpha) + rgb[2] * alpha);
    }
  }
}

export function strokeRect(
  c: Canvas,
  x: number,
  y: number,
  w: number,
  h: number,
  rgb: [number, number, number],
  thickness = 3,
) {
  for (let t = 0; t < thickness; t++) {
    for (let xx = Math.round(x); xx <= Math.round(x + w); xx++) {
      setPx(c, xx, Math.round(y) + t, rgb);
      setPx(c, xx, Math.round(y + h) - t, rgb);
    }
    for (let yy = Math.round(y); yy <= Math.round(y + h); yy++) {
      setPx(c, Math.round(x) + t, yy, rgb);
      setPx(c, Math.round(x + w) - t, yy, rgb);
    }
  }
}

export interface DiffInput {
  /** Kort id brukt i filnavnet */
  name: string;
  /** Forventet sideforhold (bredde/høyde) fra kildebildet */
  expectedRatio: number;
  /** Faktisk tegnet bredde og høyde i PDF-en (mm) */
  actualW: number;
  actualH: number;
}

/**
 * Skriver et forskjellsbilde som viser forventet boks (grønn) mot faktisk
 * tegnet boks (rød). Returnerer filstien.
 */
export function writeAspectDiffImage(input: DiffInput): string {
  const W = 640;
  const H = 420;
  const c = createCanvas(W, H);

  // Bakgrunnsraster for visuell referanse
  for (let y = 0; y < H; y += 20)
    for (let x = 0; x < W; x++) setPx(c, x, y, [235, 235, 235]);
  for (let x = 0; x < W; x += 20)
    for (let y = 0; y < H; y++) setPx(c, x, y, [235, 235, 235]);

  const maxW = W - 80;
  const maxH = H - 80;

  // Faktisk boks skalert til å passe
  const scale = Math.min(maxW / input.actualW, maxH / input.actualH);
  const aW = input.actualW * scale;
  const aH = input.actualH * scale;
  // Forventet boks: samme høyde, bredde utledet av korrekt sideforhold
  const eH = aH;
  const eW = eH * input.expectedRatio;

  const cx = W / 2;
  const cy = H / 2;

  fillRect(c, cx - aW / 2, cy - aH / 2, aW, aH, [220, 60, 60], 0.25);
  fillRect(c, cx - eW / 2, cy - eH / 2, eW, eH, [40, 160, 80], 0.25);
  strokeRect(c, cx - eW / 2, cy - eH / 2, eW, eH, [20, 130, 60], 3);
  strokeRect(c, cx - aW / 2, cy - aH / 2, aW, aH, [200, 30, 30], 3);

  // Fargeforklaring øverst til venstre
  fillRect(c, 10, 10, 24, 12, [40, 160, 80], 1); // grønn = forventet
  fillRect(c, 10, 28, 24, 12, [200, 30, 30], 1); // rød = faktisk

  mkdirSync(DIFF_DIR, { recursive: true });
  const file = path.join(DIFF_DIR, `${input.name.replace(/[^\w.-]+/g, "_")}.png`);
  writeFileSync(file, encodePng(W, H, c.px));

  const meta = path.join(DIFF_DIR, `${input.name.replace(/[^\w.-]+/g, "_")}.txt`);
  writeFileSync(
    meta,
    [
      `Bilde: ${input.name}`,
      `Forventet sideforhold: ${input.expectedRatio.toFixed(4)}`,
      `Faktisk sideforhold:   ${(input.actualW / input.actualH).toFixed(4)}`,
      `Tegnet i PDF: ${input.actualW.toFixed(2)} x ${input.actualH.toFixed(2)} mm`,
      `Gronn ramme = forventet, rod ramme = faktisk`,
      "",
    ].join("\n"),
  );
  return file;
}
