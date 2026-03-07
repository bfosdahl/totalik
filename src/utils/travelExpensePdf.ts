import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { TravelExpenseReport } from "@/hooks/useTravelExpenseReports";
import { format, parseISO } from "date-fns";

export function generateTravelExpensePDF(report: TravelExpenseReport, userName: string) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text("Reiseregning", 14, 20);
  doc.setFontSize(10);
  doc.text(`Nr: ${report.report_number}`, 14, 28);
  doc.text(`Dato: ${format(new Date(), "dd.MM.yyyy")}`, 14, 34);

  // Employee info
  doc.setFontSize(12);
  doc.text("Ansatt", 14, 46);
  doc.setFontSize(10);
  doc.text(`Navn: ${userName}`, 14, 53);

  // Travel details
  doc.setFontSize(12);
  doc.text("Reisedetaljer", 14, 66);
  
  autoTable(doc, {
    startY: 70,
    head: [["Felt", "Verdi"]],
    body: [
      ["Formål", report.purpose],
      ["Reisemål", report.destination],
      ["Avreisested", report.departure_location || "-"],
      ["Avreisedato", format(parseISO(report.departure_date), "dd.MM.yyyy")],
      ["Returdato", format(parseISO(report.return_date), "dd.MM.yyyy")],
    ],
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185] },
    styles: { fontSize: 9 },
  });

  // Expense breakdown
  const lastY = (doc as any).lastAutoTable?.finalY || 120;

  doc.setFontSize(12);
  doc.text("Kostnadsoppstilling", 14, lastY + 12);

  const rows: string[][] = [];
  rows.push(["Kjøregodtgjørelse", `${report.total_km} km × ${Number(report.mileage_rate).toFixed(2)} kr`, `${Number(report.mileage_amount).toFixed(2)} kr`]);
  
  if (Number(report.passenger_supplement) > 0) {
    rows.push(["Passasjertillegg", "", `${Number(report.passenger_supplement).toFixed(2)} kr`]);
  }
  if (Number(report.diet_amount) > 0) {
    rows.push(["Diett", `${report.diet_days} dager × ${Number(report.diet_rate).toFixed(2)} kr`, `${Number(report.diet_amount).toFixed(2)} kr`]);
  }
  if (Number(report.accommodation_amount) > 0) {
    rows.push(["Overnatting", `${report.accommodation_days} netter × ${Number(report.accommodation_rate).toFixed(2)} kr`, `${Number(report.accommodation_amount).toFixed(2)} kr`]);
  }
  if (Number(report.other_expenses_total) > 0) {
    rows.push(["Andre utlegg", "", `${Number(report.other_expenses_total).toFixed(2)} kr`]);
  }

  autoTable(doc, {
    startY: lastY + 16,
    head: [["Post", "Beregning", "Beløp"]],
    body: rows,
    foot: [["", "Totalt", `${Number(report.total_amount).toFixed(2)} kr`]],
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185] },
    footStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: "bold" },
    styles: { fontSize: 9 },
  });

  const lastY2 = (doc as any).lastAutoTable?.finalY || 200;

  // Status
  if (report.status === "approved" && report.approved_by_name) {
    doc.setFontSize(10);
    doc.text(`Godkjent av: ${report.approved_by_name}`, 14, lastY2 + 12);
    if (report.approved_at) {
      doc.text(`Godkjent dato: ${format(parseISO(report.approved_at), "dd.MM.yyyy HH:mm")}`, 14, lastY2 + 18);
    }
  }

  if (report.notes) {
    const noteY = lastY2 + (report.status === "approved" ? 28 : 12);
    doc.setFontSize(10);
    doc.text("Merknad:", 14, noteY);
    doc.setFontSize(9);
    doc.text(report.notes, 14, noteY + 6, { maxWidth: 180 });
  }

  // Signatures area
  const sigY = Math.min(lastY2 + 50, 260);
  doc.setFontSize(9);
  doc.line(14, sigY, 80, sigY);
  doc.text("Ansattes underskrift", 14, sigY + 5);
  doc.line(110, sigY, 196, sigY);
  doc.text("Leders underskrift", 110, sigY + 5);

  doc.save(`Reiseregning_${report.report_number}.pdf`);
}
