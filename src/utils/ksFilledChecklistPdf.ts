import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface ChecklistItem {
  text: string;
  value: boolean | string | null;
  comment?: string;
  photos?: string[];
}

interface FilledChecklist {
  id: string;
  title: string;
  template_name: string;
  responsible_user_name: string | null;
  status: string;
  progress_percent: number;
  completed_at: string | null;
  created_at: string;
  checklist_items: ChecklistItem[];
}

interface ProjectInfo {
  project_name: string;
  project_number: string | null;
}

export function generateFilledChecklistPdf(
  checklist: FilledChecklist,
  project: ProjectInfo | null
) {
  const doc = new jsPDF();
  let y = 20;

  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("EGENKONTROLL", 105, y, { align: "center" });
  y += 8;

  doc.setFontSize(12);
  doc.text(checklist.title, 105, y, { align: "center" });
  y += 7;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Mal: ${checklist.template_name}`, 105, y, { align: "center" });
  doc.setTextColor(0);
  y += 12;

  // Info box
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(15, y, 180, project ? 30 : 22, 3, 3, "F");
  doc.setFontSize(9);
  const infoY = y + 7;

  if (project) {
    doc.setFont("helvetica", "bold");
    doc.text("Prosjekt:", 20, infoY);
    doc.setFont("helvetica", "normal");
    doc.text(`${project.project_number ? project.project_number + " - " : ""}${project.project_name}`, 48, infoY);
  }

  const row2Y = project ? infoY + 8 : infoY;
  doc.text(`Opprettet: ${format(new Date(checklist.created_at), "dd.MM.yyyy", { locale: nb })}`, 20, row2Y);
  if (checklist.completed_at) {
    doc.text(`Fullført: ${format(new Date(checklist.completed_at), "dd.MM.yyyy HH:mm", { locale: nb })}`, 100, row2Y);
  }

  const row3Y = row2Y + 8;
  if (checklist.responsible_user_name) {
    doc.text(`Ansvarlig: ${checklist.responsible_user_name}`, 20, row3Y);
  }
  const statusLabel = checklist.status === "completed" ? "Fullført" : checklist.status === "in_progress" ? "Under arbeid" : checklist.status;
  doc.text(`Status: ${statusLabel} (${checklist.progress_percent}%)`, 100, row3Y);

  y += (project ? 38 : 30);

  // Table
  const items = (checklist.checklist_items || []) as ChecklistItem[];
  const tableData = items.map((item, i) => {
    let statusText = "-";
    if (item.value === true || item.value === "yes") statusText = "✓ OK";
    else if (item.value === false || item.value === "no") statusText = "✗ Avvik";
    return [`${i + 1}. ${item.text}`, statusText, item.comment || ""];
  });

  autoTable(doc, {
    startY: y,
    head: [["Kontrollpunkt", "Status", "Kommentar"]],
    body: tableData,
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 25, halign: "center" },
      2: { cellWidth: 55 },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // Summary
  if (y > 250) { doc.addPage(); y = 20; }

  doc.setFillColor(245, 247, 250);
  doc.roundedRect(15, y, 180, 28, 3, 3, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("OPPSUMMERING", 20, y + 8);

  const okCount = items.filter(i => i.value === true || i.value === "yes").length;
  const avvikCount = items.filter(i => i.value === false || i.value === "no").length;
  const pending = items.length - okCount - avvikCount;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Totalt: ${items.length}`, 20, y + 18);
  doc.text(`✓ OK: ${okCount}`, 65, y + 18);
  doc.text(`✗ Avvik: ${avvikCount}`, 105, y + 18);
  doc.text(`○ Ikke utfylt: ${pending}`, 145, y + 18);

  // Footer on all pages
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`Side ${i} av ${pages}`, 105, 290, { align: "center" });
    doc.text(`Generert: ${format(new Date(), "dd.MM.yyyy HH:mm", { locale: nb })}`, 195, 290, { align: "right" });
    doc.setTextColor(0);
  }

  const projectPart = project?.project_number ? `_${project.project_number}` : "";
  const fileName = `Egenkontroll_${checklist.template_name.replace(/\s+/g, "_")}${projectPart}_${format(new Date(), "yyyyMMdd")}.pdf`;
  doc.save(fileName);
}
