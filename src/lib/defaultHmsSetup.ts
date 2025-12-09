/**
 * Default HMS setup data that is automatically applied when a new company is created.
 * This ensures the handbook always has content, even before AI setup is run.
 * AI setup can later enhance or replace this content.
 */

export interface DefaultGoal {
  goal_text: string;
  is_predefined: boolean;
}

export interface DefaultRisk {
  id: string;
  description: string;
  consequence: number;
  probability: number;
  existing_measures: string;
  planned_measures: string;
}

export interface DefaultRoutine {
  id: string;
  routine_number: string;
  routine_name: string;
  category: string;
  purpose: string;
  responsibility: string;
  procedure: string;
  examples: string;
  remember: string;
  is_predefined: boolean;
}

export interface DefaultAction {
  id: string;
  risk_id: string | null;
  risk_description: string;
  action_description: string;
  responsible: string;
  deadline: string;
  status: "ikke_startet" | "pågår" | "fullført";
  priority: "lav" | "medium" | "høy" | "kritisk";
  comments: string;
}

// Standard HMS goals that apply to all companies
export const defaultGoals: DefaultGoal[] = [
  { goal_text: "Sikre et trygt og helsefremmende arbeidsmiljø for alle ansatte", is_predefined: true },
  { goal_text: "Forebygge arbeidsrelaterte skader og sykdommer", is_predefined: true },
  { goal_text: "Overholde alle relevante lover og forskrifter innen HMS", is_predefined: true },
  { goal_text: "Kontinuerlig forbedre HMS-arbeidet gjennom systematisk internkontroll", is_predefined: true },
  { goal_text: "Fremme god kommunikasjon og medvirkning i HMS-arbeidet", is_predefined: true },
];

// Standard organization template
export const defaultOrganization = {
  template_id: null,
  custom_content: `**Ansvar og roller i HMS-arbeidet**

**Daglig leder/Arbeidsgiver**
- Har det overordnede ansvaret for HMS-arbeidet
- Skal sørge for at virksomheten har et fungerende internkontrollsystem
- Ansvar for å stille nødvendige ressurser til rådighet

**HMS-ansvarlig**
- Koordinerer det daglige HMS-arbeidet
- Følger opp risikovurderinger og tiltak
- Rapporterer til daglig leder om HMS-status

**Verneombud** (ved 5+ ansatte)
- Ivaretar arbeidstakernes interesser i HMS-saker
- Deltar i planlegging og gjennomføring av HMS-tiltak
- Varsler om farlige forhold

**Alle ansatte**
- Følger virksomhetens HMS-rutiner
- Melder fra om farlige forhold og avvik
- Bidrar aktivt til et godt arbeidsmiljø`,
  is_custom: false,
};

// Standard risks that are common for most workplaces
export const defaultRisks: DefaultRisk[] = [
  {
    id: "risk-1",
    description: "Ergonomiske belastninger ved kontorarbeid",
    consequence: 2,
    probability: 3,
    existing_measures: "Justerbare kontorstoler og skrivebord",
    planned_measures: "Gjennomføre ergonomiopplæring for alle ansatte",
  },
  {
    id: "risk-2",
    description: "Psykososiale belastninger og stress",
    consequence: 3,
    probability: 2,
    existing_measures: "Regelmessige medarbeidersamtaler",
    planned_measures: "Innføre rutiner for arbeidsmiljøkartlegging",
  },
  {
    id: "risk-3",
    description: "Brann og evakuering",
    consequence: 4,
    probability: 1,
    existing_measures: "Brannslukkerutstyr og rømningsveier",
    planned_measures: "Gjennomføre årlig brannøvelse",
  },
  {
    id: "risk-4",
    description: "Fall og snubling i lokaler",
    consequence: 2,
    probability: 2,
    existing_measures: "God belysning og ryddige gangveier",
    planned_measures: "Månedlig sjekk av gulvflater og kabler",
  },
];

