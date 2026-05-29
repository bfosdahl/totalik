import type { jsPDF } from "jspdf";

/**
 * Registers Inter as the PDF font family on a jsPDF document.
 * Lazy-loads ~1.2 MB of TTFs only when called (no impact on app bundle).
 *
 * Fixes the kerning/spacing bug in jsPDF's built-in Helvetica/Times bold,
 * where letter pairs like "ll", "tt", "ff" render with incorrect widths.
 *
 * Usage:
 *   const doc = new jsPDF();
 *   await registerPdfFont(doc);
 *   doc.setFont("Inter", "bold");
 *
 * Font family is "Inter". Styles: "normal", "bold", "italic".
 */
let cachedFonts: { regular: string; bold: string; italic: string } | null = null;

async function loadFontsBase64() {
  if (cachedFonts) return cachedFonts;
  const [regularMod, boldMod, italicMod] = await Promise.all([
    import("@/assets/fonts/Inter-Regular.ttf?url"),
    import("@/assets/fonts/Inter-Bold.ttf?url"),
    import("@/assets/fonts/Inter-Italic.ttf?url"),
  ]);
  const [reg, bold, ital] = await Promise.all([
    fetch(regularMod.default).then(r => r.arrayBuffer()),
    fetch(boldMod.default).then(r => r.arrayBuffer()),
    fetch(italicMod.default).then(r => r.arrayBuffer()),
  ]);
  const toBase64 = (buf: ArrayBuffer) => {
    const bytes = new Uint8Array(buf);
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  };
  cachedFonts = { regular: toBase64(reg), bold: toBase64(bold), italic: toBase64(ital) };
  return cachedFonts;
}

export async function registerPdfFont(doc: jsPDF): Promise<void> {
  try {
    const { regular, bold, italic } = await loadFontsBase64();
    doc.addFileToVFS("Inter-Regular.ttf", regular);
    doc.addFont("Inter-Regular.ttf", "Inter", "normal");
    doc.addFileToVFS("Inter-Bold.ttf", bold);
    doc.addFont("Inter-Bold.ttf", "Inter", "bold");
    doc.addFileToVFS("Inter-Italic.ttf", italic);
    doc.addFont("Inter-Italic.ttf", "Inter", "italic");
    doc.setFont("Inter", "normal");
  } catch (err) {
    console.warn("[pdfFont] Could not load Inter, falling back to helvetica", err);
  }
}

export const PDF_FONT = "Inter";
