import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { FAQ_HMS } from "../_shared/faq-knowledge.ts";
import { NAV_MAP } from "../_shared/nav-map.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `Du er HMS Proffen, en vennlig og svært kunnskapsrik maskot for et norsk internkontrollsystem (IK/HMS).
Du snakker alltid på norsk og er ekspert på:
1. Norsk HMS-lovgivning og regelverk (dette er din HOVEDSTYRKE)
2. Systemets funksjoner og navigasjon
3. Praktisk implementering av internkontroll

**NØKKELFAKTA (skal alltid følges):**
- Daglig leder/arbeidsgiver har plikt til å gjennomgå opplæring i HMS-arbeid etter arbeidsmiljøloven § 3-5. Kurset er typisk 6–7 timer (ingen fast timegrense i loven).
- 40-timers HMS-kurs gjelder KUN verneombud og medlemmer av arbeidsmiljøutvalg (AMU), jf. aml. § 6-5 og § 7-4. Skriv aldri at daglig leder må ta 40-timers kurs.
- Virksomheter med 5 eller flere arbeidstakere skal ha verneombud (aml. § 6-1). Under 5 kan partene avtale annen ordning.
- Systematisk HMS-arbeid: aml. § 3-1 og internkontrollforskriften.


**VIKTIG: HVORDAN VELGE RIKTIG RESPONS:**

1. Hvis brukeren stiller et SPØRSMÅL OM LOVER, REGLER, RETTIGHETER eller HMS-faglige temaer (f.eks. sykefravær, oppsigelse, arbeidstid, egenmelding, verneombud, HMS-krav) → SVAR DIREKTE med din lovkunnskap. IKKE bruk verktøy. Gi et grundig, faglig svar med paragraf-referanser. DETTE gjelder IKKE når brukeren i samme settning spør HOVO noe finnes i systemet – da er regel 2 gjeldende.

2. PLIKT: Hvis spørsmålet inneholder «hvor», «hvor finner jeg», «hvor i menyen», «hvor legger jeg inn», «hvor registrerer jeg», «hvor ser jeg», «hvordan kommer jeg meg til», «kan jeg», «finnes» eller «har systemet» → SVAR ALDRI generelt. Bruk get_navigation_help verktøyet (eller menykartet nedenfor) og oppgi den nøyaktige veien med gruppene og navnene i anførselstegn, f.eks. «Personaladministrasjon» → «Mine ansatte» → «Utstyr og klær». Det er FORBUDT å svare «mange digitale systemer har...», «spør din leder», «det kan ligge i et HMS-system», «i virksomhetens rutiner» eller lignende unnalesninger. Veien skal stå øverst i svaret, før eventuelle lovhenvisninger. Usikker på hva brukeren mener → still ett kort spørsmål, men gi likevel den mest sannsynlige veien.

**MODULENE I TOTAL-IK (eksakte navn i menyen til venstre):**
- «IK/HMS»: Oppsett, Målsetting, Organisering, Risikoanalyse (Risikovurdering & Handlingsplan, Oppfølging, SJA), Rutiner, Stoffkartotek, Lover og forskrifter, Avvik, HMS aktiviteter (vernerunde, revisjon, årshjul), Håndbok, Dokumentsenter, HMS Assistent.
- «Personaladministrasjon» (leder/admin): Ansattoversikt, Ansettelsesavtaler, Fravær, Utstyr og klær, Medarbeidersamtaler, Undersøkelser, Godkjenn ferie, Arbeidsplan, Søndagsrapport, Godkjenn timer, Timeføring, Timeoversikt, Personalliste (Skatteetaten), Anonyme meldinger.
- «Mitt arbeidsforhold» (alle ansatte): Min arbeidsavtale, Mine timer, Min ferie, Mitt fravær, Min respons, Meldinger, Send anonym melding, Kjørebok (med utlegg/reiseregning), Mitt ansattkort.
- «KS Bygg»: Mine prosjekter, Kunder, Oppsett-hjelper, Utfylte sjekklister, Befaring, Kalkyler, pluss internkontroll for KS (Målsetting/kvalitetsmål, Organisasjonsplan, Rutiner, Dokumentsenter, Sjekklistemaler, Egenerklæring, KS-håndbok). Alt prosjektarbeid (sjekklister, dagsrapport, avvik, SJA, bilder, SHA-plan, riggplan, byggesak, økonomi, endringsmeldinger, underleverandører, møter, sluttrapport) ligger INNE I PROSJEKTET: «KS Bygg» → «Mine prosjekter» → åpne prosjektet.
- «IK/MAT»: Oppsett, Håndbok, Målsetting, Organisasjonskart, Risiko & tiltak, Rutiner, Kontroll (temperatur, renhold, varemottak, runder), Sensorer, Avvik, Allergener, Kjøkkenplan, Faste avtaler, Dokumentsenter.
- «IK/Alkohol», «IK/FDV», «Personalhåndbok», «GDPR», «Åpenhetsloven» er egne moduler.
- Moduler bedriften ikke har kjøpt ligger nederst under «Flere moduler». Ser brukeren ikke en modul, har bedriften den trolig ikke, eller brukeren mangler rettighet (vanlige ansatte ser ikke «Personaladministrasjon»).
- Innstillinger (brukere, avdelinger, varsler) ligger øverst i menyen.
- Det heter ALDRI «KS-modul», «HR / Ansatte» eller «IK-Mat» – bruk navnene over.

**ALDRI SKRIV AT BRUKEREN "HAR FUNNET FREM", "HAR GJORT" ELLER "HAR LÆRT" NOE** – brukeren stiller et spørsmål om hjelp, og du skal svare direkte med HVOR tingen finnes og HVORDAN man gjør det, steg for steg. Eksempel:
- "Hvor registrerer jeg avvik?" → "Du registrerer avvik under «Avvik» i menyen til venstre. Trykk der på «Nytt avvik», fyll inn tittel, beskrivelse og kategori, og lagre. Jeg kan også opprette avviket for deg her – bare beskriv hva som har skjedd!"

3. Hvis brukeren ber deg GJØRE noe i systemet (registrere avvik, legge til risiko, osv.) → Bruk det relevante verktøyet.

**EKSEMPLER PÅ NÅR DU SKAL SVARE DIREKTE (IKKE bruk verktøy):**
- "Kan en nyansatt bli sykemeldt?" → Svar om folketrygdloven, opptjeningstid for sykepenger
- "Hva er reglene for overtid?" → Svar om AML §10
- "Må vi ha verneombud?" → Svar om AML §6-1
- "Hva er egenmelding?" → Svar om folketrygdloven §8-23 til §8-27
- "Kan arbeidsgiver nekte sykemelding?" → Svar om rettigheter ved sykdom
- "Hva er kravene til risikovurdering?" → Svar om IK-forskriften §5 pkt. 6

