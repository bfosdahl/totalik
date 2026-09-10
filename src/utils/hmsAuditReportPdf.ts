import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { registerPdfFont, PDF_FONT } from "./pdfFont";

export type AuditReportFormType =
  | "annual_hms"
  | "elkontroll"
  | "fysiske_forhold"
  | "daglig_drift"
  | "vernerunde"
  | string;

export interface AuditReportInput {
  formType: AuditReportFormType;
  formData: unknown;
  revisionDate?: string | null;
  completedAt?: string | null;
  createdAt?: string | null;
  status?: string | null;
  auditorName?: string | null;
  managerName?: string | null;
  participants?: string | null;
  company: {
    name?: string | null;
    org_number?: string | null;
    address?: string | null;
    postal_code?: string | null;
    city?: string | null;
    phone?: string | null;
    email?: string | null;
    industry?: string | null;
  };
}

const FORM_LABELS: Record<string, string> = {
  annual_hms: "Årlig HMS-revisjon",
  elkontroll: "El-kontroll",
  fysiske_forhold: "Fysiske arbeidsforhold",
  daglig_drift: "Daglig drift",
  vernerunde: "Vernerunde",
};

const FORM_INTRO: Record<string, string> = {
  annual_hms:
    "Denne rapporten dokumenterer den årlige gjennomgangen av virksomhetens internkontrollsystem for helse, miljø og sikkerhet. Formålet er å verifisere at systemet oppfyller kravene i internkontrollforskriften (forskrift om systematisk helse-, miljø- og sikkerhetsarbeid) og arbeidsmiljøloven, samt å identifisere avvik og forbedringsområder.",
  elkontroll:
    "Denne rapporten dokumenterer intern kontroll av elektriske anlegg og elektrisk utstyr, jf. internkontrollforskriften og forskrift om elektriske lavspenningsanlegg. Kontrollen er en egenkontroll og erstatter ikke lovpålagt kontroll utført av registrert elvirksomhet.",
  fysiske_forhold:
    "Denne rapporten dokumenterer kartlegging av de fysiske arbeidsforholdene i virksomheten, jf. arbeidsmiljøloven kapittel 4 og internkontrollforskriften § 5. Kartleggingen danner grunnlag for risikovurdering og handlingsplan.",
  daglig_drift:
    "Denne rapporten dokumenterer gjennomgangen av organisatoriske og psykososiale forhold i den daglige driften, jf. arbeidsmiljøloven kapittel 2 til 4 og internkontrollforskriften § 5.",
  vernerunde:
    "Denne rapporten dokumenterer gjennomført vernerunde med kontrollpunkter, funn og oppfølgingstiltak, jf. arbeidsmiljøloven § 3-1 og internkontrollforskriften § 5.",
};

