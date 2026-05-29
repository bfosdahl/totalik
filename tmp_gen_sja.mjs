import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "fs";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

const doc = new jsPDF();
// register Inter
const reg = fs.readFileSync("src/assets/fonts/Inter-Regular.ttf").toString("base64");
const bold = fs.readFileSync("src/assets/fonts/Inter-Bold.ttf").toString("base64");
const ital = fs.readFileSync("src/assets/fonts/Inter-Italic.ttf").toString("base64");
doc.addFileToVFS("Inter-Regular.ttf", reg); doc.addFont("Inter-Regular.ttf", "Inter", "normal");
doc.addFileToVFS("Inter-Bold.ttf", bold); doc.addFont("Inter-Bold.ttf", "Inter", "bold");
doc.addFileToVFS("Inter-Italic.ttf", ital); doc.addFont("Inter-Italic.ttf", "Inter", "italic");
doc.setFont("Inter", "normal");

const sja = {
  sja_number: "SJA-2026-0042",
  title: "Montering av takstein på Nordhavn 12",
  location: "Nordhavn 12, 0150 Oslo – tak sør/vest",
  responsible_name: "Eirik A. Sivertsen",
  planned_date: "2026-06-03",
  participants: ["Eirik A. Sivertsen", "Ola Hansen", "Petter Lien", "Kjetil Bø"],
  status: "completed",
  completed_at: "2026-05-29T09:12:00Z",
  completed_by_name: "Eirik A. Sivertsen",
  signature_data: null,
};
const workDescription = "Demontering av eksisterende takstein, kontroll og utbedring av undertak/lekter, samt legging av ny betongtakstein. Arbeidet utføres fra stillas på sør- og vestside. Det benyttes byggekran ved heising av paller med stein opp på taket.";
const risks = [
  { description: "Fall fra tak/stillas under arbeid", probability: "Sannsynlig", consequence: "Alvorlig" },
  { description: "Fallende gjenstander – stein, verktøy eller materialer fra tak", probability: "Mulig", consequence: "Moderat" },
  { description: "Klem-/kuttskader ved håndtering av takstein og lekter", probability: "Sannsynlig", consequence: "Liten" },
  { description: "Belastningsskader ved tungt og repetitivt løft", probability: "Mulig", consequence: "Moderat" },
];
const measures = [
  { risk: "Fall fra tak/stillas under arbeid", measure: "Bruk av godkjent fallsikringssele med to liner og forankring i godkjent festepunkt på mønet.", responsible: "Eirik" },
  { risk: "Fall fra tak/stillas under arbeid", measure: "Daglig kontroll av stillas før oppstart, kontrollskjema fylles ut og signeres.", responsible: "Ola" },
  { risk: "Fallende gjenstander – stein, verktøy eller materialer fra tak", measure: "Avsperring av sone under arbeidsområdet med varselbånd og skilting.", responsible: "Petter" },
  { risk: "Fallende gjenstander – stein, verktøy eller materialer fra tak", measure: "Verktøy festes med snor/karabin, og stein lagres innenfor mønekant.", responsible: "Petter" },
  { risk: "Klem-/kuttskader ved håndtering av takstein og lekter", measure: "Bruk av arbeidshansker klasse 3 og vernebriller ved kapping.", responsible: "Alle" },
  { risk: "Belastningsskader ved tungt og repetitivt løft", measure: "Heis stein i paller med kran helt opp til arbeidssone, ingen manuell bæring opp stige.", responsible: "Kjetil" },
];
const notes = "Værmelding sjekkes hver morgen kl 06:30. Ved vindkast over 12 m/s eller nedbør stoppes arbeidet og taket sikres.";

const pageWidth = doc.internal.pageSize.getWidth();
const pageHeight = doc.internal.pageSize.getHeight();
const margin = 18;
const contentWidth = pageWidth - margin * 2;
let y = margin;

const ensureSpace = (n) => { if (y + n > pageHeight - margin) { doc.addPage(); y = margin; } };
const writeParagraph = (text, opts = {}) => {
  const { size = 10, bold = false, color = [40,40,40], gap = 4 } = opts;
  doc.setFontSize(size);
  doc.setFont("Inter", bold ? "bold" : "normal");
  doc.setTextColor(...color);
  const lines = doc.splitTextToSize(text, contentWidth);
  ensureSpace(lines.length * (size * 0.45) + gap);
  doc.text(lines, margin, y);
  y += lines.length * (size * 0.45) + gap;
};

// Header
doc.setFillColor(30, 58, 95);
doc.rect(0, 0, pageWidth, 26, "F");
doc.setTextColor(255,255,255);
doc.setFontSize(16); doc.setFont("Inter","bold");
doc.text("SIKKER JOBB ANALYSE (SJA)", margin, 12);
doc.setFontSize(10); doc.setFont("Inter","normal");
doc.text(sja.sja_number, pageWidth - margin, 12, { align: "right" });
doc.setFontSize(11); doc.setFont("Inter","bold");
doc.text(sja.title, margin, 21);
y = 34;

