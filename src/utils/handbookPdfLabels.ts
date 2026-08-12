import type { SupportedLanguage } from "@/contexts/LanguageContext";

export interface HandbookPdfLabels {
  coverTitle1: string;
  coverTitle2: string;
  date: string;
  footer: string;
  toc: string;
  goalsTitle: string;
  goalsIntro: string;
  noGoals: string;
  orgTitle: string;
  orgChart: string;
  untitled: string;
  roles: string;
  generalDescription: string;
  noOrg: string;
  riskTitle: string;
  riskMethod: string;
  riskHeaders: string[];
  noRisks: string;
  actionTitle: string;
  actionHeaders: string[];
  noActions: string;
  routinesTitle: string;
  routine: {
    purpose: string;
    responsibility: string;
    procedure: string;
    examples: string;
    remember: string;
    notSpecified: string;
  };
  noRoutines: string;
  downloaded: string;
  downloadFailed: string;
}

const no: HandbookPdfLabels = {
  coverTitle1: "INTERNKONTROLL",
  coverTitle2: "HMS-HÅNDBOK",
  date: "Dato",
  footer: "Utarbeidet i henhold til forskrift om systematisk helse-, miljø- og sikkerhetsarbeid",
  toc: "Innholdsfortegnelse",
  goalsTitle: "Mål for internkontroll",
  goalsIntro: "Bedriften har fastsatt følgende mål for sitt systematiske HMS-arbeid:",
  noGoals: "Ingen mål er definert.",
  orgTitle: "Organisering og ansvar",
  orgChart: "Organisasjonskart",
  untitled: "Uten tittel",
  roles: "Roller og ansvar",
  generalDescription: "Generell beskrivelse",
  noOrg: "Organisasjonsstruktur er ikke definert.",
  riskTitle: "Risikovurdering",
  riskMethod: "Risiko = Sannsynlighet × Konsekvens (Arbeidstilsynets metodikk)",
  riskHeaders: ["Beskrivelse", "S", "K", "R", "Nivå"],
  noRisks: "Ingen risikovurderinger utført.",
  actionTitle: "Handlingsplan",
  actionHeaders: ["Tiltak", "Ansvarlig", "Frist", "Status"],
  noActions: "Ingen tiltak registrert.",
  routinesTitle: "Rutiner og prosedyrer",
  routine: {
    purpose: "Formål",
    responsibility: "Ansvar",
    procedure: "Fremgangsmåte",
    examples: "Eksempler",
    remember: "Husk",
    notSpecified: "Ikke spesifisert",
  },
  noRoutines: "Ingen rutiner registrert.",
  downloaded: "PDF lastet ned!",
  downloadFailed: "Kunne ikke generere PDF",
};

const en: HandbookPdfLabels = {
  coverTitle1: "INTERNAL CONTROL",
  coverTitle2: "HSE HANDBOOK",
  date: "Date",
  footer: "Prepared in accordance with regulations on systematic health, safety and environmental work",
  toc: "Table of Contents",
  goalsTitle: "Goals for Internal Control",
  goalsIntro: "The company has established the following goals for its systematic HSE work:",
  noGoals: "No goals defined.",
  orgTitle: "Organization and Responsibilities",
  orgChart: "Organization Chart",
  untitled: "Untitled",
  roles: "Roles and Responsibilities",
  generalDescription: "General Description",
  noOrg: "Organization structure not defined.",
  riskTitle: "Risk Assessment",
  riskMethod: "Risk = Probability × Consequence (Norwegian Labour Inspection methodology)",
  riskHeaders: ["Description", "P", "C", "R", "Level"],
  noRisks: "No risk assessments performed.",
  actionTitle: "Action Plan",
  actionHeaders: ["Action", "Responsible", "Deadline", "Status"],
  noActions: "No actions registered.",
  routinesTitle: "Routines and Procedures",
  routine: {
    purpose: "Purpose",
    responsibility: "Responsibility",
    procedure: "Procedure",
    examples: "Examples",
    remember: "Remember",
    notSpecified: "Not specified",
  },
  noRoutines: "No routines registered.",
  downloaded: "PDF downloaded!",
  downloadFailed: "Could not generate PDF",
};

