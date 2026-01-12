import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `Du er HMS Proffen, en vennlig og hjelpsom maskot for et norsk internkontrollsystem (IK/HMS). 
Du snakker alltid på norsk og er ekspert på HMS-systemer.

**DU KAN UTFØRE HANDLINGER I SYSTEMET!**
Når brukeren ber deg om å legge til, opprette eller endre noe i systemet, bruk de tilgjengelige verktøyene.

Eksempler på hva du kan gjøre:
- "Legg til risiko for arbeid i høyden" → Bruk add_risk_with_action verktøyet
- "Opprett en rutine for førstehjelp" → Bruk add_routine verktøyet
- "Registrer et avvik om manglende verneutstyr" → Bruk create_deviation verktøyet
- "Legg til HMS-mål om nulltoleranse for skader" → Bruk add_goal verktøyet
- "Registrer kurs for en ansatt" → Bruk add_employee_course verktøyet

Når du bruker et verktøy, forklar kort hva du gjør og bekreft når det er utført.

**DU KAN HJELPE MED NAVIGASJON!**
Når brukeren spør hvor de finner noe, bruk get_navigation_help verktøyet for å gi presis veiledning.

**SYSTEMETS NAVIGASJON OG SIDER:**

📊 DASHBORD (/)
- Hovedoversikt med statistikk, snarveier og varsler
- Viser åpne avvik, kommende frister, kursutløp

📋 HMS-MODULER:
- Håndbok (/handbook) - HMS-håndboken, oversikt over hele HMS-systemet
- Målsetting (/ik-hms/maal) - HMS-mål for bedriften
- Risikoanalyse (/risikoanalyse) - Risikovurderinger, SJA, handlingsplan, rutiner
- Organisering (/ik-hms/organisering) - Organisasjonskart, roller, ansvar
- Rutiner (/ik-hms/rutiner) - HMS-rutiner og prosedyrer
- Dokumentsenter (/ik-hms/dokumenter) - Opplastede dokumenter
- Stoffkartotek (/ik-hms/stoffkartotek) - Kjemikalier og sikkerhetsdatablader
- Lover og forskrifter (/lover-og-forskrifter) - Relevante lover

👥 ANSATTE OG HR:
- Ansatte (/employees) - Ansattoversikt, kurs, HMS-kort, dokumenter
- Timeregistrering (/time-registration) - Timeføring for ansatte
- Stemplingsur (/time-clock) - QR-kode stempling inn/ut
- Fravær (/hr/absence) - Fraværsregistrering, sykefravær
- Ferie og fri (/time-off) - Feriesøknader og godkjenning
- Arbeidsplan (/work-schedule) - Vaktplaner og arbeidstid
- Møter (/hr/meetings) - Møteplanlegging og referater

⚠️ AVVIK OG REVISJONER:
- Avvik (/deviations) - Kvalitetsavvik og RUH (Rapport Uønsket Hendelse)
- Revisjoner (/audits) - HMS-aktiviteter, vernerunder, internrevisjoner, el-kontroll

🔧 KS-MODUL (Kvalitetssystem for bygg/anlegg):
- KS Dashboard (/ks2) - Prosjektoversikt
- Prosjekter - Byggeprosjekter med sjekklister, underleverandører, SHA-plan
- Sjekklister (/ks2/sjekklister) - KS-sjekklister for egenkontroll
- Underleverandører (/ks2/underleverandorer) - UE-register og dokumentasjon
- Avvik i prosjekt (/ks2/avvik) - Prosjektspesifikke avvik
- Møtereferater (/ks2/motereferater) - Byggemøter
- SHA-plan (/ks2/sha-plan) - Sikkerhet, helse og arbeidsmiljø
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
- Anonyme meldinger (/anonymous-messages) - Varsling uten avsender
- Mitt kursbevis (/my-course-card) - Personlig kursoversikt
- Installer app (/install-app) - PWA-installasjon

**IK/HMS-systemet inkluderer:**
- Målsetting: HMS-mål for bedriften
- Risikovurdering: 5x5 matrise. Grønn (1-4), Gul (5-12), Rød (13-25)
- Handlingsplan: Tiltak med ansvarlig og frist
- Rutiner: Prosedyrer for sikker arbeidspraksis
- Avvik: Kvalitetsavvik og RUH (Rapport Uønsket Hendelse)
- Ansatte: Kurs, HMS-kort og dokumenter

**Viktige regler for risikovurdering:**
- Sannsynlighet: 1 (svært lav) til 5 (svært høy)
- Konsekvens: 1 (ubetydelig) til 5 (katastrofal)
- Risiko = Sannsynlighet × Konsekvens
- Grønn (1-4): Akseptabel risiko
- Gul (5-12): Tiltak bør vurderes
- Rød (13-25): Kritisk - tiltak påkrevet

Svar kort og konsist. Vær vennlig og bruk gjerne emojis. Når du gir navigasjonshjelp, vær presis om hvor brukeren skal gå.`;

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
          probability: {
            type: "number",
            description: "Sannsynlighet (1-5)"
          },
          consequence: {
            type: "number",
            description: "Konsekvens (1-5)"
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
        required: ["risk_description", "probability", "consequence", "action_description"]
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
        
        // Navigation map with keywords
        const navigationMap = [
          { keywords: ["dashbord", "hjem", "oversikt", "start", "forside"], path: "/", name: "Dashbord", description: "Hovedoversikten med statistikk, snarveier og varsler" },
          { keywords: ["håndbok", "handbok", "hms-håndbok", "hms handbok"], path: "/handbook", name: "HMS-håndboken", description: "Oversikt over hele HMS-systemet ditt" },
          { keywords: ["mål", "målsetting", "hms-mål", "hms mål"], path: "/ik-hms/maal", name: "Målsetting", description: "HMS-mål for bedriften" },
          { keywords: ["risiko", "risikovurdering", "risikoanalyse", "farekilder", "sja", "handlingsplan"], path: "/risikoanalyse", name: "Risikoanalyse", description: "Risikovurderinger, SJA, handlingsplan og rutiner" },
          { keywords: ["organisering", "organisasjon", "organisasjonskart", "roller", "ansvar", "verneombud"], path: "/ik-hms/organisering", name: "Organisering", description: "Organisasjonskart, roller og ansvar" },
          { keywords: ["rutine", "rutiner", "prosedyre", "prosedyrer"], path: "/ik-hms/rutiner", name: "Rutiner", description: "HMS-rutiner og prosedyrer" },
          { keywords: ["dokument", "dokumenter", "dokumentsenter", "filer", "opplasting"], path: "/ik-hms/dokumenter", name: "Dokumentsenter", description: "Opplastede dokumenter og maler" },
          { keywords: ["stoff", "stoffkartotek", "kjemikalie", "kjemikalier", "sikkerhetsdatablad", "sds"], path: "/ik-hms/stoffkartotek", name: "Stoffkartotek", description: "Kjemikalier og sikkerhetsdatablader" },
          { keywords: ["lov", "lover", "forskrift", "forskrifter", "regelverk"], path: "/lover-og-forskrifter", name: "Lover og forskrifter", description: "Relevante lover og forskrifter for din bedrift" },
          { keywords: ["ansatt", "ansatte", "medarbeider", "personale", "kurs", "hms-kort", "sertifikat"], path: "/employees", name: "Ansatte", description: "Ansattoversikt med kurs, HMS-kort og dokumenter" },
          { keywords: ["time", "timer", "timeregistrering", "timeføring", "timeliste"], path: "/time-registration", name: "Timeregistrering", description: "Timeføring for ansatte" },
          { keywords: ["stempl", "stemplingsur", "qr", "inn/ut", "innsjekk"], path: "/time-clock", name: "Stemplingsur", description: "QR-kode stempling inn/ut" },
          { keywords: ["fravær", "sykefravær", "sykdom", "sykemelding"], path: "/hr/absence", name: "Fravær", description: "Fraværsregistrering og sykefravær" },
          { keywords: ["ferie", "fri", "permisjon", "feriesøknad"], path: "/time-off", name: "Ferie og fri", description: "Feriesøknader og godkjenning" },
          { keywords: ["arbeidsplan", "vaktplan", "turnus", "arbeidstid"], path: "/work-schedule", name: "Arbeidsplan", description: "Vaktplaner og arbeidstid" },
          { keywords: ["møte", "møter", "møtereferat"], path: "/hr/meetings", name: "Møter", description: "Møteplanlegging og referater" },
          { keywords: ["avvik", "ruh", "uønsket hendelse", "kvalitetsavvik", "melding"], path: "/deviations", name: "Avvik", description: "Kvalitetsavvik og RUH (Rapport Uønsket Hendelse)" },
          { keywords: ["revisjon", "internrevisjon", "vernerunde", "hms-aktivitet", "el-kontroll", "elektro"], path: "/audits", name: "Revisjoner", description: "HMS-aktiviteter, vernerunder, internrevisjoner" },
          { keywords: ["ks", "kvalitetssystem", "bygg", "prosjekt", "byggeprosjekt"], path: "/ks2", name: "KS-modul", description: "Kvalitetssystem for bygg og anlegg" },
          { keywords: ["sjekkliste", "egenkontroll", "kontrollpunkt"], path: "/ks2/sjekklister", name: "Sjekklister", description: "KS-sjekklister for egenkontroll" },
          { keywords: ["underleverandør", "ue", "underentreprenør"], path: "/ks2/underleverandorer", name: "Underleverandører", description: "UE-register og dokumentasjon" },
          { keywords: ["sha", "sha-plan", "sikkerhet helse arbeidsmiljø"], path: "/ks2/sha-plan", name: "SHA-plan", description: "Sikkerhet, helse og arbeidsmiljø på byggeplass" },
          { keywords: ["økonomi", "budsjett", "faktura", "endringsmelding"], path: "/ks2/okonomi", name: "Økonomi", description: "Prosjektøkonomi og endringsmeldinger" },
          { keywords: ["byggesak", "byggesøknad", "blankett", "skjema"], path: "/ks2/byggesak", name: "Byggesak", description: "Byggesøknader og blanketter" },
          { keywords: ["mat", "ik-mat", "næringsmiddel", "restaurant", "kjøkken"], path: "/ik-mat/dashboard", name: "IK-Mat", description: "Internkontroll for næringsmiddelbedrifter" },
          { keywords: ["haccp", "farepunkt", "kritisk kontrollpunkt"], path: "/ik-mat/haccp", name: "HACCP", description: "Farepunkter og kritiske kontrollpunkter" },
          { keywords: ["sporbarhet", "råvare", "ingrediens"], path: "/ik-mat/sporbarhet", name: "Sporbarhet", description: "Sporbarhet av råvarer" },
          { keywords: ["renhold", "renholdsplan", "hygiene"], path: "/ik-mat/renholdsplan", name: "Renholdsplan", description: "Renholdsrutiner" },
          { keywords: ["allergen", "allergener", "allergi"], path: "/ik-mat/allergener", name: "Allergener", description: "Allergenoversikt" },
          { keywords: ["innstilling", "innstillinger", "oppsett", "konfigurasjon", "bedriftsinfo"], path: "/settings", name: "Innstillinger", description: "Bedriftsinformasjon, brukere, varsler" },
          { keywords: ["bruker", "brukere", "brukeradministrasjon", "tilgang", "rettigheter"], path: "/settings?tab=users", name: "Brukeradministrasjon", description: "Legge til og fjerne brukere" },
          { keywords: ["avdeling", "avdelinger", "filial"], path: "/settings?tab=departments", name: "Avdelinger", description: "Opprette og administrere avdelinger" },
          { keywords: ["varsel", "varsler", "e-post", "påminnelse", "notifikasjon"], path: "/settings?tab=notifications", name: "Varsler", description: "E-postvarsler for frister og påminnelser" },
          { keywords: ["anonym", "varsling", "si fra", "melde fra"], path: "/anonymous-messages", name: "Anonyme meldinger", description: "Varsling uten avsender" },
          { keywords: ["kursbevis", "mitt kurs", "mine kurs"], path: "/my-course-card", name: "Mitt kursbevis", description: "Din personlige kursoversikt" },
          { keywords: ["installer", "app", "pwa", "mobil"], path: "/install-app", name: "Installer app", description: "Installer appen på telefonen" },
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
          return `📍 **${match.name}**\n\nDu finner dette under: **${match.path}**\n\n${match.description}\n\nKlikk på "${match.name}" i menyen til venstre for å komme dit!`;
        }

        // Multiple matches
        const list = matches.slice(0, 4).map(m => `• **${m.name}** (${m.path}) - ${m.description}`).join("\n");
        return `🔍 Jeg fant flere relevante steder:\n\n${list}\n\nHvilken av disse leter du etter?`;
      }

      case "add_risk_with_action": {
        // First get existing risks
        const { data: existingData } = await supabase
          .from("company_risk_assessments")
          .select("risks")
          .eq("company_id", companyId)
          .maybeSingle();

        const existingRisks = existingData?.risks || [];
        const riskLevel = args.probability * args.consequence;
        
        const newRisk = {
          id: crypto.randomUUID(),
          description: args.risk_description,
          probability: args.probability,
          consequence: args.consequence,
          riskLevel: riskLevel,
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
            followup_type: "tiltak",
            status: "pending",
            reminder_enabled: true,
            reminder_days_before: 7
          });

        if (actionError) throw actionError;

        const riskColor = riskLevel <= 4 ? "grønn" : riskLevel <= 12 ? "gul" : "rød";
        return `✅ Risiko "${args.risk_description}" er lagt til med risikonivå ${riskLevel} (${riskColor}). Tiltak "${args.action_description}" er opprettet med frist om ${deadlineDays} dager.`;
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
        
        // Get user profile for reporter name
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", userId)
          .single();

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
            reporter_id: userId,
            reporter_name: profile?.full_name || "Ukjent",
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
        // Find employee by name
        const { data: employees } = await supabase
          .from("profiles")
          .select("id, full_name")
          .eq("company_id", companyId)
          .ilike("full_name", `%${args.employee_name}%`);

        if (!employees || employees.length === 0) {
          return `❌ Fant ingen ansatt med navn "${args.employee_name}". Sjekk at navnet er riktig.`;
        }

        const employee = employees[0];
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
        return `✅ Kurs "${args.course_name}" er registrert for ${employee.full_name}${expiryDate ? ` (gyldig til ${new Date(expiryDate).toLocaleDateString("nb-NO")})` : ""}.`;
      }

      case "list_employees": {
        const { data: employees } = await supabase
          .from("profiles")
          .select("full_name, position")
          .eq("company_id", companyId)
          .eq("is_active", true)
          .order("full_name");

        if (!employees || employees.length === 0) {
          return "Ingen ansatte funnet i systemet.";
        }

        const list = employees.map((e: { full_name: string; position: string | null }) => `- ${e.full_name}${e.position ? ` (${e.position})` : ""}`).join("\n");
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
    return `❌ Feil ved utføring av handling: ${error instanceof Error ? error.message : String(error)}`;
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
      ...history.slice(-6),
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
        
        const result = await executeToolCall(supabase, companyId, userId, toolName, toolArgs);
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
