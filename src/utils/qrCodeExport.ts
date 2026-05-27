/**
 * Shared utilities for exporting QR codes (download as PNG, print in new window).
 * Used by all IK MAT QR dialogs (Equipment, Renhold, Varemottak, DailyRound).
 *
 * Handles:
 * - UTF-8 safe SVG-to-base64 conversion (avoids deprecated unescape/btoa pattern)
 * - Popup-blocker detection for print windows
 * - HTML escaping to prevent injection in print titles
 */

import { toast } from "sonner";

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** UTF-8 safe SVG -> base64 data URL conversion. */
const svgToDataUrl = (svgData: string): string => {
  const utf8Safe = encodeURIComponent(svgData).replace(
    /%([0-9A-F]{2})/g,
    (_, p1) => String.fromCharCode(parseInt(p1, 16))
  );
  return "data:image/svg+xml;base64," + btoa(utf8Safe);
};

const sanitizeFilename = (name: string): string =>
  name.replace(/[^a-zA-Z0-9æøåÆØÅ_-]/g, "_").replace(/_+/g, "_");

export interface QrDownloadOptions {
  svg: SVGElement;
  filename: string;
  /** Big title text rendered below the QR (e.g. "📦 Varemottak"). */
  title: string;
  /** Optional subtitle / instruction line. */
  subtitle?: string;
  /** Optional third line (e.g. equipment location). */
  meta?: string;
  /** Square QR render size in px (default 400). */
  size?: number;
}

/**
 * Render a QR SVG to canvas with caption(s) and trigger PNG download.
 */
export const downloadQrAsPng = ({
  svg,
  filename,
  title,
  subtitle,
  meta,
  size = 400,
}: QrDownloadOptions): void => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    toast.error("Klarte ikke å generere QR-bilde");
    return;
  }

  const extraLines = (subtitle ? 1 : 0) + (meta ? 1 : 0);
  const captionHeight = 40 + extraLines * 25;
  canvas.width = size;
  canvas.height = size + captionHeight;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const svgData = new XMLSerializer().serializeToString(svg);
  const img = new Image();

  img.onload = () => {
    ctx.drawImage(img, 0, 0, size, size);

    ctx.textAlign = "center";
    let textY = size + 30;

    ctx.fillStyle = "#000000";
    ctx.font = "bold 22px Arial";
    ctx.fillText(title, size / 2, textY);

    if (subtitle) {
      textY += 25;
      ctx.font = "14px Arial";
      ctx.fillStyle = "#666666";
      ctx.fillText(subtitle, size / 2, textY);
    }

    if (meta) {
      textY += 22;
      ctx.font = "13px Arial";
      ctx.fillStyle = "#666666";
      ctx.fillText(meta, size / 2, textY);
    }

    const link = document.createElement("a");
    link.download = `${sanitizeFilename(filename)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  img.onerror = () => {
    toast.error("Klarte ikke å laste QR-bilde for nedlasting");
  };

  img.src = svgToDataUrl(svgData);
};

export interface QrPrintOptions {
  svg: SVGElement;
  title: string;
  subtitle?: string;
}

/**
 * Open a print window with the QR code. Detects popup-blockers and shows a
 * user-friendly toast instead of failing silently.
 */
export const printQr = ({ svg, title, subtitle }: QrPrintOptions): void => {
  const svgData = new XMLSerializer().serializeToString(svg);
  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    toast.error("Popup blokkert", {
      description:
        "Tillat popup-vinduer for denne siden i nettleseren for å skrive ut QR-koden.",
    });
    return;
  }

  const safeTitle = escapeHtml(title);
  const safeSubtitle = subtitle ? escapeHtml(subtitle) : "";

  printWindow.document.write(`
    <html>
      <head><title>QR-kode ${safeTitle}</title></head>
      <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:Arial,sans-serif;">
        <div style="text-align:center;">
          ${svgData}
          <h2 style="margin-top:20px;">${safeTitle}</h2>
          ${safeSubtitle ? `<p style="color:#666;">${safeSubtitle}</p>` : ""}
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
};