**HANDLINGER I SYSTEMET (bruk verktøy KUN når brukeren eksplisitt ber om det):**
- "Legg til risiko for arbeid i høyden" → Bruk add_risk_with_action
- "Opprett en rutine for førstehjelp" → Bruk add_routine
- "Registrer et avvik om manglende verneutstyr" → Bruk create_deviation
- "Legg til HMS-mål om nulltoleranse" → Bruk add_goal
- "Registrer kurs for en ansatt" → Bruk add_employee_course
Når du bruker et verktøy, forklar kort hva du gjør og bekreft når det er utført.

**HMS-LOVGIVNING OG REGELVERK**
Du er ekspert på følgende norske lover og forskrifter og skal kunne svare detaljert:

📕 ARBEIDSMILJØLOVEN (AML) – Lov om arbeidsmiljø, arbeidstid og stillingsvern:
- §1-1: Formål – sikre et arbeidsmiljø som gir full trygghet mot fysiske og psykiske skadevirkninger
- §2-1: Arbeidstakers medvirkningsplikt
- §2-3: Arbeidstakers varsling om kritikkverdige forhold
- §3-1: Krav til systematisk HMS-arbeid – arbeidsgiver skal sørge for at det utføres systematisk HMS-arbeid på alle plan
- §3-2: Særskilte forholdsregler for å ivareta sikkerheten
- §3-3: Bedriftshelsetjeneste – virksomheter i visse bransjer skal være tilknyttet godkjent BHT
- §4-1: Generelle krav til arbeidsmiljøet
- §4-2: Krav til tilrettelegging, medvirkning og utvikling
- §4-3: Psykososialt arbeidsmiljø – arbeidstaker skal ikke utsettes for trakassering, mobbing
- §4-4: Fysisk arbeidsmiljø – arbeidsplassen skal innrettes slik at arbeidstakerne er sikret
- §4-5: Kjemisk og biologisk helsefare
- §5-1: Registrering av skader og sykdom
- §6-1 til §6-5: Verneombud – alle virksomheter skal ha verneombud, valg, oppgaver, rettigheter
- §7-1 til §7-4: Arbeidsmiljøutvalg (AMU) – påbudt i virksomheter med minst 50 ansatte
- §10: Arbeidstid – alminnelig arbeidstid, overtid, nattarbeid, søndagsarbeid
- §14-9: Midlertidig ansettelse – vilkår
- §15: Opphør av arbeidsforhold – oppsigelse, avskjed, frister

📘 FOLKETRYGDLOVEN – SYKEPENGER OG FRAVÆR:
- §8-2: Opptjeningstid – arbeidstaker må ha vært ansatt i minst 4 uker for å ha rett til sykepenger fra arbeidsgiver. Ved sykemelding fra lege har man rett til sykepenger fra NAV fra dag 1 selv uten 4 ukers opptjening.
- §8-4: Arbeidsuførhet – sykepenger ytes til den som er arbeidsufør på grunn av sykdom eller skade
- §8-7: Dokumentasjon av sykdom – egenmelding eller legeerklæring
- §8-18: Arbeidsgiverperioden – arbeidsgiver betaler sykepenger de første 16 kalenderdagene
- §8-19: Beregning av sykepengegrunnlag
- §8-23 til §8-27: Egenmelding – rett til å bruke egenmelding etter 2 måneders ansettelse (4 ganger per 12 mnd, opptil 3 kalenderdager per gang). IA-bedrifter: 8 kalenderdager, 24 dager totalt per år.
- §8-34: Sykepenger fra NAV etter arbeidsgiverperioden (dag 17 og utover)
- §8-12: Maksimal sykepengeperiode – 52 uker
- Viktig: En NYANSATT som blir syk i andre uke KAN få sykemelding fra lege, men arbeidsgiver har IKKE plikt til å betale sykepenger før det har gått 4 uker (opptjeningstid). NAV kan utbetale sykepenger i stedet.
- Egenmelding krever 2 måneders ansettelse

📗 INTERNKONTROLLFORSKRIFTEN (IK-forskriften):
- §1: Formål – fremme HMS-arbeid gjennom systematisk internkontroll
- §3: Definisjon – systematiske tiltak som sikrer at aktivitetene planlegges, organiseres, utføres og vedlikeholdes
- §4: Plikt til internkontroll – den som er ansvarlig for virksomheten plikter å sørge for systematisk HMS-arbeid
- §5: Innholdet i internkontrollen – 8 krav:
  1. Sørge for at lover og forskrifter i HMS overholdes
  2. Sørge for at arbeidstakere har tilstrekkelig kunnskaper og ferdigheter
  3. Sørge for at arbeidstakere medvirker
  4. Fastsette mål for HMS
  5. Ha oversikt over virksomhetens organisasjon (ansvar, oppgaver, myndighet)
  6. Kartlegge farer og vurdere risiko (risikovurdering)
  7. Iverksette rutiner for å avdekke, rette opp og forebygge overtredelser
  8. Foreta systematisk overvåkning og gjennomgang av internkontrollen
- §5 pkt. 4-8 skal dokumenteres skriftlig

📘 FORSKRIFT OM ORGANISERING, LEDELSE OG MEDVIRKNING:
- Krav til opplæring av verneombud og AMU-medlemmer
- Krav til risikovurdering før arbeid igangsettes
- Krav til informasjon og opplæring av arbeidstakere

📙 PRODUKT- OG FORBRUKERTJENESTELOVEN (Produktloven):
- Krav til sikkerhet ved produkter og forbrukertjenester
- Meldeplikt til myndigheter ved farlige produkter/tjenester
- Relevant for virksomheter som produserer eller selger produkter

⚡ FORSKRIFT OM ELEKTRISKE LAVSPENNINGSANLEGG (FEL) OG EL-TILSYNSLOVEN:
- Krav til regelmessig kontroll av elektriske anlegg (el-kontroll)
- Termografering
- Krav til dokumentasjon av el-sikkerhet
- Samsvarserklæring for elektriske installasjoner
- Ansvar for eier/bruker av elektrisk anlegg

🔥 FORSKRIFT OM BRANNFOREBYGGING:
- §4: Plikter for eier av byggverk – brannteknisk sikkerhet
- §7-8: Kontroll og vedlikehold av brannsikringstiltak
- §11-12: Organisatoriske tiltak – brannøvelser, opplæring, rømningsplan

🏗️ BYGGHERREFORSKRIFTEN:
- Krav til SHA-plan (Sikkerhet, Helse og Arbeidsmiljø)
- Koordinering av HMS på bygge- og anleggsplasser
- Byggherrens ansvar og samordning

📋 FORSKRIFT OM UTFØRELSE AV ARBEID:
- Krav til arbeid i høyden, stillaser, kraner, løfteutstyr
- Krav til personlig verneutstyr (PVU)
- Arbeid med kjemikalier og biologiske faktorer
- Krav til sikker jobb analyse (SJA)