// Standard routines that every company needs
export const defaultRoutines: DefaultRoutine[] = [
  {
    id: "routine-1",
    routine_number: "R001",
    routine_name: "Avviksbehandling",
    category: "HMS-system",
    purpose: "Sikre systematisk håndtering av avvik, uønskede hendelser og forbedringsforslag.",
    responsibility: "Alle ansatte melder avvik. HMS-ansvarlig koordinerer oppfølging.",
    procedure: "1. Registrer avvik i HMS-systemet\n2. Vurder alvorlighetsgrad\n3. Iverksett strakstiltak ved behov\n4. Analyser årsak\n5. Definer korrigerende tiltak\n6. Følg opp at tiltak blir gjennomført\n7. Avslutt avvik når tiltak er verifisert",
    examples: "Nestenulykker, skader, sykdom relatert til arbeid, brudd på rutiner",
    remember: "Alle avvik skal behandles. Lær av feil for å forebygge gjentakelse.",
    is_predefined: true,
  },
  {
    id: "routine-2",
    routine_number: "R002",
    routine_name: "Risikovurdering",
    category: "HMS-system",
    purpose: "Identifisere farer og vurdere risiko for å kunne iverksette forebyggende tiltak.",
    responsibility: "HMS-ansvarlig leder risikovurderinger med deltakelse fra relevante ansatte.",
    procedure: "1. Kartlegg arbeidsoppgaver og aktiviteter\n2. Identifiser farer og mulige uønskede hendelser\n3. Vurder konsekvens og sannsynlighet\n4. Beregn risikoverdi\n5. Prioriter tiltak for høy risiko\n6. Dokumenter i risikovurderingsskjema\n7. Gjennomgå årlig eller ved endringer",
    examples: "Ved nye arbeidsoppgaver, nytt utstyr, omorganisering, etter hendelser",
    remember: "Involver de som kjenner arbeidet best. Risikovurdering er et levende dokument.",
    is_predefined: true,
  },
  {
    id: "routine-3",
    routine_number: "R003",
    routine_name: "Opplæring og kompetanse",
    category: "Ansatte",
    purpose: "Sikre at alle ansatte har nødvendig kompetanse for å utføre arbeidet sikkert.",
    responsibility: "Leder har ansvar for at ansatte får nødvendig opplæring. Ansatte har ansvar for å delta.",
    procedure: "1. Kartlegg kompetansebehov for hver stilling\n2. Utarbeid opplæringsplan for nyansatte\n3. Gjennomfør grunnleggende HMS-opplæring\n4. Dokumenter gjennomført opplæring\n5. Følg opp behov for oppfriskning\n6. Oppdater ved endringer i oppgaver",
    examples: "HMS-opplæring for nyansatte, brannvernkurs, førstehjelp, fagspesifikk opplæring",
    remember: "God opplæring forebygger ulykker. Dokumentasjon er viktig for etterlevelse.",
    is_predefined: true,
  },
  {
    id: "routine-4",
    routine_number: "R004",
    routine_name: "Vernerunder",
    category: "HMS-system",
    purpose: "Kartlegge arbeidsmiljøet systematisk for å avdekke farer og forbedringsområder.",
    responsibility: "HMS-ansvarlig planlegger og gjennomfører. Verneombud deltar.",
    procedure: "1. Planlegg vernerunde (tidspunkt, områder)\n2. Varsle ansatte i forkant\n3. Gjennomfør befaring med sjekkliste\n4. Dokumenter observasjoner\n5. Registrer avvik som oppdages\n6. Følg opp tiltak fra forrige runde\n7. Arkiver rapport",
    examples: "Kontorarbeidsplasser, verksted, lager, felles arealer",
    remember: "Gjennomføres minst årlig. Ta med ansatte for å få innspill.",
    is_predefined: true,
  },
  {
    id: "routine-5",
    routine_number: "R005",
    routine_name: "Førstehjelp og beredskap",
    category: "Sikkerhet",
    purpose: "Sikre rask og riktig respons ved ulykker, skader eller akutte situasjoner.",
    responsibility: "Alle ansatte skal kjenne til beredskapsrutiner. Utpekte førstehjelpere har spesielt ansvar.",
    procedure: "1. Førstehjelpsutstyr plassert tilgjengelig og merket\n2. Oversikt over førstehjelpere hengt opp\n3. Nødnumre synlig oppslått\n4. Årlig kontroll av utstyr\n5. Opplæring i førstehjelp for utpekte\n6. Øvelser gjennomføres årlig",
    examples: "Hjertestarter, førstehjelpskoffert, øyeskylling, brannslukkere",
    remember: "Alle skal vite hvor utstyret er og hvem som er førstehjelpere.",
    is_predefined: true,
  },
  {
    id: "routine-6",
    routine_number: "R006",
    routine_name: "Brannvern",
    category: "Sikkerhet",
    purpose: "Forebygge brann og sikre trygg evakuering ved brann.",
    responsibility: "Daglig leder har overordnet ansvar. Brannvernleder koordinerer det daglige arbeidet.",
    procedure: "1. Rømningsveier merket og frie\n2. Slukkeutstyr kontrollert årlig\n3. Brannøvelse minst årlig\n4. Nyansatte får brannvernopplæring\n5. Elektrisk anlegg kontrollert\n6. Varme arbeider kun med tillatelse\n7. Møteplass ved evakuering definert",
    examples: "Evakueringsøvelse, kontroll av slukkeutstyr, opplæring i bruk av slukker",
    remember: "Ved brann: Varsle - Redde - Slukke (hvis mulig) - Evakuere",
    is_predefined: true,
  },
  {
    id: "routine-7",
    routine_number: "R007",
    routine_name: "Årlig HMS-gjennomgang",
    category: "HMS-system",
    purpose: "Evaluere og forbedre HMS-arbeidet systematisk.",
    responsibility: "Daglig leder initierer. HMS-ansvarlig koordinerer gjennomføring.",
    procedure: "1. Gjennomgå HMS-mål og resultater\n2. Vurder status på handlingsplan\n3. Analyser avvik og hendelser\n4. Oppdater risikovurderinger\n5. Vurder rutiner og prosedyrer\n6. Sett mål for neste periode\n7. Dokumenter i årsrapport",
    examples: "Årlig ledelsens gjennomgang, HMS-dag med alle ansatte",
    remember: "Dokumentasjon av årlig gjennomgang er et krav i internkontrollforskriften.",
    is_predefined: true,
  },
  {
    id: "routine-8",
    routine_number: "R008",
    routine_name: "Sykefravær og oppfølging",
    category: "Ansatte",
    purpose: "Sikre god oppfølging av sykmeldte og forebygge langtidsfravær.",
    responsibility: "Leder følger opp den sykemeldte. HR/HMS støtter prosessen.",
    procedure: "1. Kontakt sykmeldt innen 2 uker\n2. Gjennomfør dialogmøte innen 7 uker\n3. Vurder tilrettelegging\n4. Dokumenter oppfølgingsplan\n5. Samarbeid med NAV ved behov\n6. Evaluer arbeidsmiljøfaktorer",
    examples: "Oppfølgingssamtaler, tilrettelegging av arbeidsoppgaver, gradert sykemelding",
    remember: "Tidlig kontakt og dialog er avgjørende for god oppfølging.",
    is_predefined: true,
  },
];