const SECTION_TITLES: Record<string, Record<string, string>> = {
  annual_hms: {
    goalsSection: "1. Mål og planer for HMS-arbeidet",
    organizationSection: "2. Organisering og ansvar",
    riskSection: "3. Risikovurdering",
    routinesSection: "4. Rutiner og prosedyrer",
    trainingSection: "5. Opplæring og kompetanse",
    deviationsSection: "6. Avviksbehandling og hendelser",
    inspectionsSection: "7. Vernerunder / inspeksjoner",
    workEnvSection: "8. Arbeidsmiljø og trivsel",
  },
  daglig_drift: {
    informasjon: "1. Informasjon og kommunikasjon i bedriften",
    samarbeid: "2. Samarbeid og beslutninger i bedriften",
    produktivitet: "3. Vurdering av produktivitet og effektivitet",
    arbeidsavtaler: "4. Arbeidsavtaler og arbeidsreglement",
    arbeidstid: "5. Arbeidstidsbestemmelser",
    hms: "6. Organisering av bedriftens HMS-arbeid",
    kompetanse: "7. Yrkesrettet kompetanse og opplæring",
    registrering: "8. Registrering av yrkessykdommer, skader og nestenulykker",
    vernetjeneste: "9. Organisering av bedriftens vernetjeneste",
    forsikringer: "10. Forsikringer i bedriften",
    annet: "11. Andre ting som bør kartlegges",
  },
  fysiske_forhold: {
    arbeidslokaler: "1. Arbeidslokaler",
    elektrisk: "2. Elektriske anlegg og utstyr",
    inneklima: "3. Inneklima - lokaler",
    romningsveier: "4. Rømningsveier / nødutganger",
    brannsikkerhet: "5. Brannsikkerhet - lokaler",
    brannfarlig: "6. Oppbevaring av brann- og eksplosjonsfarlige varer",
    varehandtering: "7. Varehåndtering / lager",
    orden: "8. Orden og renhold i lokaler",
    avfall: "9. Avfallshåndtering i bedriften",
    dataskjerm: "10. Arbeid foran dataskjermen",
    asbest: "11. Arbeid med asbestholdig materiale",
    eksterne: "12. Eksterne arbeidsforhold",
    ergonomi: "13. Ergonomi - belastninger i arbeidsutførelsen",
    verneutstyr: "14. Bruk av personlig verneutstyr i bedriften",
    stoy: "15. Støyeksponering",
    arbeidsutstyr: "16. Bruk av arbeidsutstyr og maskiner",
    hoyden: "17. Arbeid i høyden",
    kjemisk: "18. Arbeid med kjemiske stoffer, løsemidler og gasser",
    forstehjelp: "19. Førstehjelp og brannsikkerhet på anlegg",
    sikring: "20. Sikring av last",
    lasting: "21. Lasting og lossing av varer",
    graving: "22. Gravearbeider",
    sprengning: "23. Sprengningsarbeider",
    adr: "24. ADR-transport / transport av farlig gods",
    adr_uhell: "25. Uhell / ulykke ved ADR-transport",
    ergonomi_kjoretoy: "26. Ergonomi i store kjøretøy",
    hviletid: "27. Kjøre- og hviletid",
    annet: "28. Andre ting som bør kartlegges",
  },
};

interface ReportRow {
  label: string;
  answer: "yes" | "no" | "na" | "";
  comment: string;
}

/**
 * Enkelte eldre kontrollpunkter er negativt formulert, slik at "Nei" er det
 * positive svaret (og "Ja" betyr avvik). Disse må ikke telles som avvik.
 */
const INVERTED_QUESTIONS = [
  "høy belastning er ikke koblet via skjøteledninger",
  "ingen kabler løst, over varme eller fukt uten vern",
  "high loads are not connected via extension cords",
  "no loose cables, or cables exposed to heat or moisture without protection",
];

const isInvertedQuestion = (label: string) => {
  const l = label.trim().toLowerCase().replace(/\s+/g, " ");
  return INVERTED_QUESTIONS.some((q) => l.startsWith(q) || q.startsWith(l));
};

/** Er raden et avvik, hensyntatt negativt formulerte spørsmål? */
const isDeviation = (row: ReportRow) =>
  isInvertedQuestion(row.label) ? row.answer === "yes" : row.answer === "no";

/** Er raden vurdert som i orden? */
const isOk = (row: ReportRow) =>
  isInvertedQuestion(row.label) ? row.answer === "no" : row.answer === "yes";
interface ReportSection {
  title: string;
  rows: ReportRow[];
}
interface NormalizedReport {
  sections: ReportSection[];
  freeText: { label: string; value: string }[];
  actions: { action: string; responsible: string; deadline: string }[];
  signatures: { label: string; value: string }[];
  extraMeta: { label: string; value: string }[];
}

const asRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

const answerOf = (v: unknown): ReportRow["answer"] => {
  const a = asRecord(v).answer;
  return a === "yes" || a === "no" || a === "na" ? a : "";
};
const commentOf = (v: unknown): string => {
  const c = asRecord(v).comment;
  return typeof c === "string" ? c : "";
};

const humanize = (key: string) =>
  key.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());