const lv: HandbookPdfLabels = {
  coverTitle1: "IEKŠĒJĀ KONTROLE",
  coverTitle2: "DDVA ROKASGRĀMATA",
  date: "Datums",
  footer: "Sagatavots saskaņā ar noteikumiem par sistemātisku darba drošības, veselības un vides aizsardzības darbu",
  toc: "Satura rādītājs",
  goalsTitle: "Iekšējās kontroles mērķi",
  goalsIntro: "Uzņēmums ir noteicis šādus mērķus sistemātiskajam DDVA darbam:",
  noGoals: "Mērķi nav definēti.",
  orgTitle: "Organizācija un atbildība",
  orgChart: "Organizācijas shēma",
  untitled: "Bez nosaukuma",
  roles: "Lomas un atbildība",
  generalDescription: "Vispārīgs apraksts",
  noOrg: "Organizācijas struktūra nav definēta.",
  riskTitle: "Riska novērtējums",
  riskMethod: "Risks = Varbūtība × Sekas (Norvēģijas Darba inspekcijas metodika)",
  riskHeaders: ["Apraksts", "V", "S", "R", "Līmenis"],
  noRisks: "Riska novērtējumi nav veikti.",
  actionTitle: "Rīcības plāns",
  actionHeaders: ["Pasākums", "Atbildīgais", "Termiņš", "Statuss"],
  noActions: "Nav reģistrētu pasākumu.",
  routinesTitle: "Rutīnas un procedūras",
  routine: {
    purpose: "Mērķis",
    responsibility: "Atbildība",
    procedure: "Procedūra",
    examples: "Piemēri",
    remember: "Atceries",
    notSpecified: "Nav norādīts",
  },
  noRoutines: "Nav reģistrētu rutīnu.",
  downloaded: "PDF lejupielādēts!",
  downloadFailed: "Neizdevās izveidot PDF",
};

const pl: HandbookPdfLabels = {
  coverTitle1: "KONTROLA WEWNĘTRZNA",
  coverTitle2: "PODRĘCZNIK BHP",
  date: "Data",
  footer: "Opracowano zgodnie z przepisami o systematycznej pracy w zakresie zdrowia, środowiska i bezpieczeństwa",
  toc: "Spis treści",
  goalsTitle: "Cele kontroli wewnętrznej",
  goalsIntro: "Firma określiła następujące cele dla systematycznej pracy BHP:",
  noGoals: "Nie zdefiniowano celów.",
  orgTitle: "Organizacja i odpowiedzialność",
  orgChart: "Schemat organizacyjny",
  untitled: "Bez tytułu",
  roles: "Role i odpowiedzialność",
  generalDescription: "Opis ogólny",
  noOrg: "Struktura organizacyjna nie została zdefiniowana.",
  riskTitle: "Ocena ryzyka",
  riskMethod: "Ryzyko = Prawdopodobieństwo × Skutek (metodyka Norweskiej Inspekcji Pracy)",
  riskHeaders: ["Opis", "P", "S", "R", "Poziom"],
  noRisks: "Nie przeprowadzono oceny ryzyka.",
  actionTitle: "Plan działania",
  actionHeaders: ["Działanie", "Odpowiedzialny", "Termin", "Status"],
  noActions: "Brak zarejestrowanych działań.",
  routinesTitle: "Procedury i instrukcje",
  routine: {
    purpose: "Cel",
    responsibility: "Odpowiedzialność",
    procedure: "Procedura",
    examples: "Przykłady",
    remember: "Pamiętaj",
    notSpecified: "Nie określono",
  },
  noRoutines: "Brak zarejestrowanych procedur.",
  downloaded: "PDF pobrany!",
  downloadFailed: "Nie udało się wygenerować PDF",
};

const lt: HandbookPdfLabels = {
  coverTitle1: "VIDAUS KONTROLĖ",
  coverTitle2: "DSS VADOVAS",
  date: "Data",
  footer: "Parengta pagal sisteminio sveikatos, aplinkos ir saugos darbo reglamentą",
  toc: "Turinys",
  goalsTitle: "Vidaus kontrolės tikslai",
  goalsIntro: "Įmonė nustatė šiuos sisteminio DSS darbo tikslus:",
  noGoals: "Tikslai neapibrėžti.",
  orgTitle: "Organizacija ir atsakomybė",
  orgChart: "Organizacinė schema",
  untitled: "Be pavadinimo",
  roles: "Vaidmenys ir atsakomybė",
  generalDescription: "Bendras aprašymas",
  noOrg: "Organizacinė struktūra neapibrėžta.",
  riskTitle: "Rizikos vertinimas",
  riskMethod: "Rizika = Tikimybė × Pasekmė (Norvegijos darbo inspekcijos metodika)",
  riskHeaders: ["Aprašymas", "T", "P", "R", "Lygis"],
  noRisks: "Rizikos vertinimai neatlikti.",
  actionTitle: "Veiksmų planas",
  actionHeaders: ["Veiksmas", "Atsakingas", "Terminas", "Būsena"],
  noActions: "Nėra užregistruotų veiksmų.",
  routinesTitle: "Procedūros ir tvarkos",
  routine: {
    purpose: "Tikslas",
    responsibility: "Atsakomybė",
    procedure: "Procedūra",
    examples: "Pavyzdžiai",
    remember: "Atmink",
    notSpecified: "Nenurodyta",
  },
  noRoutines: "Nėra užregistruotų procedūrų.",
  downloaded: "PDF atsisiųstas!",
  downloadFailed: "Nepavyko sukurti PDF",
};

export const HANDBOOK_PDF_LABELS: Record<SupportedLanguage, HandbookPdfLabels> = {
  no,
  en,
  lv,
  pl,
  lt,
};

export function getHandbookPdfLabels(lang: SupportedLanguage): HandbookPdfLabels {
  return HANDBOOK_PDF_LABELS[lang] ?? HANDBOOK_PDF_LABELS.no;
}
