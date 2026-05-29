import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "fs";

const doc = new jsPDF();
// Register Inter fonts (same as registerPdfFont but synchronous from disk)
const regular = fs.readFileSync("src/assets/fonts/Inter-Regular.ttf").toString("base64");
const bold = fs.readFileSync("src/assets/fonts/Inter-Bold.ttf").toString("base64");
const italic = fs.readFileSync("src/assets/fonts/Inter-Italic.ttf").toString("base64");
doc.addFileToVFS("Inter-Regular.ttf", regular);
doc.addFont("Inter-Regular.ttf", "Inter", "normal");
doc.addFileToVFS("Inter-Bold.ttf", bold);
doc.addFont("Inter-Bold.ttf", "Inter", "bold");
doc.addFileToVFS("Inter-Italic.ttf", italic);
doc.addFont("Inter-Italic.ttf", "Inter", "italic");

const sja = {
  sja_number: "SJA-2026-0042",
  title: "Demontering av eldre stillas ved Fjordveien 14",
  location: "Fjordveien 14, 5003 Bergen — vestfasade",
  responsible_name: "Eirik A. Sivertsen",
  participants: ["Eirik A. Sivertsen", "Lars Olsen", "Marius Hansen", "Per Kristian Eide"],
  completed_by_name: "Eirik A. Sivertsen",
};
const workDescription = "Demontering av eksisterende fasadestillas i 3 etasjer langs vestveggen. Stillaset er omtrent 12 meter høyt og 18 meter bredt. Arbeidet utføres av 4 personer over 2 dager. Materialer fjernes etappevis og senkes ned med tau og talje. Området under sperres av med varselbånd og skiltvakter. Arbeidet utføres i tørt vær — kanselleres ved vind over 10 m/s eller nedbør.";
const risks = [
  { description: "Fall fra høyde under demontering av øvre stillasplan. Arbeiderne må operere helt ute på kanten når rekkverk fjernes som siste del.", probability: "Middels", consequence: "Alvorlig" },
  { description: "Fallende gjenstander (stillaskomponenter, verktøy) som kan treffe personer eller utstyr på bakkenivå under nedsenking av materialer.", probability: "Høy", consequence: "Alvorlig" },
  { description: "Klemfare og kuttskader ved håndtering av stålkomponenter, koblinger og spennbånd.", probability: "Middels", consequence: "Mindre alvorlig" },
];
const measures = [
  { risk: risks[0].description, measure: "Bruk av godkjent fallsikringssele med dobbel line festet til forankringspunkt før rekkverk demonteres.", responsible: "Lars Olsen" },
  { risk: risks[0].description, measure: "Sjekkliste for fallsikringsutstyr gjennomgås hver morgen før oppstart.", responsible: "Eirik A. Sivertsen" },
  { risk: risks[0].description, measure: "Arbeid stoppes umiddelbart ved vind over 10 m/s.", responsible: "Eirik A. Sivertsen" },
  { risk: risks[1].description, measure: "Avsperring av sone under arbeidsområdet med varselbånd minst 3 meter ut fra bygget.", responsible: "Marius Hansen" },
  { risk: risks[1].description, measure: "Skiltvakt posisjoneres ved publikumsside i hele arbeidsperioden.", responsible: "Per Kristian Eide" },
  { risk: risks[1].description, measure: "Bruk av hjelm og vernesko av klasse S3 obligatorisk for alle på området.", responsible: "Alle" },
  { risk: risks[2].description, measure: "Bruk av kraftige arbeidshansker (kuttklasse 5) ved all manuell håndtering.", responsible: "Alle" },
  { risk: risks[2].description, measure: "To-personers løft for komponenter over 25 kg.", responsible: "Lars Olsen" },
];
const notes = "Nabovarsel sendt 14 dager før oppstart. Politiet er varslet siden vi delvis blokkerer fortau. Førstehjelpsskrin og brannslukker plasseres ved stillasets fot. Mobiltelefon med dekning verifisert — nærmeste sykehus er Haukeland (8 minutter).";

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

doc.setFillColor(30,58,95); doc.rect(0,0,pageWidth,26,"F");
doc.setTextColor(255,255,255); doc.setFontSize(16); doc.setFont("Inter","bold");
doc.text("SIKKER JOBB ANALYSE (SJA)", margin, 12);
doc.setFontSize(10); doc.setFont("Inter","normal");
doc.text(sja.sja_number, pageWidth - margin, 12, { align: "right" });
doc.setFontSize(11); doc.setFont("Inter","bold");
doc.text(sja.title, margin, 21);
y = 34;