// Standard actions based on risks
// IMPORTANT: Only use roles that exist in the default organization:
// - Daglig leder/Arbeidsgiver
// - HMS-ansvarlig
// - Verneombud (may not exist in small companies)
// - Alle ansatte
export const defaultActions: DefaultAction[] = [
  {
    id: "action-1",
    risk_id: "risk-1",
    risk_description: "Ergonomiske belastninger ved kontorarbeid",
    action_description: "Gjennomføre ergonomiopplæring for alle ansatte",
    responsible: "HMS-ansvarlig",
    deadline: "",
    status: "ikke_startet",
    priority: "medium",
    comments: "Planlegges innen 3 måneder",
  },
  {
    id: "action-2",
    risk_id: "risk-2",
    risk_description: "Psykososiale belastninger og stress",
    action_description: "Innføre rutiner for arbeidsmiljøkartlegging",
    responsible: "Daglig leder",
    deadline: "",
    status: "ikke_startet",
    priority: "medium",
    comments: "Vurdere bruk av spørreskjema",
  },
  {
    id: "action-3",
    risk_id: "risk-3",
    risk_description: "Brann og evakuering",
    action_description: "Gjennomføre årlig brannøvelse",
    responsible: "HMS-ansvarlig",
    deadline: "",
    status: "ikke_startet",
    priority: "høy",
    comments: "Inkludere alle ansatte",
  },
  {
    id: "action-4",
    risk_id: "risk-4",
    risk_description: "Fall og snubling i lokaler",
    action_description: "Månedlig sjekk av gulvflater og kabler",
    responsible: "HMS-ansvarlig",
    deadline: "",
    status: "ikke_startet",
    priority: "lav",
    comments: "Inkluderes i vernerunde",
  },
];
