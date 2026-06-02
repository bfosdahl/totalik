import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { FAQ_HMS } from "../_shared/faq-knowledge.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `Du er HMS Proffen, en vennlig og svært kunnskapsrik maskot for et norsk internkontrollsystem (IK/HMS).
Du snakker alltid på norsk og er ekspert på:
1. Norsk HMS-lovgivning og regelverk (dette er din HOVEDSTYRKE)
2. Systemets funksjoner og navigasjon
3. Praktisk implementering av internkontroll

**VIKTIG: HVORDAN VELGE RIKTIG RESPONS:**

1. Hvis brukeren stiller et SPØRSMÅL OM LOVER, REGLER, RETTIGHETER eller HMS-faglige temaer (f.eks. sykefravær, oppsigelse, arbeidstid, egenmelding, verneombud, HMS-krav) → SVAR DIREKTE med din lovkunnskap. IKKE bruk verktøy. Gi et grundig, faglig svar med paragraf-referanser.

2. Hvis brukeren spør HVOR noe er i systemet eller hvordan de NAVIGERER → Bruk get_navigation_help verktøyet.

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

**SYSTEMETS NAVIGASJON OG SIDER:**

📊 DASHBORD (/)
- Hovedoversikt med statistikk, snarveier og varsler
- Viser åpne avvik, kommende frister, kursutløp

📋 HMS-MODULER (IK/HMS):
- Håndbok (/handbook) - HMS-håndboken med oversikt over hele HMS-systemet, tilsvarer IK-forskriftens §5
- Målsetting (/ik-hms/maal) - HMS-mål (IK-forskriftens §5 pkt. 4)
- Risikoanalyse (/risikoanalyse) - Risikovurderinger med 5x5 matrise, SJA, handlingsplan, rutiner (IK §5 pkt. 6)
- Organisering (/ik-hms/organisering) - Organisasjonskart, roller, ansvar (IK §5 pkt. 5)
- Rutiner (/ik-hms/rutiner) - HMS-rutiner og prosedyrer (IK §5 pkt. 7)
- Dokumentsenter (/ik-hms/dokumenter) - Opplastede dokumenter og maler
- Stoffkartotek (/ik-hms/stoffkartotek) - Kjemikalier og sikkerhetsdatablader (Kjemikalieforskriften)
- Lover og forskrifter (/lover-og-forskrifter) - Relevante lover for din bedrift (IK §5 pkt. 1)

👥 ANSATTE OG HR:
- Ansatte (/employees) - Ansattoversikt, kurs, HMS-kort, dokumenter (IK §5 pkt. 2 – kompetanse)
- Timeregistrering (/time-registration) - Timeføring for ansatte (AML §10 – arbeidstid)
- Stemplingsur (/time-clock) - QR-kode stempling inn/ut
- Fravær (/hr/absence) - Fraværsregistrering, sykefravær (AML §5-1)
- Ferie og fri (/time-off) - Feriesøknader og godkjenning
- Arbeidsplan (/work-schedule) - Vaktplaner og arbeidstid
- Møter (/hr/meetings) - Møteplanlegging og referater

⚠️ AVVIK OG REVISJONER:
- Avvik (/deviations) - Kvalitetsavvik og RUH/uønskede hendelser (IK §5 pkt. 7). Her kan du opprette nye avvik, tildele ansvarlig, sette frist, dokumentere umiddelbare tiltak, rotårsak og forebyggende tiltak.
- Revisjoner (/audits) - HMS-aktiviteter, vernerunder, internrevisjoner, el-kontroll (IK §5 pkt. 8)

🔧 KS-MODUL (Kvalitetssystem for bygg/anlegg):
- KS Dashboard (/ks2) - Prosjektoversikt
- Prosjekter - Byggeprosjekter med sjekklister, underleverandører, SHA-plan
- Sjekklister (/ks2/sjekklister) - KS-sjekklister for egenkontroll
- Underleverandører (/ks2/underleverandorer) - UE-register og dokumentasjon
- Avvik i prosjekt (/ks2/avvik) - Prosjektspesifikke avvik
- Møtereferater (/ks2/motereferater) - Byggemøter
- SHA-plan (/ks2/sha-plan) - Sikkerhet, helse og arbeidsmiljø (Byggherreforskriften)
- SJA (/ks2/sja) - Sikker jobb analyse
- Økonomi (/ks2/okonomi) - Prosjektøkonomi, endringsmeldinger
- Byggesak (/ks2/byggesak) - Byggesøknader og blanketter