🧪 KJEMIKALIEFORSKRIFTEN OG REACH:
- Krav til sikkerhetsdatablad (SDS)
- Merking av kjemikalier (CLP)
- Stoffkartotek – alle virksomheter som bruker kjemikalier skal ha oppdatert stoffkartotek
- Substitusjonsplikten – plikt til å erstatte farlige kjemikalier med mindre farlige alternativer

📊 FORSKRIFT OM SYSTEMATISK HMS I VIRKSOMHETER (relatert):
- Aktivitetsforskriften
- Styringsforskriften
- Innretningsforskriften (for petroleumssektoren)

Når du svarer på lovspørsmål:
- Referer ALLTID til konkrete paragrafer (f.eks. "Ifølge AML §3-1...")
- Forklar kompliserte juridiske begreper på en enkel, forståelig måte
- Gi praktiske eksempler på hvordan lovkravet oppfylles i praksis
- Koble lovkrav til funksjoner i systemet ("For å oppfylle IK-forskriftens §5 pkt. 6 om risikovurdering, gå til Risikoanalyse i menyen")
- Oppfordre brukeren til å kontakte Arbeidstilsynet eller en HMS-rådgiver ved komplekse saker
- PRESISER at du ikke er en erstatning for profesjonell juridisk rådgivning

${NAV_MAP}

**Viktige regler for risikovurdering:**
- Sannsynlighet: 1 (svært lav) til 5 (svært høy)
- Konsekvens: 1 (ubetydelig) til 5 (katastrofal)
- Risiko = Sannsynlighet × Konsekvens
- Grønn (1-4): Akseptabel risiko
- Gul (5-12): Tiltak bør vurderes
- Rød (13-25): Kritisk - tiltak påkrevet, OBLIGATORISK revurdering etter tiltak

**VIKTIGE RETNINGSLINJER:**
- Svar alltid på norsk
- Vær konkret og praktisk i rådene dine
- Koble alltid lovkrav til praktisk bruk av systemet
- Bruk gjerne emojis for å gjøre svarene mer engasjerende
- Hold svarene fokuserte men grundige nok til å være nyttige
- Du er IKKE en erstatning for juridisk rådgivning – oppfordre til å kontakte Arbeidstilsynet eller HMS-rådgiver ved komplekse saker

---
OFFISIELL FAQ FOR SLUTTBRUKERE (bruk denne ordrett når noen spør om hvordan systemet fungerer, du kan omformulere men ikke endre faktainnholdet):

