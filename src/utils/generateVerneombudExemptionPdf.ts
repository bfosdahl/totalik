import jsPDF from "jspdf";

interface ExemptionPdfData {
  companyName: string;
  orgNumber?: string;
  companyAddress?: string;
  totalEmployees: number;
  employerName: string;
  employerSignature: string;
  employerSignedAt: string;
  employeeSignatures: Array<{
    name: string;
    signature: string;
    signed_at: string;
  }>;
  agreementDate: string;
}

export function generateVerneombudExemptionPdf(data: ExemptionPdfData) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 25;

  const addNewPageIfNeeded = (requiredSpace: number) => {
    if (y + requiredSpace > 270) {
      doc.addPage();
      y = 25;
    }
  };

  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Avtale om fritak fra verneombud", pageWidth / 2, y, { align: "center" });
  y += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("I henhold til arbeidsmiljøloven § 6-1", pageWidth / 2, y, { align: "center" });
  doc.setTextColor(0);
  y += 12;

  // Company info box
  doc.setDrawColor(200);
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(margin, y, contentWidth, 30, 2, 2, "FD");
  y += 7;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Virksomhet:", margin + 5, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.companyName, margin + 35, y);
  y += 6;
  if (data.orgNumber) {
    doc.setFont("helvetica", "bold");
    doc.text("Org.nr:", margin + 5, y);
    doc.setFont("helvetica", "normal");
    doc.text(data.orgNumber, margin + 35, y);
    y += 6;
  }
  if (data.companyAddress) {
    doc.setFont("helvetica", "bold");
    doc.text("Adresse:", margin + 5, y);
    doc.setFont("helvetica", "normal");
    doc.text(data.companyAddress, margin + 35, y);
    y += 6;
  }
  doc.setFont("helvetica", "bold");
  doc.text("Ansatte:", margin + 5, y);
  doc.setFont("helvetica", "normal");
  doc.text(`${data.totalEmployees} ansatte`, margin + 35, y);
  y += 12;

  // Agreement sections
  const sections = [
    {
      title: "1. Avtalens formål",
      text: "Formålet med denne avtalen er å formalisere enighet mellom arbeidsgiver og ansatte om at det ikke er nødvendig å velge verneombud i virksomheten, grunnet virksomhetens størrelse og enighet mellom partene."
    },
    {
      title: "2. Grunnlag for fritak",
      text: `Virksomheten har totalt ${data.totalEmployees} ansatte, og partene er enige om at det ikke er behov for verneombud i henhold til gjeldende regelverk. Arbeidsgiver forplikter seg til fortsatt å ivareta helse, miljø og sikkerhet (HMS) på en forsvarlig måte.`
    },
    {
      title: "3. Ansvar og oppfølging",
      text: "Selv om verneombud ikke velges, forplikter arbeidsgiver seg til å sørge for et fullt forsvarlig arbeidsmiljø og følge opp HMS-arbeidet i tråd med lovens krav. Arbeidstakerne forplikter seg til å delta aktivt i HMS-arbeidet."
    },
    {
      title: "4. Avtalens varighet og revisjon",
      text: "Denne avtalen gjelder inntil videre, men skal revurderes dersom antall ansatte økes til 5 eller flere, eller ved vesentlige endringer i arbeidsforholdene."
    }
  ];

  for (const section of sections) {
    addNewPageIfNeeded(25);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(section.title, margin, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(section.text, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 4.5 + 6;
  }

  // Date
  addNewPageIfNeeded(15);
  y += 4;
  doc.setFontSize(10);
  doc.text(`Dato: ${data.agreementDate}`, margin, y);
  y += 12;

  // Employer signature
  addNewPageIfNeeded(45);
  doc.setDrawColor(200);
  doc.line(margin, y, margin + contentWidth, y);
  y += 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Arbeidsgiver", margin, y);
  y += 7;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Navn: ${data.employerName}`, margin, y);
  y += 6;

  if (data.employerSignature) {
    try {
      doc.addImage(data.employerSignature, "PNG", margin, y, 60, 25);
      y += 28;
    } catch {
      doc.text("[Signatur registrert elektronisk]", margin, y);
      y += 6;
    }
  }

  const employerDate = new Date(data.employerSignedAt).toLocaleDateString("nb-NO", {
    day: "numeric", month: "long", year: "numeric"
  });
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(`Signert: ${employerDate}`, margin, y);
  doc.setTextColor(0);
  y += 12;

  // Employee signatures
  addNewPageIfNeeded(20);
  doc.setDrawColor(200);
  doc.line(margin, y, margin + contentWidth, y);
  y += 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Ansatte (${data.employeeSignatures.length} signaturer)`, margin, y);
  y += 8;

  for (const emp of data.employeeSignatures) {
    addNewPageIfNeeded(40);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Navn: ${emp.name}`, margin, y);
    y += 6;

    if (emp.signature) {
      try {
        doc.addImage(emp.signature, "PNG", margin, y, 50, 20);
        y += 23;
      } catch {
        doc.text("[Signatur registrert elektronisk]", margin, y);
        y += 6;
      }
    }

    const empDate = new Date(emp.signed_at).toLocaleDateString("nb-NO", {
      day: "numeric", month: "long", year: "numeric"
    });
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Signert: ${empDate}`, margin, y);
    doc.setTextColor(0);
    y += 10;
  }

  // Footer
  addNewPageIfNeeded(15);
  y += 5;
  doc.setDrawColor(200);
  doc.line(margin, y, margin + contentWidth, y);
  y += 6;
  doc.setFontSize(7);
  doc.setTextColor(130);
  doc.text("Denne avtalen er signert elektronisk og generert fra internkontrollsystemet.", margin, y);
  doc.setTextColor(0);

  // Save
  const safeName = data.companyName.replace(/[^a-zA-Z0-9æøåÆØÅ ]/g, "").replace(/\s+/g, "_");
  doc.save(`Fritak_verneombud_${safeName}.pdf`);
}