function normalize(formType: string, raw: unknown): NormalizedReport {
  const data = asRecord(raw);
  const sections: ReportSection[] = [];
  const freeText: { label: string; value: string }[] = [];
  const actions: NormalizedReport["actions"] = [];
  const signatures: { label: string; value: string }[] = [];
  const extraMeta: { label: string; value: string }[] = [];
  const titles = SECTION_TITLES[formType] || {};

  const pushText = (label: string, value: unknown) => {
    if (typeof value === "string" && value.trim()) freeText.push({ label, value: value.trim() });
  };
  const pushSign = (label: string, value: unknown) => {
    if (typeof value === "string" && value.trim()) signatures.push({ label, value: value.trim() });
  };

  // Shape A: sectionItems + per-section answer maps (annual_hms)
  const sectionItems = asRecord(data.sectionItems);
  if (Object.keys(sectionItems).length > 0) {
    for (const [key, items] of Object.entries(sectionItems)) {
      if (!Array.isArray(items)) continue;
      const answers = asRecord(data[key]);
      sections.push({
        title: titles[key] || humanize(key),
        rows: items.map((item) => {
          const it = asRecord(item);
          const id = String(it.id ?? "");
          return {
            label: String(it.label ?? it.question ?? ""),
            answer: answerOf(answers[id]),
            comment: commentOf(answers[id]),
          };
        }),
      });
    }
  }

  // Shape B: sectionQuestions + checklistAnswers[sectionId][questionId]
  const sectionQuestions = asRecord(data.sectionQuestions);
  if (Object.keys(sectionQuestions).length > 0) {
    const allAnswers = asRecord(data.checklistAnswers);
    for (const [key, questions] of Object.entries(sectionQuestions)) {
      if (!Array.isArray(questions)) continue;
      const answers = asRecord(allAnswers[key]);
      sections.push({
        title: titles[key] || humanize(key),
        rows: questions.map((q) => {
          const it = asRecord(q);
          const id = String(it.id ?? "");
          return {
            label: String(it.question ?? it.label ?? ""),
            answer: answerOf(answers[id]),
            comment: commentOf(answers[id]),
          };
        }),
      });
    }
  }

  // Shape C: sections: { key: { title, questions, answers } } (elkontroll)
  const nestedSections = asRecord(data.sections);
  for (const [key, section] of Object.entries(nestedSections)) {
    const s = asRecord(section);
    const questions = Array.isArray(s.questions) ? s.questions : [];
    const answers = asRecord(s.answers);
    sections.push({
      title: String(s.title || titles[key] || humanize(key)),
      rows: questions.map((q) => {
        const it = asRecord(q);
        const id = String(it.id ?? "");
        return {
          label: String(it.question ?? it.label ?? ""),
          answer: answerOf(answers[id]),
          comment: commentOf(answers[id]),
        };
      }),
    });
  }

  // Shape D: vernerunde — checklist booleans + comments
  const checklist = asRecord(data.checklist);
  if (Object.keys(checklist).length > 0) {
    const comments = asRecord(data.comments);
    sections.push({
      title: String(data.templateName || "Kontrollpunkter"),
      rows: Object.entries(checklist).map(([id, checked]) => ({
        label: humanize(id),
        answer: checked === true ? "yes" : "",
        comment: typeof comments[id] === "string" ? (comments[id] as string) : "",
      })),
    });
  }

  // Free text and actions
  pushText("Styrker i HMS-arbeidet", data.strengths);
  pushText("Forbedringsområder", data.improvements);
  pushText("Andre kommentarer", data.otherComments);
  pushText("Avvik og kommentarer", data.avvikKommentarer);
  pushText("Tiltak og frist", data.tiltakOgFrist);
  pushText("Registrerte avvik", data.avvik);
  pushText("Tiltak", data.tiltak);

  if (typeof data.ansvarligOppfolging === "string" && data.ansvarligOppfolging.trim()) {
    extraMeta.push({ label: "Ansvarlig oppfølging", value: data.ansvarligOppfolging });
  }
  if (typeof data.fristTiltak === "string" && data.fristTiltak.trim()) {
    extraMeta.push({ label: "Frist for tiltak", value: data.fristTiltak });
  }
  if (typeof data.location === "string" && data.location.trim()) {
    extraMeta.push({ label: "Sted / anlegg", value: data.location });
  }
  if (typeof data.avdeling === "string" && data.avdeling.trim()) {
    extraMeta.push({ label: "Avdeling", value: data.avdeling });
  }

  if (Array.isArray(data.actions)) {
    for (const a of data.actions) {
      const it = asRecord(a);
      const action = String(it.action ?? "").trim();
      if (!action) continue;
      actions.push({
        action,
        responsible: String(it.responsible ?? "").trim() || "Ikke satt",
        deadline: String(it.deadline ?? "").trim() || "Ikke satt",
      });
    }
  }

  pushSign("Revisor / kontrollør", data.auditorSignature ?? data.signaturKontrollor ?? data.signVerneombud);
  pushSign("Daglig leder / ansvarlig", data.managerSignature ?? data.signaturAnsvarlig ?? data.signLeder);

  return { sections, freeText, actions, signatures, extraMeta };
}