autoTable(doc, {
  startY: y,
  body: [
    ["Prosjekt", sja.title],
    ["Lokasjon", sja.location],
    ["Ansvarlig", sja.responsible_name],
    ["Planlagt dato", "4. juni 2026"],
    ["Deltakere", sja.participants.join(", ")],
    ["Status", "Fullført"],
  ],
  theme: "grid",
  styles: { font: "Inter", fontSize: 9, cellPadding: 2.5, textColor: [40,40,40] },
  columnStyles: { 0: { fontStyle: "bold", fillColor: [240,244,248], cellWidth: 40 }, 1: { cellWidth: contentWidth - 40 } },
  margin: { left: margin, right: margin },
});
y = doc.lastAutoTable.finalY + 8;

writeParagraph("Arbeidsbeskrivelse", { size: 13, bold: true, color: [30,58,95], gap: 3 });
doc.setDrawColor(30,58,95); doc.setLineWidth(0.4); doc.line(margin,y-1,margin+30,y-1); y+=2;
writeParagraph(workDescription, { size: 10, gap: 6 });

writeParagraph("Risiko og tiltak", { size: 13, bold: true, color: [30,58,95], gap: 3 });
doc.setDrawColor(30,58,95); doc.setLineWidth(0.4); doc.line(margin,y-1,margin+30,y-1); y+=3;

risks.forEach((r, i) => {
  const related = measures.filter(m => m.risk === r.description);
  ensureSpace(20);
  writeParagraph(`${i+1}. ${r.description.split(/[.!?]/)[0].slice(0,80)}`, { size: 11, bold: true, color: [30,58,95], gap: 2 });
  doc.setFontSize(9); doc.setFont("Inter","italic"); doc.setTextColor(110,110,110);
  doc.text(`Sannsynlighet: ${r.probability}   |   Konsekvens: ${r.consequence}`, margin, y); y+=5;
  doc.setFont("Inter","bold"); doc.setFontSize(10); doc.setTextColor(40,40,40);
  ensureSpace(6); doc.text("Risiko:", margin, y); y+=5;
  writeParagraph(r.description, { size: 10, gap: 4 });
  doc.setFont("Inter","bold"); doc.setFontSize(10); doc.setTextColor(40,40,40);
  ensureSpace(6); doc.text("Tiltak:", margin, y); y+=5;
  related.forEach((m) => {
    doc.setFont("Inter","normal"); doc.setFontSize(10); doc.setTextColor(40,40,40);
    const lines = doc.splitTextToSize(m.measure, contentWidth - 6);
    ensureSpace(lines.length * 5 + 2);
    doc.text("•", margin, y); doc.text(lines, margin+5, y);
    y += lines.length * 5;
    doc.setFontSize(8); doc.setTextColor(110,110,110);
    doc.text(`Ansvarlig: ${m.responsible}`, margin+5, y+1); y+=4; y+=2;
  });
  y+=3; doc.setDrawColor(220,226,232); doc.setLineWidth(0.2);
  ensureSpace(2); doc.line(margin, y, pageWidth-margin, y); y+=5;
});

y+=2;
writeParagraph("Merknader", { size: 13, bold: true, color: [30,58,95], gap: 3 });
doc.setDrawColor(30,58,95); doc.setLineWidth(0.4); doc.line(margin,y-1,margin+30,y-1); y+=2;
writeParagraph(notes, { size: 10, gap: 6 });

ensureSpace(20); y+=4;
writeParagraph("Signatur", { size: 13, bold: true, color: [30,58,95], gap: 3 });
doc.setDrawColor(30,58,95); doc.setLineWidth(0.4); doc.line(margin,y-1,margin+30,y-1); y+=3;
doc.setDrawColor(180,180,180); doc.setLineWidth(0.3);
doc.line(margin, y+18, margin+60, y+18);
doc.setFontSize(8); doc.setTextColor(150,150,150); doc.setFont("Inter","normal");
doc.text("(signatur)", margin+22, y+12); y+=24;
doc.setFontSize(9); doc.setTextColor(80,80,80);
doc.text(`Signert av ${sja.completed_by_name} den 4. juni 2026`, margin, y);

const pageCount = doc.getNumberOfPages();
for (let i=1; i<=pageCount; i++) {
  doc.setPage(i);
  doc.setFontSize(8); doc.setTextColor(140,140,140); doc.setFont("Inter","normal");
  doc.text(`${sja.sja_number} – ${sja.title}`, margin, pageHeight - 8);
  doc.text(`Side ${i} av ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: "right" });
}

fs.writeFileSync("/mnt/documents/SJA_eksempel_v3.pdf", Buffer.from(doc.output("arraybuffer")));
console.log("OK");