${FAQ_HMS}
`;

// Define tools for the AI to use
const tools = [
  {
    type: "function",
    function: {
      name: "get_navigation_help",
      description: "Gir brukeren veiledning om hvor de finner en bestemt funksjon eller side i systemet",
      parameters: {
        type: "object",
        properties: {
          search_term: {
            type: "string",
            description: "Hva brukeren leter etter (f.eks. 'risikovurdering', 'legge til ansatt', 'HMS-kort')"
          }
        },
        required: ["search_term"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_risk_with_action",
      description: "Legger til en ny risikovurdering med tilhørende tiltak/handlingsplan",
      parameters: {
        type: "object",
        properties: {
          risk_description: {
            type: "string",
            description: "Beskrivelse av risikoen/farekilen"
          },
          importance: {
            type: "string",
            enum: ["lav", "middels", "høy", "kritisk"],
            description: "Hvor viktig/alvorlig risikoen er (lav, middels, høy, kritisk)"
          },
          action_description: {
            type: "string",
            description: "Beskrivelse av tiltak for å redusere risikoen"
          },
          responsible: {
            type: "string",
            description: "Hvem som er ansvarlig for tiltaket"
          },
          deadline_days: {
            type: "number",
            description: "Antall dager til frist (standard: 30)"
          }
        },
        required: ["risk_description", "action_description"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_routine",
      description: "Legger til en ny rutine i HMS-systemet",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Tittel på rutinen"
          },
          category: {
            type: "string",
            description: "Kategori (f.eks. sikkerhet, førstehjelp, brann, etc.)"
          },
          content: {
            type: "string",
            description: "Innholdet/beskrivelsen av rutinen"
          },
          frequency: {
            type: "string",
            description: "Hvor ofte rutinen skal gjennomgås (daglig, ukentlig, månedlig, årlig)"
          }
        },
        required: ["title", "content"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_deviation",
      description: "Oppretter et nytt avvik/RUH i systemet",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Kort tittel på avviket"
          },
          description: {
            type: "string",
            description: "Detaljert beskrivelse av avviket"
          },
          category: {
            type: "string",
            enum: ["sikkerhet", "kvalitet", "miljø", "dokumentasjon", "prosess", "utstyr", "personell", "annet"],
            description: "Kategori for avviket (sikkerhet, kvalitet, miljø, dokumentasjon, prosess, utstyr, personell, annet)"
          },
          priority: {
            type: "string",
            enum: ["lav", "medium", "høy", "kritisk"],
            description: "Prioritet (lav, medium, høy, kritisk)"
          },
          immediate_actions: {
            type: "string",
            description: "Umiddelbare tiltak som er iverksatt"
          }
        },
        required: ["title", "description", "category"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_goal",
      description: "Legger til et nytt HMS-mål",
      parameters: {
        type: "object",
        properties: {
          goal_text: {
            type: "string",
            description: "Teksten for HMS-målet"
          }
        },
        required: ["goal_text"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_employee_course",
      description: "Registrerer et kurs for en ansatt",
      parameters: {
        type: "object",
        properties: {
          employee_name: {
            type: "string",
            description: "Navnet på den ansatte"
          },
          course_name: {
            type: "string",
            description: "Navn på kurset"
          },
          course_provider: {
            type: "string",
            description: "Kursleverandør"
          },
          completed_date: {
            type: "string",
            description: "Dato kurset ble fullført (YYYY-MM-DD)"
          },
          validity_years: {
            type: "number",
            description: "Antall år kurset er gyldig"
          }
        },
        required: ["employee_name", "course_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_employees",
      description: "Henter liste over ansatte i bedriften",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_risks",
      description: "Henter liste over risikovurderinger i bedriften",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_chemical",
      description: "Legger til et kjemikalie/stoff i stoffkartoteket",
      parameters: {
        type: "object",
        properties: {
          product_name: {
            type: "string",
            description: "Produktnavn"
          },
          supplier: {
            type: "string",
            description: "Leverandør"
          },
          usage_area: {
            type: "string",
            description: "Bruksområde"
          },
          hazard_symbols: {
            type: "array",
            items: { type: "string" },
            description: "Faresymboler (GHS01-GHS09)"
          },
          h_statements: {
            type: "array",
            items: { type: "string" },
            description: "H-setninger (faresetninger)"
          },
          p_statements: {
            type: "array",
            items: { type: "string" },
            description: "P-setninger (sikkerhetssetninger)"
          }
        },
        required: ["product_name"]
      }
    }
  }
];

// Function to execute tool calls
async function executeToolCall(
  supabase: any, 
  companyId: string, 
  userId: string, 
  toolName: string, 
  args: any
): Promise<string> {
  console.log(`Executing tool: ${toolName} with args:`, args);
  
  try {
    switch (toolName) {
      case "get_navigation_help": {
        const searchTerm = args.search_term.toLowerCase();
        
        // Navigation map with keywords and menu location
        const H = "Menyen til venstre → «IK/HMS»";
        const P = "Menyen til venstre → «Personaladministrasjon»";
        const M = "Menyen til venstre → «Mitt arbeidsforhold»";
        const KS = "Menyen til venstre → «KS Bygg»";
        const PRJ = "Menyen → «KS Bygg» → «Mine prosjekter» → åpne prosjektet →";
        const MAT = "Menyen til venstre → «IK/MAT»";
        const ALK = "Menyen til venstre → «IK/Alkohol»";
        const FDV = "Menyen til venstre → «IK/FDV»";
        const navigationMap = [
          { keywords: ["dashbord", "hjem", "oversikt", "forside", "start"], path: "/", name: "Dashbord", menuLocation: "Øverst i menyen til venstre", description: "Hovedoversikt med status, årshjul, varsler og snarveier" },
          { keywords: ["brukerveiledning", "hjelp", "veiledning", "manual"], path: "/brukerveiledning", name: "Brukerveiledning", menuLocation: "Øverst i menyen til venstre", description: "Veiledning til hele systemet" },
          { keywords: ["oppsett", "kom i gang", "ai-oppsett", "setup", "veiviser"], path: "/setup", name: "Oppsett (AI-veiviser)", menuLocation: `${H} → «Oppsett»`, description: "Lager mål, organisering, risiko og rutiner automatisk" },
          { keywords: ["mål", "målsetting", "hms-mål"], path: "/maalsetting", name: "Målsetting", menuLocation: `${H} → «Målsetting»`, description: "HMS-mål for bedriften" },
          { keywords: ["organisering", "organisasjon", "organisasjonskart", "roller", "ansvar", "verneombud", "amu"], path: "/organisering", name: "Organisering", menuLocation: `${H} → «Organisering»`, description: "Organisasjonskart, roller, verneombud og ansvar" },
          { keywords: ["risiko", "risikovurdering", "risikoanalyse", "farekilde", "handlingsplan", "tiltak"], path: "/risikoanalyse", name: "Risikoanalyse", menuLocation: `${H} → «Risikoanalyse» → «Risikovurdering & Handlingsplan»`, description: "Risikovurderinger og tiltak med ansvarlig og frist" },
          { keywords: ["oppfølging", "frister tiltak"], path: "/risikoanalyse?tab=oppfolging", name: "Oppfølging av tiltak", menuLocation: `${H} → «Risikoanalyse» → «Oppfølging»`, description: "Følg opp tiltak fra risikovurderingen" },
          { keywords: ["sja", "sikker jobb", "jobbanalyse"], path: "/risikoanalyse?tab=sja", name: "SJA", menuLocation: `${H} → «Risikoanalyse» → «SJA» (på byggeprosjekt: inne i prosjektet → «SJA»)`, description: "Sikker jobbanalyse med signaturer" },
          { keywords: ["rutine", "rutiner", "prosedyre"], path: "/rutiner", name: "Rutiner", menuLocation: `${H} → «Rutiner»`, description: "HMS-rutiner og prosedyrer" },
          { keywords: ["stoff", "stoffkartotek", "kjemikalie", "sikkerhetsdatablad", "sds", "datablad"], path: "/stoffkartotek", name: "Stoffkartotek", menuLocation: `${H} → «Stoffkartotek»`, description: "Kjemikalier, sikkerhetsdatablad og risikovurdering" },
          { keywords: ["lov", "lover", "forskrift", "regelverk"], path: "/lover-og-forskrifter", name: "Lover og forskrifter", menuLocation: `${H} → «Lover og forskrifter»`, description: "Regelverk som gjelder bedriften" },
          { keywords: ["avvik", "ruh", "uønsket hendelse", "hendelse", "skade", "nestenulykke"], path: "/deviations", name: "Avvik", menuLocation: `${H} → «Avvik» (avvik på byggeprosjekt: inne i prosjektet → «Avvik»; IK/MAT har egne under «IK/MAT» → «Avvik»)`, description: "Trykk «Nytt avvik», fyll inn og lagre. Jeg kan også opprette avviket for deg her i chatten." },
          { keywords: ["hms aktivitet", "hms-aktivitet", "vernerunde", "revisjon", "internrevisjon", "årshjul", "aktivitet"], path: "/audits", name: "HMS aktiviteter", menuLocation: `${H} → «HMS aktiviteter»`, description: "Vernerunder, internrevisjoner og årshjul (bla mellom år med ‹ ›)" },
          { keywords: ["håndbok", "hms-håndbok", "handbok"], path: "/handbook", name: "Håndbok (HMS)", menuLocation: `${H} → «Håndbok»`, description: "Samlet HMS-håndbok, kan lastes ned som PDF" },
          { keywords: ["dokument", "dokumenter", "dokumentsenter", "filer", "opplasting", "mappe"], path: "/dokumentsenter", name: "Dokumentsenter", menuLocation: `${H} → «Dokumentsenter» (KS Bygg, IK/MAT og IK/Alkohol har eget dokumentsenter i sin meny)`, description: "Last opp og finn bedriftens dokumenter" },
          { keywords: ["hms assistent", "hms-chat", "assistent"], path: "/hms-chat", name: "HMS Assistent", menuLocation: `${H} → «HMS Assistent»`, description: "Chat for HMS-spørsmål" },
          { keywords: ["ansatt", "ansatte", "ansattoversikt", "medarbeider", "kurs", "hms-kort", "invitere", "legg til ansatt"], path: "/employees", name: "Ansattoversikt", menuLocation: `${P} → «Ansattoversikt»`, description: "Ansatte, kurs, HMS-kort, invitasjoner og dokumenter" },
          { keywords: ["kontrakt", "arbeidsavtale", "ansettelsesavtale"], path: "/hr/contracts", name: "Ansettelsesavtaler", menuLocation: `${P} → «Ansettelsesavtaler» (ansatt: ${M} → «Min arbeidsavtale»)`, description: "Lag og signer arbeidsavtaler" },
          { keywords: ["fravær", "sykefravær", "sykemelding", "egenmelding"], path: "/hr/absence", name: "Fravær", menuLocation: `${P} → «Fravær» (ansatt: ${M} → «Mitt fravær»)`, description: "Registrering og oversikt over fravær" },
          { keywords: ["utstyr", "klær", "arbeidsklær", "verneutstyr", "verktøy"], path: "/hr/utstyr", name: "Utstyr og klær", menuLocation: `${P} → «Utstyr og klær»`, description: "Utstyr, klær og verktøy per ansatt, med nedlasting PDF/Excel" },
          { keywords: ["medarbeidersamtale", "samtale", "møte", "møter"], path: "/hr/meetings", name: "Medarbeidersamtaler", menuLocation: `${P} → «Medarbeidersamtaler»`, description: "Samtaler med maler og referat" },
          { keywords: ["undersøkelse", "spørreundersøkelse", "trivsel"], path: "/hr/surveys", name: "Undersøkelser", menuLocation: `${P} → «Undersøkelser» (ansatt: ${M} → «Min respons»)`, description: "Medarbeiderundersøkelser" },
          { keywords: ["ferie", "fri", "permisjon", "feriesøknad"], path: "/time-off", name: "Ferie", menuLocation: `Leder: ${P} → «Godkjenn ferie». Ansatt: ${M} → «Min ferie»`, description: "Søk og godkjenn ferie" },
          { keywords: ["arbeidsplan", "vaktplan", "vakt", "turnus", "skift", "vaktbytte"], path: "/work-schedule", name: "Arbeidsplan", menuLocation: `${P} → «Arbeidsplan»`, description: "Vaktplaner, skifteønsker og vaktbytte" },
          { keywords: ["søndag", "søndagsrapport", "søndagsarbeid"], path: "/hr/sondagsrapport", name: "Søndagsrapport", menuLocation: `${P} → «Søndagsrapport (AML §10-8)»`, description: "Kontroll av søndagsarbeid" },
          { keywords: ["time", "timer", "timeregistrering", "timeføring", "timeliste", "godkjenn timer", "overtid"], path: "/time-registration", name: "Timeføring", menuLocation: `Leder: ${P} → «Godkjenn timer» / «Timeføring» / «Timeoversikt». Ansatt: ${M} → «Mine timer»`, description: "Før timer på prosjekt, godkjenn og last ned rapport" },
          { keywords: ["stempl", "stemplingsur", "qr", "inn/ut", "innsjekk"], path: "/time-registration", name: "Stempling (QR)", menuLocation: `${M} → «Mine timer»`, description: "Stemple inn/ut med QR eller GPS/geogjerde" },
          { keywords: ["personalliste", "skatteetaten"], path: "/personalliste", name: "Personalliste", menuLocation: `${P} → «Personalliste (Skatteetaten)»`, description: "Lovpålagt personalliste" },
          { keywords: ["anonym", "varsling", "si fra", "melde fra", "varsle"], path: "/anonymous-messages", name: "Anonyme meldinger", menuLocation: `Les: ${P} → «Anonyme meldinger». Send: ${M} → «Send anonym melding»`, description: "Varsling uten avsender" },
          { keywords: ["kjørebok", "kjøring", "km", "gps", "bil", "reiseregning", "utlegg", "kvittering"], path: "/my/driving-log", name: "Kjørebok", menuLocation: `${M} → «Kjørebok»`, description: "Kjørebok med GPS, utlegg og reiseregning" },
          { keywords: ["ansattkort", "kursbevis", "mitt kort", "id-kort"], path: "/my/employee-card", name: "Mitt ansattkort", menuLocation: `${M} → «Mitt ansattkort»`, description: "Ditt ansattkort med kurs" },
          { keywords: ["melding", "meldinger", "oppslagstavle", "kunngjøring", "beskjed"], path: "/my/messages", name: "Meldinger", menuLocation: `${M} → «Meldinger» (oppslagstavla ligger på dashbordet)`, description: "Interne meldinger og oppslag" },
          { keywords: ["personalhåndbok"], path: "/personalhandbok", name: "Personalhåndbok", menuLocation: "Menyen til venstre → «Personalhåndbok»", description: "Bedriftens personalhåndbok" },
          { keywords: ["ks", "ks bygg", "byggeprosjekt", "prosjekt", "prosjekter"], path: "/ks", name: "Mine prosjekter", menuLocation: `${KS} → «Mine prosjekter»`, description: "Alle byggeprosjekter. Åpne et prosjekt for sjekklister, dagsrapport, avvik, SJA, bilder m.m." },
          { keywords: ["kunde", "kunder"], path: "/ks/kunder", name: "Kunder", menuLocation: `${KS} → «Kunder»`, description: "Kunderegister" },
          { keywords: ["befaring"], path: "/ks/befaring", name: "Befaring", menuLocation: `${KS} → «Befaring»`, description: "Befaringer" },
          { keywords: ["kalkyle", "kalkyler", "tilbud", "pris"], path: "/ks/kalkyler", name: "Kalkyler", menuLocation: `${KS} → «Kalkyler»`, description: "Kalkyler og tilbud" },
          { keywords: ["utfylte sjekklister"], path: "/ks/utfylte-sjekklister", name: "Utfylte sjekklister", menuLocation: `${KS} → «Utfylte sjekklister»`, description: "Alle ferdige sjekklister samlet, med søk og nedlasting" },
          { keywords: ["sjekkliste", "sjekklister", "egenkontroll", "sjekklistemal", "mal"], path: "/ks/ik-ks/sjekklister", name: "Sjekklistemaler", menuLocation: `Maler: ${KS} → «Sjekklistemaler». Fylle ut: ${PRJ} «Sjekklister»`, description: "Over 100 maler (våtrom, betong, tømrer, ansvar m.m.)" },
          { keywords: ["ks-håndbok", "kvalitetshåndbok"], path: "/ks/ik-ks/handbok", name: "KS-håndbok", menuLocation: `${KS} → «KS-håndbok»`, description: "Kvalitetshåndbok for byggesak" },
          { keywords: ["egenerklæring"], path: "/ks/ik-ks/egenerklaering", name: "Egenerklæring", menuLocation: `${KS} → «Egenerklæring»`, description: "Egenerklæring for ansvarsrett" },
          { keywords: ["oppsett-hjelper", "ks oppsett", "prosjekthjelper"], path: "/ks/oppsett", name: "Oppsett-hjelper", menuLocation: `${KS} → «Oppsett-hjelper»`, description: "AI-hjelp til å sette opp KS" },
          { keywords: ["dagsrapport", "dagbok", "dagrapport"], path: "/ks", name: "Dagsrapport", menuLocation: `${PRJ} «Dagsrapport»`, description: "Vær, bemanning, utført arbeid, plan for i morgen og bilder" },
          { keywords: ["bilde", "bilder", "foto", "dokumentere jobb"], path: "/ks", name: "Prosjektbilder", menuLocation: `${PRJ} «Bilder» (bilder kan også tas i dagsrapport, sjekklister og avvik)`, description: "Bilder knyttet til prosjektet" },
          { keywords: ["underleverandør", "ue", "underentreprenør"], path: "/ks", name: "Underleverandører", menuLocation: `${PRJ} «Underleverandører»`, description: "UE-register, dokumentasjon og evaluering" },
          { keywords: ["sha", "sha-plan", "riggplan", "hms-plan"], path: "/ks", name: "SHA-plan / Riggplan", menuLocation: `${PRJ} «SHA-plan» / «Riggplan»`, description: "SHA-plan med KU/KP-signatur og riggplan" },
          { keywords: ["økonomi", "budsjett", "faktura", "endringsmelding", "kostnad"], path: "/ks", name: "Økonomi og endringsmeldinger", menuLocation: `${PRJ} «Økonomi» / «Endringsmeldinger»`, description: "Kostnader, fakturaer og endringsmeldinger" },
          { keywords: ["byggesak", "byggesøknad", "blankett", "ansvarsrett", "gjennomføringsplan", "sak10"], path: "/ks", name: "Byggesak", menuLocation: `${PRJ} «Byggesak»`, description: "Blanketter (5174, 5181, 5167 m.fl.) sendt som PDF" },
          { keywords: ["geofence", "geogjerde"], path: "/ks", name: "Geogjerde", menuLocation: `${PRJ} prosjektinnstillinger/kart`, description: "Automatisk start/stopp av arbeidstid ved prosjektet" },
          { keywords: ["sluttrapport", "prosjektrapport", "møtereferat", "reklamasjon"], path: "/ks", name: "Rapporter i prosjekt", menuLocation: `${PRJ} «Rapport» / «Møter» / «Reklamasjoner»`, description: "Sluttrapport, møter og reklamasjoner" },
          { keywords: ["mat", "ik-mat", "ik/mat", "kjøkken", "restaurant", "næringsmiddel", "haccp"], path: "/ik-mat/handbok", name: "IK/MAT", menuLocation: MAT, description: "Oppsett, håndbok, mål, organisasjonskart, risiko & tiltak, rutiner, kontroll, sensorer, avvik, allergener, kjøkkenplan, faste avtaler, dokumentsenter" },
          { keywords: ["temperatur", "kontroll mat", "renhold", "renholdsplan", "varemottak", "sporbarhet", "runde"], path: "/ik-mat/kontroll", name: "Kontroll (IK/MAT)", menuLocation: `${MAT} → «Kontroll»`, description: "Temperatur, renhold, varemottak, sporbarhet og daglige runder" },
          { keywords: ["sensor", "sensorer", "temperaturmåler"], path: "/ik-mat/sensorer", name: "Sensorer", menuLocation: `${MAT} → «Sensorer»`, description: "Automatisk temperaturlogging" },
          { keywords: ["allergen", "allergener", "allergi"], path: "/ik-mat/allergener", name: "Allergener", menuLocation: `${MAT} → «Allergener»`, description: "Allergenoversikt" },
          { keywords: ["kjøkkenplan", "soner"], path: "/ik-mat/kjokkenplan", name: "Kjøkkenplan", menuLocation: `${MAT} → «Kjøkkenplan»`, description: "Tegning av kjøkkensoner" },
          { keywords: ["alkohol", "skjenking", "bevilling", "ik-alkohol"], path: "/ik-alkohol", name: "IK/Alkohol", menuLocation: ALK, description: "Rutiner, organisering, mål, risikoanalyse, internkontroll, kontroll, hendelser, lovverk, dokumentsenter, håndbok" },
          { keywords: ["fdv", "bygg og eiendom", "etasjeplan", "eiendom"], path: "/fdv", name: "IK/FDV", menuLocation: FDV, description: "Bygg og eiendommer, kontroller, risikovurdering, regelverk, etasjeplaner" },
          { keywords: ["gdpr", "personvern"], path: "/gdpr/oversikt", name: "GDPR", menuLocation: "Menyen til venstre → «GDPR»", description: "Oversikt, dokumentasjon og sjekkliste" },
          { keywords: ["åpenhetsloven", "aktsomhet", "redegjørelse"], path: "/apenhetsloven/oversikt", name: "Åpenhetsloven", menuLocation: "Menyen til venstre → «Åpenhetsloven»", description: "Aktsomhetsvurdering, innsyn og årlig redegjørelse" },
          { keywords: ["innstilling", "innstillinger", "bedriftsinfo", "logo"], path: "/settings", name: "Innstillinger", menuLocation: "Øverst i menyen til venstre → «Innstillinger»", description: "Bedriftsinfo, brukere, avdelinger, varsler" },
          { keywords: ["bruker", "brukere", "tilgang", "rettigheter", "rolle"], path: "/settings?tab=users", name: "Brukere", menuLocation: "«Innstillinger» → fanen «Brukere»", description: "Brukere og roller" },
          { keywords: ["avdeling", "avdelinger", "filial"], path: "/settings?tab=departments", name: "Avdelinger", menuLocation: "«Innstillinger» → fanen «Avdelinger»", description: "Avdelinger og avdelingsledere" },
          { keywords: ["varsel", "varsler", "påminnelse", "notifikasjon", "push"], path: "/settings?tab=notifications", name: "Varsler", menuLocation: "«Innstillinger» → fanen «Varsler»", description: "E-post- og push-varsler" },
          { keywords: ["kjøpe modul", "flere moduler", "låst", "mangler modul"], path: "/", name: "Flere moduler", menuLocation: "Nederst i menyen → «Flere moduler»", description: "Moduler bedriften ikke har ennå – kan bestilles av admin" },
          { keywords: ["installer", "app", "pwa", "mobil"], path: "/install-app", name: "Installer app", menuLocation: "Åpne totalik.no/install-app på telefonen", description: "Installer appen på telefonen" },
        ];

        // Find matching pages
        const matches = navigationMap.filter(page => 
          page.keywords.some(keyword => searchTerm.includes(keyword) || keyword.includes(searchTerm))
        );

        if (matches.length === 0) {
          return `🔍 Jeg fant ikke noe som matcher "${args.search_term}". Prøv å beskrive hva du vil gjøre, så hjelper jeg deg å finne riktig sted!`;
        }

        if (matches.length === 1) {
          const match = matches[0];
          return `📍 **${match.name}**\n\n👉 ${match.menuLocation}\n\n${match.description}`;
        }

        // Multiple matches
        const list = matches.slice(0, 4).map(m => `• **${m.name}** — ${m.menuLocation}\n  _${m.description}_`).join("\n\n");
        return `🔍 Jeg fant flere relevante steder:\n\n${list}\n\nHvilken av disse leter du etter?`;
      }

      case "add_risk_with_action": {
        // Map importance to probability/consequence values
        const importanceMap: Record<string, { probability: number; consequence: number; riskLevel: number }> = {
          "lav": { probability: 1, consequence: 2, riskLevel: 2 },
          "middels": { probability: 2, consequence: 3, riskLevel: 6 },
          "høy": { probability: 3, consequence: 4, riskLevel: 12 },
          "kritisk": { probability: 4, consequence: 5, riskLevel: 20 }
        };
        
        const importance = (args.importance || "middels").toLowerCase();
        const riskValues = importanceMap[importance] || importanceMap["middels"];
        
        // First get existing risks
        const { data: existingData } = await supabase
          .from("company_risk_assessments")
          .select("risks")
          .eq("company_id", companyId)
          .maybeSingle();

        const existingRisks = existingData?.risks || [];
        
        const newRisk = {
          id: crypto.randomUUID(),
          description: args.risk_description,
          probability: riskValues.probability,
          consequence: riskValues.consequence,
          riskLevel: riskValues.riskLevel,
          existingMeasures: "",
          suggestedMeasures: args.action_description,
          is_ai_generated: false
        };

        const updatedRisks = [...existingRisks, newRisk];

        // Upsert risk assessment
        const { error: riskError } = await supabase
          .from("company_risk_assessments")
          .upsert({
            company_id: companyId,
            risks: updatedRisks,
            updated_at: new Date().toISOString()
          }, { onConflict: "company_id,department_id" });

        if (riskError) throw riskError;

        // Create action plan followup
        const deadlineDays = args.deadline_days || 30;
        const followupDate = new Date();
        followupDate.setDate(followupDate.getDate() + deadlineDays);

        const { error: actionError } = await supabase
          .from("action_plan_followups")
          .insert({
            company_id: companyId,
            action_id: newRisk.id,
            action_description: args.action_description,
            risk_description: args.risk_description,
            followup_date: followupDate.toISOString().split('T')[0],
            followup_type: "verification",
            status: "pending",
            reminder_enabled: true,
            reminder_days_before: 7
          });

        if (actionError) throw actionError;

        const riskColor = riskValues.riskLevel <= 4 ? "grønn" : riskValues.riskLevel <= 12 ? "gul" : "rød";
        return `✅ Risiko "${args.risk_description}" er lagt til med viktighet: ${importance} (${riskColor}). Tiltak "${args.action_description}" er opprettet med frist om ${deadlineDays} dager.`;
      }

      case "add_routine": {
        // Get existing routines
        const { data: existingData } = await supabase
          .from("company_routines")
          .select("routines")
          .eq("company_id", companyId)
          .maybeSingle();

        const existingRoutines = existingData?.routines || [];
        
        const newRoutine = {
          id: crypto.randomUUID(),
          title: args.title,
          category: args.category || "generell",
          content: args.content,
          frequency: args.frequency || "ved behov",
          is_ai_generated: false,
          created_at: new Date().toISOString()
        };

        const updatedRoutines = [...existingRoutines, newRoutine];

        const { error } = await supabase
          .from("company_routines")
          .upsert({
            company_id: companyId,
            routines: updatedRoutines,
            updated_at: new Date().toISOString()
          }, { onConflict: "company_id,department_id" });

        if (error) throw error;
        return `✅ Rutine "${args.title}" er lagt til i HMS-systemet.`;
      }

      case "create_deviation": {
        // Map Norwegian categories to English database values
        const categoryMap: Record<string, string> = {
          "sikkerhet": "safety",
          "kvalitet": "quality",
          "miljø": "environment",
          "dokumentasjon": "documentation",
          "prosess": "process",
          "utstyr": "equipment",
          "personell": "personnel",
          "annet": "other"
        };
        
        // Map Norwegian priorities to English database values
        const priorityMap: Record<string, string> = {
          "lav": "low",
          "medium": "medium",
          "høy": "high",
          "kritisk": "critical"
        };

        // Generate deviation number
        const { count } = await supabase
          .from("deviations")
          .select("*", { count: "exact", head: true })
          .eq("company_id", companyId);

        const deviationNumber = `AVV-${String((count || 0) + 1).padStart(4, "0")}`;
        
        // Get user profile for reporter name (userId is now profile.id)
        const { data: reporterProfile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", userId)
          .single();
        
        const reporterFullName = reporterProfile 
          ? `${reporterProfile.first_name || ''} ${reporterProfile.last_name || ''}`.trim() || 'Ukjent'
          : 'Ukjent';

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);

        // Map category and priority from Norwegian to English
        const dbCategory = categoryMap[args.category?.toLowerCase()] || "other";
        const dbPriority = priorityMap[args.priority?.toLowerCase()] || "medium";

        const { error } = await supabase
          .from("deviations")
          .insert({
            company_id: companyId,
            deviation_number: deviationNumber,
            title: args.title,
            description: args.description,
            category: dbCategory,
            priority: dbPriority,
            immediate_actions: args.immediate_actions || "",
            reporter_id: userId, // Now correctly using profile.id
            reporter_name: reporterFullName,
            due_date: dueDate.toISOString().split('T')[0],
            status: "open"
          });

        if (error) throw error;
        return `✅ Avvik ${deviationNumber} "${args.title}" er opprettet med frist ${dueDate.toLocaleDateString("nb-NO")}.`;
      }

      case "add_goal": {
        const { error } = await supabase
          .from("company_goals")
          .insert({
            company_id: companyId,
            goal_text: args.goal_text,
            is_predefined: false
          });

        if (error) throw error;
        return `✅ HMS-mål "${args.goal_text}" er lagt til.`;
      }

      case "add_employee_course": {
        // Find employee by name - search in first_name and last_name
        const { data: employees } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .eq("company_id", companyId)
          .eq("is_active", true);

        // Filter employees by name match
        const searchName = args.employee_name.toLowerCase();
        const matchingEmployees = (employees || []).filter((e: any) => {
          const fullName = `${e.first_name || ''} ${e.last_name || ''}`.toLowerCase().trim();
          return fullName.includes(searchName) || searchName.includes(fullName);
        });

        if (matchingEmployees.length === 0) {
          return `❌ Fant ingen ansatt med navn "${args.employee_name}". Sjekk at navnet er riktig.`;
        }

        const employee = matchingEmployees[0];
        const employeeFullName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
        const completedDate = args.completed_date || new Date().toISOString().split('T')[0];
        
        let expiryDate = null;
        if (args.validity_years) {
          const expiry = new Date(completedDate);
          expiry.setFullYear(expiry.getFullYear() + args.validity_years);
          expiryDate = expiry.toISOString().split('T')[0];
        }

        const { error } = await supabase
          .from("employee_courses")
          .insert({
            company_id: companyId,
            employee_id: employee.id,
            course_name: args.course_name,
            course_provider: args.course_provider || "",
            completed_date: completedDate,
            expiry_date: expiryDate,
            validity_years: args.validity_years || null,
            status: "valid"
          });

        if (error) throw error;
        return `✅ Kurs "${args.course_name}" er registrert for ${employeeFullName}${expiryDate ? ` (gyldig til ${new Date(expiryDate).toLocaleDateString("nb-NO")})` : ""}.`;
      }

      case "list_employees": {
        const { data: employees } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("company_id", companyId)
          .eq("is_active", true)
          .order("first_name");

        if (!employees || employees.length === 0) {
          return "Ingen ansatte funnet i systemet.";
        }

        const list = employees.map((e: { first_name: string | null; last_name: string | null }) => 
          `- ${e.first_name || ''} ${e.last_name || ''}`.trim()
        ).join("\n");
        return `📋 Ansatte i bedriften:\n${list}`;
      }

      case "list_risks": {
        const { data } = await supabase
          .from("company_risk_assessments")
          .select("risks")
          .eq("company_id", companyId)
          .maybeSingle();

        const risks = data?.risks || [];
        if (risks.length === 0) {
          return "Ingen risikovurderinger funnet i systemet.";
        }

        const list = risks.slice(0, 10).map((r: any) => {
          const color = r.riskLevel <= 4 ? "🟢" : r.riskLevel <= 12 ? "🟡" : "🔴";
          return `${color} ${r.description} (nivå ${r.riskLevel})`;
        }).join("\n");
        
        return `📋 Risikovurderinger (${risks.length} totalt):\n${list}`;
      }

      case "add_chemical": {
        const { error } = await supabase
          .from("company_chemicals")
          .insert({
            company_id: companyId,
            product_name: args.product_name,
            supplier: args.supplier || "",
            usage_area: args.usage_area || "",
            hazard_symbols: args.hazard_symbols || [],
            h_statements: args.h_statements || [],
            p_statements: args.p_statements || [],
            status: "active"
          });

        if (error) throw error;
        return `✅ Kjemikalie "${args.product_name}" er lagt til i stoffkartoteket.`;
      }

      default:
        return `❌ Ukjent verktøy: ${toolName}`;
    }
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error);
    console.error("mascot-chat tool error:", error);
    return "❌ Handlingen kunne ikke fullføres. Prøv igjen.";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log("Unauthorized: No valid auth header");
      return new Response(
        JSON.stringify({ reply: "Du må være logget inn for å bruke HMS-hjelperen. 🔐" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user with Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData?.user) {
      console.log("Unauthorized: Invalid token", userError);
      return new Response(
        JSON.stringify({ reply: "Økten din har utløpt. Vennligst logg inn på nytt. 🔐" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = userData.user.id;
    console.log("Authenticated user for mascot chat:", userId);

    // Get user's company_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, company_id")
      .eq("user_id", userId)
      .single();

    if (!profile?.company_id) {
      return new Response(
        JSON.stringify({ reply: "Du må være tilknyttet en bedrift for å bruke denne funksjonen. 🏢" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const companyId = profile.company_id;

    const { message, history = [] } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-10),
      { role: "user", content: message }
    ];

    // First API call with tools
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        tools,
        tool_choice: "auto",
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            reply: "Beklager, jeg er litt opptatt akkurat nå. Prøv igjen om litt! 😅" 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            reply: "Jeg trenger en liten pause. Sjekk brukerveiledningen over for svar! 📖" 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message;

    // Check if the AI wants to call tools
    if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log("Tool calls requested:", assistantMessage.tool_calls.length);
      
      const toolResults: string[] = [];
      
      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);
        
        const result = await executeToolCall(supabase, companyId, profile.id, toolName, toolArgs);
        toolResults.push(result);
      }

      // Combine results into a response
      const combinedResult = toolResults.join("\n\n");

      // Navigation help: return the tool result verbatim – a second AI pass tends
      // to rephrase it into "du har funnet frem til ..." which is wrong.
      const onlyNavigation = assistantMessage.tool_calls.every(
        (tc: any) => tc.function.name === "get_navigation_help"
      );
      if (onlyNavigation) {
        return new Response(
          JSON.stringify({ reply: combinedResult, actions: toolResults }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get a friendly summary from the AI
      const summaryMessages = [
        { role: "system", content: "Du er HMS-hjelperen. Gi en kort, vennlig oppsummering av handlingene DU akkurat utførte for brukeren (f.eks. at et avvik ble opprettet). Beskriv aldri noe brukeren skal ha gjort selv. Bruk emojis." },
        { role: "user", content: `Handlinger utført:\n${combinedResult}\n\nGi en kort oppsummering til brukeren.` }
      ];

      const summaryResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: summaryMessages,
          max_tokens: 300,
        }),
      });

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        const summaryReply = summaryData.choices?.[0]?.message?.content;
        if (summaryReply) {
          return new Response(
            JSON.stringify({ reply: summaryReply, actions: toolResults }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Fallback to raw results
      return new Response(
        JSON.stringify({ reply: combinedResult, actions: toolResults }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // No tool calls, return the regular response
    let reply = assistantMessage?.content || "Beklager, jeg forstod ikke helt. Kan du prøve igjen?";
    let factCheck: { supported: number } | null = null;

    // Faktasjekk (Jev): bare når svaret viser til lov/forskrift/paragraf eller konkrete krav
    if (assistantMessage?.content && /§|forskrift|arbeidsmiljøloven|\blov(en)?\b|plikt|krav/i.test(reply)) {
      try {
        const fc = await fetch("https://ai.gateway.lovable.dev/v1/systemone", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
          body: JSON.stringify({
            model: "typesafe/jev-latest",
            state: { regelverk: systemPrompt.slice(0, 16000), faq: String(FAQ_HMS || "").slice(0, 6000), spørsmål: String(message).slice(0, 1000), svar: reply.slice(0, 3000) },
            questions: {
              supported: {
                type: "noul",
                instructions: "Støttes de konkrete påstandene om lover, paragrafer, frister, tall og plikter i `svar` av `regelverk` eller `faq`, eller er de allment kjent og korrekt norsk HMS-regelverk?",
                criteria: {
                  true: "Påstandene stemmer med kildene eller er korrekt, allment kjent regelverk.",
                  false: "Svaret inneholder paragrafnumre, frister, tall eller plikter som ikke støttes eller som motsier kildene.",
                },
              },
            },
          }),
        });
        if (fc.ok) {
          const n = (await fc.json())?.answers?.supported?.noul;
          if (typeof n === "number") {
            factCheck = { supported: n };
            if (n < 0.35) {
              reply += "\n\n⚠️ Jeg er ikke helt sikker på at alle detaljene over stemmer med regelverket. Sjekk gjerne lovdata.no eller spør verneombud/BHT før du handler på det.";
            }
          }
        } else {
          await fc.text();
        }
      } catch (e) {
        console.error("fact check skipped", e);
      }
    }

    console.log("Mascot chat response sent to user:", userId, factCheck);

    return new Response(
      JSON.stringify({ reply, factCheck }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Mascot chat error:", error);
    return new Response(
      JSON.stringify({ 
        reply: "Oops! Noe gikk galt. Sjekk brukerveiledningen over for svar, eller prøv igjen senere! 🔧" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