🍽️ IK-MAT (Næringsmiddelbedrifter):
- Mat Dashboard - Oversikt for næringsmiddelbedrifter
- HACCP (/ik-mat/haccp) - Farepunkter og kritiske kontrollpunkter
- Sporbarhet (/ik-mat/sporbarhet) - Sporbarhet av råvarer
- Renholdsplan (/ik-mat/renholdsplan) - Renholdsrutiner
- Allergener (/ik-mat/allergener) - Allergenoversikt

⚙️ INNSTILLINGER (/settings):
- Bedriftsinformasjon - Logo, kontaktinfo
- Brukeradministrasjon - Legge til/fjerne brukere
- Avdelinger - Opprette avdelinger
- Varsler - E-postvarsler for frister
- Sikkerhet - Passord og 2FA

📱 ANDRE FUNKSJONER:
- Anonyme meldinger (/anonymous-messages) - Varsling uten avsender (AML §2-3 om varsling)
- Mitt kursbevis (/my-course-card) - Personlig kursoversikt
- Meldinger (/my/messages) - Interne meldinger
- Installer app (/install-app) - PWA-installasjon

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
- Du er IKKE en erstatning for juridisk rådgivning – oppfordre til å kontakte Arbeidstilsynet eller HMS-rådgiver ved komplekse saker`;

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
        const navigationMap = [
          { keywords: ["dashbord", "hjem", "oversikt", "start", "forside"], path: "/", name: "Dashbord", menuLocation: "Øverst i menyen til venstre", description: "Hovedoversikten med statistikk, snarveier og varsler" },
          { keywords: ["håndbok", "handbok", "hms-håndbok", "hms handbok"], path: "/handbook", name: "HMS-håndboken", menuLocation: "I menyen til venstre under «IK/HMS»", description: "Oversikt over hele HMS-systemet ditt" },
          { keywords: ["mål", "målsetting", "hms-mål", "hms mål"], path: "/ik-hms/maal", name: "Målsetting", menuLocation: "I menyen til venstre under «IK/HMS»", description: "HMS-mål for bedriften" },
          { keywords: ["risiko", "risikovurdering", "risikoanalyse", "farekilder", "sja", "handlingsplan"], path: "/risikoanalyse", name: "Risikoanalyse", menuLocation: "I menyen til venstre under «IK/HMS»", description: "Risikovurderinger, SJA, handlingsplan og rutiner" },
          { keywords: ["organisering", "organisasjon", "organisasjonskart", "roller", "ansvar", "verneombud"], path: "/ik-hms/organisering", name: "Organisering", menuLocation: "I menyen til venstre under «IK/HMS»", description: "Organisasjonskart, roller og ansvar" },
          { keywords: ["rutine", "rutiner", "prosedyre", "prosedyrer"], path: "/ik-hms/rutiner", name: "Rutiner", menuLocation: "I menyen til venstre under «IK/HMS»", description: "HMS-rutiner og prosedyrer" },
          { keywords: ["dokument", "dokumenter", "dokumentsenter", "filer", "opplasting"], path: "/ik-hms/dokumenter", name: "Dokumentsenter", menuLocation: "I menyen til venstre under «IK/HMS»", description: "Opplastede dokumenter og maler" },
          { keywords: ["stoff", "stoffkartotek", "kjemikalie", "kjemikalier", "sikkerhetsdatablad", "sds"], path: "/ik-hms/stoffkartotek", name: "Stoffkartotek", menuLocation: "I menyen til venstre under «IK/HMS»", description: "Kjemikalier og sikkerhetsdatablader" },
          { keywords: ["lov", "lover", "forskrift", "forskrifter", "regelverk"], path: "/lover-og-forskrifter", name: "Lover og forskrifter", menuLocation: "I menyen til venstre under «IK/HMS»", description: "Relevante lover og forskrifter for din bedrift" },
          { keywords: ["ansatt", "ansatte", "medarbeider", "personale", "kurs", "hms-kort", "sertifikat"], path: "/employees", name: "Ansatte", menuLocation: "I menyen til venstre under «HR / Ansatte»", description: "Ansattoversikt med kurs, HMS-kort og dokumenter" },
          { keywords: ["time", "timer", "timeregistrering", "timeføring", "timeliste"], path: "/time-registration", name: "Timeregistrering", menuLocation: "I menyen til venstre under «HR / Ansatte»", description: "Timeføring for ansatte" },
          { keywords: ["stempl", "stemplingsur", "qr", "inn/ut", "innsjekk"], path: "/time-clock", name: "Stemplingsur", menuLocation: "I menyen til venstre under «HR / Ansatte»", description: "QR-kode stempling inn/ut" },
          { keywords: ["fravær", "sykefravær", "sykdom", "sykemelding"], path: "/hr/absence", name: "Fravær", menuLocation: "I menyen til venstre under «HR / Ansatte»", description: "Fraværsregistrering og sykefravær" },
          { keywords: ["ferie", "fri", "permisjon", "feriesøknad"], path: "/time-off", name: "Ferie og fri", menuLocation: "I menyen til venstre under «HR / Ansatte»", description: "Feriesøknader og godkjenning" },
          { keywords: ["arbeidsplan", "vaktplan", "turnus", "arbeidstid"], path: "/work-schedule", name: "Arbeidsplan", menuLocation: "I menyen til venstre under «HR / Ansatte»", description: "Vaktplaner og arbeidstid" },
          { keywords: ["møte", "møter", "møtereferat"], path: "/hr/meetings", name: "Møter", menuLocation: "I menyen til venstre under «HR / Ansatte»", description: "Møteplanlegging og referater" },
          { keywords: ["avvik", "ruh", "uønsket hendelse", "kvalitetsavvik", "hendelse", "rapportere"], path: "/deviations", name: "Avvik", menuLocation: "I menyen til venstre – klikk på «Avvik» (under «IK/HMS» eller som eget punkt)", description: "Her registrerer og følger du opp kvalitetsavvik og uønskede hendelser (RUH). Du kan opprette nye avvik, tildele ansvarlig og sette frist." },
          { keywords: ["revisjon", "internrevisjon", "vernerunde", "hms-aktivitet", "el-kontroll", "elektro"], path: "/audits", name: "Revisjoner", menuLocation: "I menyen til venstre under «IK/HMS»", description: "HMS-aktiviteter, vernerunder, internrevisjoner" },
          { keywords: ["ks", "kvalitetssystem", "bygg", "prosjekt", "byggeprosjekt"], path: "/ks2", name: "KS-modul", menuLocation: "I menyen til venstre under «KS-modul»", description: "Kvalitetssystem for bygg og anlegg" },
          { keywords: ["sjekkliste", "egenkontroll", "kontrollpunkt"], path: "/ks2/sjekklister", name: "Sjekklister", menuLocation: "I menyen til venstre under «KS-modul»", description: "KS-sjekklister for egenkontroll" },
          { keywords: ["underleverandør", "ue", "underentreprenør"], path: "/ks2/underleverandorer", name: "Underleverandører", menuLocation: "I menyen til venstre under «KS-modul»", description: "UE-register og dokumentasjon" },
          { keywords: ["sha", "sha-plan", "sikkerhet helse arbeidsmiljø"], path: "/ks2/sha-plan", name: "SHA-plan", menuLocation: "I menyen til venstre under «KS-modul»", description: "Sikkerhet, helse og arbeidsmiljø på byggeplass" },
          { keywords: ["økonomi", "budsjett", "faktura", "endringsmelding"], path: "/ks2/okonomi", name: "Økonomi", menuLocation: "I menyen til venstre under «KS-modul»", description: "Prosjektøkonomi og endringsmeldinger" },
          { keywords: ["byggesak", "byggesøknad", "blankett", "skjema"], path: "/ks2/byggesak", name: "Byggesak", menuLocation: "I menyen til venstre under «KS-modul»", description: "Byggesøknader og blanketter" },
          { keywords: ["mat", "ik-mat", "næringsmiddel", "restaurant", "kjøkken"], path: "/ik-mat/dashboard", name: "IK-Mat", menuLocation: "I menyen til venstre under «IK-Mat»", description: "Internkontroll for næringsmiddelbedrifter" },
          { keywords: ["haccp", "farepunkt", "kritisk kontrollpunkt"], path: "/ik-mat/haccp", name: "HACCP", menuLocation: "I menyen til venstre under «IK-Mat»", description: "Farepunkter og kritiske kontrollpunkter" },
          { keywords: ["sporbarhet", "råvare", "ingrediens"], path: "/ik-mat/sporbarhet", name: "Sporbarhet", menuLocation: "I menyen til venstre under «IK-Mat»", description: "Sporbarhet av råvarer" },
          { keywords: ["renhold", "renholdsplan", "hygiene"], path: "/ik-mat/renholdsplan", name: "Renholdsplan", menuLocation: "I menyen til venstre under «IK-Mat»", description: "Renholdsrutiner" },
          { keywords: ["allergen", "allergener", "allergi"], path: "/ik-mat/allergener", name: "Allergener", menuLocation: "I menyen til venstre under «IK-Mat»", description: "Allergenoversikt" },
          { keywords: ["innstilling", "innstillinger", "oppsett", "konfigurasjon", "bedriftsinfo"], path: "/settings", name: "Innstillinger", menuLocation: "Helt nederst i menyen til venstre (tannhjul-ikon ⚙️)", description: "Bedriftsinformasjon, brukere, varsler" },
          { keywords: ["bruker", "brukere", "brukeradministrasjon", "tilgang", "rettigheter"], path: "/settings?tab=users", name: "Brukeradministrasjon", menuLocation: "Under «Innstillinger» (⚙️ nederst i menyen) → fanen «Brukere»", description: "Legge til og fjerne brukere" },
          { keywords: ["avdeling", "avdelinger", "filial"], path: "/settings?tab=departments", name: "Avdelinger", menuLocation: "Under «Innstillinger» (⚙️ nederst i menyen) → fanen «Avdelinger»", description: "Opprette og administrere avdelinger" },
          { keywords: ["varsel", "varsler", "e-post", "påminnelse", "notifikasjon"], path: "/settings?tab=notifications", name: "Varsler", menuLocation: "Under «Innstillinger» (⚙️ nederst i menyen) → fanen «Varsler»", description: "E-postvarsler for frister og påminnelser" },
          { keywords: ["anonym", "varsling", "si fra", "melde fra"], path: "/anonymous-messages", name: "Anonyme meldinger", menuLocation: "I menyen til venstre under «Annet»", description: "Varsling uten avsender" },
          { keywords: ["kursbevis", "mitt kurs", "mine kurs"], path: "/my-course-card", name: "Mitt kursbevis", menuLocation: "I menyen til venstre under «Mitt arbeidsforhold»", description: "Din personlige kursoversikt" },
          { keywords: ["melding", "meldinger", "intern melding", "sende melding"], path: "/my/messages", name: "Meldinger", menuLocation: "I menyen til venstre under «Mitt arbeidsforhold»", description: "Send og motta interne meldinger til kollegaer" },
          { keywords: ["installer", "app", "pwa", "mobil"], path: "/install-app", name: "Installer app", menuLocation: "I menyen til venstre under «Annet»", description: "Installer appen på telefonen" },
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
          }, { onConflict: "company_id" });

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
          }, { onConflict: "company_id" });

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
      
      // Get a friendly summary from the AI
      const summaryMessages = [
        { role: "system", content: "Du er HMS-hjelperen. Gi en kort, vennlig oppsummering av handlingene som ble utført. Bruk emojis." },
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
    const reply = assistantMessage?.content || "Beklager, jeg forstod ikke helt. Kan du prøve igjen?";

    console.log("Mascot chat response sent to user:", userId);

    return new Response(
      JSON.stringify({ reply }),
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