const metaRows = [
  ["Prosjekt", sja.title],
  ["Lokasjon", sja.location],
  ["Ansvarlig", sja.responsible_name],
  ["Planlagt dato", format(new Date(sja.planned_date), "d. MMMM yyyy", { locale: nb })],
  ["Deltakere", sja.participants.join(", ")],
  ["Status", "Fullført"],
];
autoTable(doc, {
  startY: y, body: metaRows, theme: "grid",
  styles: { font: "Inter", fontSize: 9, cellPadding: 2.5, textColor: [40,40,40] },
  columnStyles: { 0: { fontStyle: "bold", fillColor: [240,244,248], cellWidth: 40 }, 1: { cellWidth: contentWidth - 40 } },
  margin: { left: margin, right: margin },
});
y = doc.lastAutoTable.finalY + 8;

writeParagraph("Arbeidsbeskrivelse", { size: 13, bold: true, color: [30,58,95], gap: 3 });
doc.setDrawColor(30,58,95); doc.setLineWidth(0.4); doc.line(margin, y-1, margin+30, y-1); y += 2;
writeParagraph(workDescription, { size: 10, gap: 6 });

writeParagraph("Risiko og tiltak", { size: 13, bold: true, color: [30,58,95], gap: 3 });
doc.setDrawColor(30,58,95); doc.setLineWidth(0.4); doc.line(margin, y-1, margin+30, y-1); y += 3;

risks.forEach((r,i) => {
  const rel = measures.filter(m => m.risk === r.description);
  ensureSpace(20);
  writeParagraph(`${i+1}. ${r.description.split(/[.!?]/)[0].slice(0,80)}`, { size:11, bold:true, color:[30,58,95], gap:2 });
  doc.setFontSize(9); doc.setFont("Inter","italic"); doc.setTextColor(110,110,110);
  doc.text(`Sannsynlighet: ${r.probability}   |   Konsekvens: ${r.consequence}`, margin, y); y += 5;
  doc.setFont("Inter","bold"); doc.setFontSize(10); doc.setTextColor(40,40,40);
  ensureSpace(6); doc.text("Risiko:", margin, y); y += 5;
  writeParagraph(r.description, { size:10, gap:4 });
  doc.setFont("Inter","bold"); doc.setFontSize(10); doc.setTextColor(40,40,40);
  ensureSpace(6); doc.text("Tiltak:", margin, y); y += 5;
  rel.forEach(m => {
    doc.setFont("Inter","normal"); doc.setFontSize(10); doc.setTextColor(40,40,40);
    const lines = doc.splitTextToSize(m.measure, contentWidth - 6);
    ensureSpace(lines.length*5 + 2);
    doc.text("•", margin, y);
    doc.text(lines, margin+5, y); y += lines.length*5;
    if (m.responsible) {
      doc.setFontSize(8); doc.setTextColor(110,110,110);
      doc.text(`Ansvarlig: ${m.responsible}`, margin+5, y+1); y += 4;
    }
    y += 2;
  });
  y += 3;
  doc.setDrawColor(220,226,232); doc.setLineWidth(0.2);
  ensureSpace(2); doc.line(margin, y, pageWidth-margin, y); y += 5;
});

y += 2;
writeParagraph("Merknader", { size:13, bold:true, color:[30,58,95], gap:3 });
doc.setDrawColor(30,58,95); doc.setLineWidth(0.4); doc.line(margin, y-1, margin+30, y-1); y += 2;
writeParagraph(notes, { size:10, gap:6 });

ensureSpace(45); y += 4;
writeParagraph("Signatur", { size:13, bold:true, color:[30,58,95], gap:3 });
doc.setDrawColor(30,58,95); doc.setLineWidth(0.4); doc.line(margin, y-1, margin+30, y-1); y += 3;
doc.setDrawColor(180,180,180); doc.rect(margin, y, 60, 25); y += 28;
doc.setFontSize(9); doc.setFont("Inter","normal"); doc.setTextColor(80,80,80);
doc.text(`Signert av ${sja.completed_by_name} den ${format(new Date(sja.completed_at), "d. MMMM yyyy", { locale: nb })}`, margin, y);

const pc = doc.getNumberOfPages();
for (let i=1; i<=pc; i++) {
  doc.setPage(i);
  doc.setFontSize(8); doc.setTextColor(140,140,140); doc.setFont("Inter","normal");
  doc.text(`${sja.sja_number} – ${sja.title}`, margin, pageHeight-8);
  doc.text(`Side ${i} av ${pc}`, pageWidth-margin, pageHeight-8, { align:"right" });
}

fs.writeFileSync("/mnt/documents/SJA_eksempel.pdf", Buffer.from(doc.output("arraybuffer")));
console.log("OK", pc, "pages");
