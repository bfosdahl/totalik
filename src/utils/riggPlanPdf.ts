import jsPDF from "jspdf";
import type { RiggCanvasData } from "@/hooks/useKsRiggPlan";
import { getSymbol } from "@/components/ks2/riggplan/riggSymbols";
import { supabase } from "@/integrations/supabase/client";

export async function exportRiggPlanPdf(
  planName: string,
  projectName: string,
  projectNumber: string,
  canvas: RiggCanvasData
) {
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Header
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text("Riggplan", 15, 15);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(`${projectNumber} - ${projectName}`, 15, 22);
  pdf.text(planName, 15, 28);
  pdf.text(`Generert: ${new Date().toLocaleDateString("nb-NO")}`, pageWidth - 15, 15, { align: "right" });

  // Canvas area
  const marginX = 15;
  const topY = 35;
  const availW = pageWidth - marginX * 2;
  const availH = pageHeight - topY - 25;
  const scale = Math.min(availW / canvas.width, availH / canvas.height);
  const drawW = canvas.width * scale;
  const drawH = canvas.height * scale;
  const offX = marginX + (availW - drawW) / 2;
  const offY = topY;

  // Background area frame
  pdf.setDrawColor(120);
  pdf.setLineWidth(0.4);
  pdf.rect(offX, offY, drawW, drawH);

  // Background image (if any) — preserve aspect ratio (object-contain), centered
  if (canvas.backgroundImagePath) {
    try {
      const { data } = await supabase.storage
        .from("ks-module2-files")
        .createSignedUrl(canvas.backgroundImagePath, 3600);
      if (data?.signedUrl) {
        const img = await loadImage(data.signedUrl);
        const dataUrl = imageToDataUrl(img);
        const opacity = canvas.backgroundImageOpacity ?? 0.7;
        // Fit (contain) inside the canvas area
        const ratio = Math.min(drawW / img.naturalWidth, drawH / img.naturalHeight);
        const imgW = img.naturalWidth * ratio;
        const imgH = img.naturalHeight * ratio;
        const imgX = offX + (drawW - imgW) / 2;
        const imgY = offY + (drawH - imgH) / 2;
        try {
          // @ts-ignore – GState supported by jspdf
          const gs = new (pdf as any).GState({ opacity });
          (pdf as any).setGState(gs);
        } catch { /* opacity not supported – continue */ }
        const fmt = dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
        pdf.addImage(dataUrl, fmt, imgX, imgY, imgW, imgH, undefined, "FAST");
        try {
          // @ts-ignore reset opacity
          const gs = new (pdf as any).GState({ opacity: 1 });
          (pdf as any).setGState(gs);
        } catch { /* noop */ }
      }
    } catch (e) {
      console.warn("Could not embed background image in PDF", e);
    }
  }

  pdf.setFontSize(8);
  pdf.setTextColor(80);
  if (canvas.backgroundLabel) {
    pdf.text(canvas.backgroundLabel, offX + 2, offY + 4);
  }

  // Objects
  for (const obj of canvas.objects) {
    const x = offX + obj.x * scale;
    const y = offY + obj.y * scale;
    const w = obj.width * scale;
    const h = obj.height * scale;
    const sym = getSymbol(obj.type);
    const color = obj.color || sym?.color || "#E5E7EB";
    const rgb = hexToRgb(color);
    pdf.setFillColor(rgb.r, rgb.g, rgb.b);
    pdf.setDrawColor(60);
    pdf.setLineWidth(0.3);
    pdf.rect(x, y, w, h, "FD");
    pdf.setTextColor(20);
    pdf.setFontSize(8);
    const label = obj.label || sym?.label || obj.type;
    pdf.text(label, x + w / 2, y + h / 2 + 1, { align: "center", baseline: "middle" });
  }

  // Legend
  pdf.setTextColor(0);
  pdf.setFontSize(8);
  const legendY = offY + drawH + 6;
  pdf.text(
    `Skala: 1 px ≈ ${canvas.scaleMetersPerPixel} m   |   Område: ${(canvas.width * canvas.scaleMetersPerPixel).toFixed(0)} m × ${(canvas.height * canvas.scaleMetersPerPixel).toFixed(0)} m`,
    marginX,
    legendY
  );

  pdf.save(`Riggplan_${projectNumber}_${planName.replace(/\s+/g, "_")}.pdf`);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
}

function imageToDataUrl(img: HTMLImageElement): string {
  const canvasEl = document.createElement("canvas");
  canvasEl.width = img.naturalWidth;
  canvasEl.height = img.naturalHeight;
  const ctx = canvasEl.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(img, 0, 0);
  // Prefer JPEG for smaller file size
  try {
    return canvasEl.toDataURL("image/jpeg", 0.85);
  } catch {
    return canvasEl.toDataURL("image/png");
  }
}