const answerLabel = (a: ReportRow["answer"]) =>
  a === "yes" ? "Ja" : a === "no" ? "Nei" : a === "na" ? "Ikke aktuelt" : "Ikke besvart";

const fmt = (value?: string | null) => {
  if (!value) return "-";
  const d = new Date(value);
  return isNaN(d.getTime()) ? value : format(d, "dd.MM.yyyy", { locale: nb });
};

export async function generateHmsAuditReportPdf(input: AuditReportInput): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  await registerPdfFont(doc);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const formLabel = FORM_LABELS[input.formType] || "HMS-aktivitet";
  const report = normalize(input.formType, input.formData);
  const companyName = input.company.name || "Virksomhet";

  // === Header bar ===
  doc.setFillColor(23, 42, 69);
  doc.rect(0, 0, pageWidth, 34, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont(PDF_FONT, "bold");
  doc.setFontSize(18);
  doc.text(formLabel.toUpperCase(), margin, 15);
  doc.setFont(PDF_FONT, "normal");
  doc.setFontSize(11);
  doc.text(companyName, margin, 24);
  doc.setFontSize(9);
  doc.text("Internkontroll - HMS", pageWidth - margin, 15, { align: "right" });
  doc.text(`Rapportdato: ${format(new Date(), "dd.MM.yyyy", { locale: nb })}`, pageWidth - margin, 22, {
    align: "right",
  });
  doc.setTextColor(0, 0, 0);

  // === Meta table ===
  const location = [input.company.postal_code, input.company.city].filter(Boolean).join(" ");
  const metaRows: [string, string][] = [
    ["Dokumenttype", formLabel],
    ["Virksomhet", companyName],
    ["Organisasjonsnummer", input.company.org_number || "-"],
    ["Adresse", [input.company.address, location].filter(Boolean).join(", ") || "-"],
    ["Kontakt", [input.company.phone, input.company.email].filter(Boolean).join(" / ") || "-"],
    ["Dato for gjennomgang", fmt(input.revisionDate || input.completedAt || input.createdAt)],
    ["Revisor / ansvarlig", input.auditorName || "-"],
    ["Deltakere", input.participants || "-"],
    ["Status", input.status === "completed" ? "Fullført" : "Utkast"],
    ["Grunnlag", "Internkontrollsystem i Totalik (IK-forskriften § 5)"],
    ...report.extraMeta.map((m) => [m.label, m.value] as [string, string]),
  ];

  autoTable(doc, {
    startY: 42,
    body: metaRows,
    theme: "grid",
    styles: { font: PDF_FONT, fontSize: 9, cellPadding: 2.2, lineColor: [226, 232, 240] },
    columnStyles: {
      0: { cellWidth: 52, fontStyle: "bold", fillColor: [248, 250, 252] },
      1: { cellWidth: pageWidth - margin * 2 - 52 },
    },
    margin: { left: margin, right: margin },
  });

  const sectionHeading = (title: string, yIn: number) => {
    let y = yIn;
    if (y > pageHeight - 45) {
      doc.addPage();
      y = 22;
    }
    doc.setFont(PDF_FONT, "bold");
    doc.setFontSize(12);
    doc.setTextColor(23, 42, 69);
    doc.text(title, margin, y);
    doc.setTextColor(0, 0, 0);
    doc.setFont(PDF_FONT, "normal");
    return y + 4;
  };

  const lastY = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  // === 1. Sammendrag ===
  let y = lastY() + 12;
  y = sectionHeading("1. Sammendrag", y);
  doc.setFontSize(9.5);
  const intro =
    FORM_INTRO[input.formType] ||
    "Denne rapporten dokumenterer en gjennomført HMS-aktivitet i virksomhetens internkontrollsystem.";
  const introLines = doc.splitTextToSize(intro, pageWidth - margin * 2);
  doc.text(introLines, margin, y + 4);
  y = y + 4 + introLines.length * 4.6;

  const summaryRows = report.sections.map((s) => {
    const total = s.rows.length;
    const ok = s.rows.filter((r) => r.answer === "yes").length;
    const deviations = s.rows.filter((r) => r.answer === "no").length;
    const na = s.rows.filter((r) => r.answer === "na").length;
    const unanswered = total - ok - deviations - na;
    const verdict =
      deviations > 0
        ? `Avvik (${deviations})`
        : unanswered > 0
          ? "Merknad - ikke fullstendig besvart"
          : "OK";
    return [s.title, String(total), String(ok), String(deviations), String(na + unanswered), verdict];
  });

  if (summaryRows.length > 0) {
    autoTable(doc, {
      startY: y + 3,
      head: [["Område", "Punkter", "OK", "Avvik", "N/A", "Vurdering"]],
      body: summaryRows,
      theme: "grid",
      styles: { font: PDF_FONT, fontSize: 8.5, cellPadding: 2, lineColor: [226, 232, 240] },
      headStyles: { fillColor: [23, 42, 69], textColor: 255, font: PDF_FONT, fontStyle: "bold" },
      columnStyles: {
        1: { halign: "center", cellWidth: 16 },
        2: { halign: "center", cellWidth: 14 },
        3: { halign: "center", cellWidth: 16 },
        4: { halign: "center", cellWidth: 14 },
        5: { cellWidth: 40 },
      },
      margin: { left: margin, right: margin },
    });
    y = lastY();
  }

  // === 2. Detaljert gjennomgang ===
  let sectionNo = 2;
  if (report.sections.length > 0) {
    y = sectionHeading(`${sectionNo}. Detaljert gjennomgang`, y + 12);
    sectionNo++;
    for (const section of report.sections) {
      if (section.rows.length === 0) continue;
      autoTable(doc, {
        startY: y + 3,
        head: [[section.title, "Svar", "Kommentar"]],
        body: section.rows.map((r) => [r.label || "-", answerLabel(r.answer), r.comment || "-"]),
        theme: "striped",
        rowPageBreak: "avoid",
        styles: { font: PDF_FONT, fontSize: 8.5, cellPadding: 2, valign: "top", lineColor: [226, 232, 240] },
        headStyles: { fillColor: [241, 245, 249], textColor: [23, 42, 69], font: PDF_FONT, fontStyle: "bold" },
        columnStyles: {
          0: { cellWidth: (pageWidth - margin * 2) * 0.48 },
          1: { cellWidth: 24, halign: "center" },
          2: { cellWidth: "auto" },
        },
        margin: { left: margin, right: margin },
        didParseCell: (hook) => {
          if (hook.section === "body" && hook.column.index === 1 && hook.cell.raw === "Nei") {
            hook.cell.styles.textColor = [190, 30, 45];
            hook.cell.styles.fontStyle = "bold";
          }
        },
      });
      y = lastY() + 4;
    }
  }

  // === Funn og avvik ===
  const findings = report.sections.flatMap((s) =>
    s.rows.filter((r) => r.answer === "no").map((r) => [s.title, r.label, r.comment || "Tiltak ikke beskrevet"])
  );
  y = sectionHeading(`${sectionNo}. Funn og avvik`, y + 10);
  sectionNo++;
  if (findings.length === 0) {
    doc.setFontSize(9.5);
    doc.text(
      "Ingen avvik er registrert i denne gjennomgangen. Alle besvarte kontrollpunkter er vurdert som tilfredsstillende.",
      margin,
      y + 5,
      { maxWidth: pageWidth - margin * 2 }
    );
    y += 12;
  } else {
    autoTable(doc, {
      startY: y + 3,
      head: [["Område", "Avvik / kontrollpunkt", "Kommentar / tiltak"]],
      body: findings,
      theme: "grid",
      styles: { font: PDF_FONT, fontSize: 8.5, cellPadding: 2, valign: "top", lineColor: [226, 232, 240] },
      headStyles: { fillColor: [190, 30, 45], textColor: 255, font: PDF_FONT, fontStyle: "bold" },
      margin: { left: margin, right: margin },
    });
    y = lastY();
  }

  // === Handlingsplan ===
  if (report.actions.length > 0) {
    y = sectionHeading(`${sectionNo}. Handlingsplan`, y + 10);
    sectionNo++;
    autoTable(doc, {
      startY: y + 3,
      head: [["Nr", "Tiltak", "Ansvarlig", "Frist"]],
      body: report.actions.map((a, i) => [String(i + 1), a.action, a.responsible, a.deadline]),
      theme: "grid",
      styles: { font: PDF_FONT, fontSize: 8.5, cellPadding: 2, valign: "top", lineColor: [226, 232, 240] },
      headStyles: { fillColor: [23, 42, 69], textColor: 255, font: PDF_FONT, fontStyle: "bold" },
      columnStyles: { 0: { cellWidth: 12, halign: "center" }, 2: { cellWidth: 38 }, 3: { cellWidth: 26 } },
      margin: { left: margin, right: margin },
    });
    y = lastY();
  }

  // === Oppsummering / fritekst ===
  if (report.freeText.length > 0) {
    y = sectionHeading(`${sectionNo}. Oppsummering og vurdering`, y + 10);
    sectionNo++;
    autoTable(doc, {
      startY: y + 3,
      body: report.freeText.map((f) => [f.label, f.value]),
      theme: "grid",
      styles: { font: PDF_FONT, fontSize: 9, cellPadding: 2.2, valign: "top", lineColor: [226, 232, 240] },
      columnStyles: { 0: { cellWidth: 52, fontStyle: "bold", fillColor: [248, 250, 252] } },
      margin: { left: margin, right: margin },
    });
    y = lastY();
  }

  // === Konklusjon ===
  y = sectionHeading(`${sectionNo}. Konklusjon`, y + 10);
  sectionNo++;
  const totalPoints = report.sections.reduce((sum, s) => sum + s.rows.length, 0);
  const conclusion =
    findings.length === 0
      ? `Gjennomgangen omfatter ${totalPoints} kontrollpunkter fordelt på ${report.sections.length} områder. Det er ikke avdekket avvik. Virksomheten dokumenterer med dette systematisk HMS-arbeid i tråd med internkontrollforskriften § 5. Neste gjennomgang bør gjennomføres innen ett år.`
      : `Gjennomgangen omfatter ${totalPoints} kontrollpunkter fordelt på ${report.sections.length} områder. Det er avdekket ${findings.length} avvik som skal følges opp med tiltak, ansvarlig og frist. Avvikene bør registreres i avvikssystemet og lukkes innen avtalt frist. Neste gjennomgang bør gjennomføres innen ett år.`;
  doc.setFontSize(9.5);
  const conclusionLines = doc.splitTextToSize(conclusion, pageWidth - margin * 2);
  doc.text(conclusionLines, margin, y + 5);
  y = y + 5 + conclusionLines.length * 4.6;

  // === Signaturer ===
  if (y > pageHeight - 60) {
    doc.addPage();
    y = 20;
  }
  y = sectionHeading("Signaturer", y + 10);
  autoTable(doc, {
    startY: y + 3,
    head: [["Rolle", "Navn", "Dato"]],
    body: (report.signatures.length > 0
      ? report.signatures
      : [
          { label: "Revisor / kontrollør", value: input.auditorName || "" },
          { label: "Daglig leder / ansvarlig", value: input.managerName || "" },
        ]
    ).map((s) => [s.label, s.value || "", fmt(input.revisionDate || input.completedAt)]),
    theme: "grid",
    styles: { font: PDF_FONT, fontSize: 9, cellPadding: 3.5, lineColor: [226, 232, 240], minCellHeight: 12 },
    headStyles: { fillColor: [241, 245, 249], textColor: [23, 42, 69], font: PDF_FONT, fontStyle: "bold" },
    margin: { left: margin, right: margin },
  });

  // === Footer ===
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
    doc.setFont(PDF_FONT, "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`${formLabel} - ${companyName}`, margin, pageHeight - 8);
    doc.text(`Side ${i} av ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: "right" });
  }

  const dateForName = (input.revisionDate || input.completedAt || new Date().toISOString()).slice(0, 10);
  const safeName = companyName.replace(/[^a-zA-Z0-9æøåÆØÅ]+/g, "_").replace(/^_|_$/g, "");
  doc.save(`${formLabel.replace(/\s+/g, "_")}_${safeName}_${dateForName}.pdf`);
}
