import jsPDF from "jspdf";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import type { TraceabilityRecord } from "@/hooks/useIkMatTraceability";

/**
 * Genererer en A6 (105x148 mm) merkelapp som kan skrives ut på etikettskriver
 * (Brother, Dymo eller vanlig A4 og klippes). Inneholder all info Mattilsynet
 * krever for sporbarhet ved oppbevaring på kjøkken.
 */
export function generateIkMatLabelPdf(record: TraceabilityRecord, companyName?: string) {
  const doc = new jsPDF({ unit: "mm", format: [105, 148], orientation: "portrait" });
  const W = 105;
  let y = 8;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(companyName || "Internkontroll mat", W / 2, y, { align: "center" });
  y += 5;
  doc.setDrawColor(0);
  doc.setLineWidth(0.4);
  doc.line(5, y, W - 5, y);
  y += 5;

  // Product name (big)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  const productLines = doc.splitTextToSize(record.product_name, W - 10);
  doc.text(productLines, 5, y);
  y += productLines.length * 6 + 2;

  // Internal production badge
  if (record.is_internal_production) {
    doc.setFillColor(230, 240, 255);
    doc.rect(5, y, W - 10, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(20, 60, 130);
    doc.text("EGENPRODUSERT", W / 2, y + 4, { align: "center" });
    doc.setTextColor(0, 0, 0);
    y += 8;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const row = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, 5, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, 38, y);
    y += 5;
  };

  if (record.is_internal_production && record.produced_by) {
    row("Laget av:", record.produced_by);
  }
  row("Leverandør:", record.supplier_name || "—");
  if (record.batch_number) row("Batch/Lot:", record.batch_number);
  if (record.production_date) {
    row("Produsert:", format(new Date(record.production_date), "dd.MM.yyyy", { locale: nb }));
  }
  row("Mottatt:", format(new Date(record.receipt_date), "dd.MM.yyyy", { locale: nb }));

  // Expiry — emphasized
  if (record.expiry_date) {
    y += 2;
    const expiryLabel = record.expiry_type === "use_by" ? "SISTE FORBRUKSDAG" : "BEST FØR";
    doc.setFillColor(record.expiry_type === "use_by" ? 255 : 250, record.expiry_type === "use_by" ? 230 : 245, 230);
    doc.rect(5, y, W - 10, 12, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(expiryLabel, 7, y + 4);
    doc.setFontSize(14);
    doc.text(format(new Date(record.expiry_date), "dd.MM.yyyy", { locale: nb }), 7, y + 10);
    y += 14;
  }

  // Allergens
  if (record.allergens && record.allergens.length > 0) {
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Allergener:", 5, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const allergenText = record.allergens.join(", ");
    const allergenLines = doc.splitTextToSize(allergenText, W - 10);
    doc.text(allergenLines, 5, y);
    y += allergenLines.length * 4;
  }

  // Footer with batch number
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Skrevet ut ${format(new Date(), "dd.MM.yyyy HH:mm", { locale: nb })}`,
    5,
    143
  );

  const filename = `Merkelapp_${record.product_name.replace(/[^a-zA-Z0-9æøåÆØÅ]/g, "_")}.pdf`;
  doc.save(filename);
}
