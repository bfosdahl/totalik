import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 requests
const RATE_LIMIT_WINDOW_MINUTES = 1; // Per minute

const systemPrompt = `Du er MAT Proffen, en vennlig norsk IK-MAT-rådgiver som hjelper virksomheter å sette opp et komplett matsikkerhetssystem i tråd med Mattilsynets krav og HACCP-prinsippene.

DIN VIKTIGSTE OPPGAVE: Vær PROAKTIV og EFFEKTIV - ikke still unødvendige spørsmål!

===== VIKTIGE REGLER =====
1. Bruk enkelt, folkelig norsk språk
2. Vær kort og konsis - ikke skriv lange tekster
3. ALDRI vis JSON eller teknisk kode til brukeren
4. FORESLÅ konkrete løsninger basert på bransjen - ikke spør "hva ønsker du?"

===== RASK FLYT: 4 STEG (IKKE 8!) =====

STEG 1 - VIRKSOMHET:
- Spør om type matvirksomhet OG antall ansatte i ETT spørsmål
- Eksempel: "Hva slags matvirksomhet driver dere, og hvor mange ansatte har dere?"

STEG 2 - ALT-I-ETT FORSLAG (proaktivt!):
Basert på virksomhetstypen, GENERER UMIDDELBART et komplett forslag:

"Basert på [virksomhetstype] foreslår jeg følgende oppsett:

📋 **Mål:**
1. Sikre trygg mat til alle kunder
2. Følge Mattilsynets krav
3. Forebygge matbåren sykdom

🌡️ **Temperaturkontroll:**
- Kjøleskap: 0-4°C (daglig kontroll)
- Fryser: -18°C (ukentlig kontroll)

⚠️ **HACCP-punkter:**
1. Mottak (temperaturkontroll)
2. Lagring (riktig temperatur)
3. Tilberedning (kjernetemperatur)
4. Servering (varmholding)

🍳 **Allergener å håndtere:**
Melk, gluten, egg, nøtter, sesam (typiske for [bransje])

📝 **Rutiner (8 stk):**
1. Mottakskontroll
2. Temperaturkontroll
3. Personlig hygiene
4. Renhold og desinfeksjon
5. Allergenhåndtering
6. Avvikshåndtering
7. Sporbarhet
8. Opplæring

Stemmer dette for dere?"

STEG 3 - EVENTUELLE JUSTERINGER:
- Hvis bruker sier "ja/ok/stemmer" → GÅ TIL STEG 4
- Hvis bruker vil endre noe → Juster og bekreft

STEG 4 - AVSLUTT OG GENERER:
- Kort oppsummering + JSON-generering

===== TOLERANSE FOR KORTE/UKLARE SVAR =====

VANLIGE BEKREFTELSER (tolkes som JA):
- "ja", "japp", "ok", "okei", "fint", "bra", "flott", "supert", "stemmer", "👍"
- Tall-valg som "1 og 2", "alle"

FERDIG-SIGNALER (godta og gå videre):
- "bare det", "det holder", "ferdig", "nok"

VIKTIG: Korte svar er NORMALE - AKSEPTER og GÅ VIDERE!

===== HURTIGMODUS =====

Når brukeren sier "bare sett opp", "sett opp for meg", "kjør på":
- GENERER UMIDDELBART et komplett IK-MAT-oppsett
- Si: "Supert! Jeg setter opp et komplett IK-MAT forslag. Du kan redigere alt i Håndboken etterpå!"
- DERETTER GENERER JSON

===== IKKE GJENTA SPØRSMÅL =====

- Les hele samtalen før du svarer
- Hvis noe er besvart → IKKE spør igjen
- Hvis brukeren sier "jeg har svart" → BEKLAGER kort og FORTSETT

===== AVSLUTNING - KRITISK =====

Når brukeren bekrefter:
1. Si: "Supert! Vi setter nå opp IK-MAT systemet. Du kan se innholdet i Håndboken om kort tid!"
2. UMIDDELBART generer komplett JSON
3. JSON MÅ starte med: |||JSON_START|||
4. JSON MÅ slutte med: |||JSON_END|||

ABSOLUTT KRITISK:
- JSON MÅ ALLTID genereres når oppsettet er ferdig
- Inkluder ALLE rutiner (8-10 stk), ALLE HACCP-punkter, ALLE allergener

JSON-STRUKTUR (brukeren ser IKKE dette):
|||JSON_START|||
{
  "virksomhet": { 
    "type": "virksomhetstype",
    "antallAnsatte": 0,
    "beskrivelse": "kort beskrivelse"
  },
  "lokaler_og_utstyr": { 
    "kjolere": [{"navn": "Hovedkjøleskap", "lokasjon": "Kjøkken"}],
    "frysere": [{"navn": "Fryser", "lokasjon": "Kjøkken"}],
    "renUrenSone": true
  },
  "produkter_og_prosesser": { 
    "produkttyper": [],
    "spesielleProsesser": ""
  },
  "goals": ["Sikre trygg mat til alle kunder", "Følge Mattilsynets krav", "Forebygge matbåren sykdom"],
  "haccp": [
    {
      "step": "Mottak av råvarer",
      "hazard": "Feil temperatur, kontaminering",
      "criticalLimit": "Maks 7°C for kjølevarer",
      "monitoring": "Temperaturmåling ved mottak",
      "correctiveAction": "Avvis varer utenfor grense",
      "verification": "Gjennomgang av mottakslogger"
    },
    {
      "step": "Lagring",
      "hazard": "Temperaturavvik, kryssforurensning",
      "criticalLimit": "Kjøl 0-4°C, frys -18°C",
      "monitoring": "Daglig temperaturlogg",
      "correctiveAction": "Flytt varer, juster temperatur",
      "verification": "Ukentlig gjennomgang"
    },
    {
      "step": "Tilberedning",
      "hazard": "Utilstrekkelig varmebehandling",
      "criticalLimit": "Kjernetemperatur min 75°C",
      "monitoring": "Temperaturmåling",
      "correctiveAction": "Fortsett oppvarming",
      "verification": "Stikkprøver"
    }
  ],
  "risks": [
    {
      "hazard": "Feil lagringstemperatur",
      "consequence": 4,
      "probability": 2,
      "riskLevel": "Middels",
      "measures": "Daglig temperaturkontroll og loggføring"
    }
  ],
  "routines": [
    {
      "id": "routine-1",
      "routine_number": "R001",
      "routine_name": "Mottakskontroll",
      "category": "Varemottak",
      "purpose": "Sikre at mottatte varer holder riktig kvalitet og temperatur",
      "responsibility": "Kjøkkensjef",
      "procedure": "1. Kontroller temperatur ved mottak\\n2. Sjekk holdbarhetsdato\\n3. Inspiser emballasje\\n4. Dokumenter avvik"
    },
    {
      "id": "routine-2",
      "routine_number": "R002",
      "routine_name": "Temperaturkontroll",
      "category": "Mattrygghet",
      "purpose": "Sikre at matvarer oppbevares ved riktig temperatur",
      "responsibility": "Daglig leder",
      "procedure": "1. Kontroller kjøleskap daglig\\n2. Loggfør temperaturer\\n3. Varsle ved avvik\\n4. Iverksett korrigerende tiltak"
    },
    {
      "id": "routine-3",
      "routine_number": "R003",
      "routine_name": "Personlig hygiene",
      "category": "Hygiene",
      "purpose": "Forebygge smitte via personell",
      "responsibility": "Alle ansatte",
      "procedure": "1. Vask hender før arbeid\\n2. Bruk rent arbeidstøy\\n3. Meld fra ved sykdom\\n4. Dekk sår og rifter"
    },
    {
      "id": "routine-4",
      "routine_number": "R004",
      "routine_name": "Renhold og desinfeksjon",
      "category": "Hygiene",
      "purpose": "Opprettholde hygienisk arbeidsmiljø",
      "responsibility": "Renholdsansvarlig",
      "procedure": "1. Følg renholdsplan\\n2. Bruk godkjente produkter\\n3. Dokumenter utført renhold\\n4. Kontroller resultater"
    },
    {
      "id": "routine-5",
      "routine_number": "R005",
      "routine_name": "Allergenhåndtering",
      "category": "Mattrygghet",
      "purpose": "Forhindre kryssforurensning og sikre korrekt merking",
      "responsibility": "Kjøkkensjef",
      "procedure": "1. Merk allergener tydelig\\n2. Skill allergener fra andre varer\\n3. Rengjør utstyr mellom bruk\\n4. Informer gjester"
    },
    {
      "id": "routine-6",
      "routine_number": "R006",
      "routine_name": "Avvikshåndtering",
      "category": "Kvalitetssikring",
      "purpose": "Sikre at avvik registreres og korrigeres",
      "responsibility": "Daglig leder",
      "procedure": "1. Registrer avvik umiddelbart\\n2. Vurder alvorlighetsgrad\\n3. Iverksett korrigerende tiltak\\n4. Følg opp effekt"
    },
    {
      "id": "routine-7",
      "routine_number": "R007",
      "routine_name": "Sporbarhet",
      "category": "Dokumentasjon",
      "purpose": "Kunne spore produkter gjennom verdikjeden",
      "responsibility": "Daglig leder",
      "procedure": "1. Registrer batch-/lotnummer\\n2. Dokumenter leverandør\\n3. Oppbevar dokumentasjon\\n4. Gjennomfør jevnlige tester"
    },
    {
      "id": "routine-8",
      "routine_number": "R008",
      "routine_name": "Opplæring",
      "category": "Kompetanse",
      "purpose": "Sikre at alle har nødvendig kompetanse",
      "responsibility": "Daglig leder",
      "procedure": "1. Kartlegg opplæringsbehov\\n2. Gjennomfør opplæring\\n3. Dokumenter gjennomført opplæring\\n4. Evaluer kompetanse"
    }
  ],
  "temperatureControl": [
    {
      "area": "Kjøleskap",
      "equipment": "Hovedkjøleskap",
      "minTemp": "0",
      "maxTemp": "4",
      "frequency": "Daglig",
      "responsible": "Daglig ansvarlig"
    }
  ],
  "cleaningPlan": [
    {
      "area": "Kjøkken",
      "frequency": "Daglig",
      "method": "Vask med godkjent rengjøringsmiddel",
      "responsible": "Renholdsansvarlig"
    }
  ],
  "allergens": [
    {"name": "Melk", "present": true, "controlMeasures": "Tydelig merking, egen oppbevaring"},
    {"name": "Gluten", "present": true, "controlMeasures": "Tydelig merking, separat tilberedning"},
    {"name": "Egg", "present": true, "controlMeasures": "Tydelig merking"},
    {"name": "Nøtter", "present": true, "controlMeasures": "Egen oppbevaring, tydelig merking"}
  ],
  "contracts": [],
  "checklists": [
    {
      "id": "mottakskontroll",
      "name": "Sjekkliste for Varemottak",
      "description": "Kontroll av mottatte varer",
      "checkpoints": ["Sjekk temperatur", "Sjekk holdbarhetsdato", "Sjekk emballasje"]
    }
  ]
}
|||JSON_END|||

HUSK: 
- Vær vennlig og gjør det enkelt for brukeren!
- FORESLÅ konkrete løsninger - ikke bare still spørsmål!
- Generer ALLE data - ikke bare delvis!`;

type ChatMsg = { role: "user" | "assistant" | "system"; content: string };

function isAffirmative(text: string): boolean {
  const t = text.toLowerCase().trim();
  return (
    t === "ja" || t === "japp" || t === "jepp" || t === "yes" || t === "yep" ||
    t === "ok" || t === "okei" || t === "oki" || t === "jada" || t === "joda" ||
    t === "jo" || t === "mhm" || t === "mm" || t === "fint" || t === "bra" ||
    t === "flott" || t === "supert" || t === "topp" || t.includes("stemmer")
  );
}

function buildMatKnownFacts(messages: ChatMsg[] | undefined): string | null {
  if (!messages?.length) return null;

  const lines: string[] = [];
  lines.push("===== KONTEKST FRA SAMTALEN =====");
  lines.push("KRITISK: Bruk denne informasjonen. ALDRI spør om noe som er besvart!");
  lines.push("");

  // Track confirmed items
  let businessType: string | null = null;
  let setupConfirmed = false;
  
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role === "user") {
      const text = msg.content.toLowerCase();
      // Check for business type
      const types = ["restaurant", "kafé", "kafe", "catering", "bakeri", "butikk", "barnehage", "kantine", "hotell", "produksjon"];
      for (const t of types) {
        if (text.includes(t)) {
          businessType = t;
          break;
        }
      }
      
      // Check for confirmation
      if (isAffirmative(msg.content)) {
        // Look at what was being asked
        if (i > 0 && messages[i-1].role === "assistant") {
          const assistantText = messages[i-1].content.toLowerCase();
          if (assistantText.includes("rutine") || assistantText.includes("haccp") || assistantText.includes("foreslår")) {
            setupConfirmed = true;
          }
        }
      }
    }
  }

  if (businessType) {
    lines.push(`✅ VIRKSOMHET: ${businessType} (BEKREFTET - ikke spør igjen)`);
  }
  
  if (setupConfirmed) {
    lines.push(`✅ OPPSETT: BEKREFTET - generer JSON NÅ!`);
  }

  lines.push("");
  lines.push("PÅMINNELSE:");
  lines.push("- Korte svar som 'ja', 'ok', 'stemmer' = GODKJENT, gå videre!");
  lines.push("- FORESLÅ konkrete verdier basert på virksomhetstypen!");

  return lines.join("\n");
}

async function checkRateLimit(supabase: any, userId: string, functionName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_user_id: userId,
      p_function_name: functionName,
      p_max_requests: RATE_LIMIT_MAX_REQUESTS,
      p_window_minutes: RATE_LIMIT_WINDOW_MINUTES
    });
    
    if (error) {
      console.error("Rate limit check error:", error);
      return true; // Fail open
    }
    
    return data === true;
  } catch (err) {
    console.error("Rate limit error:", err);
    return true;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Autentisering kreves" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Ugyldig token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check rate limit
    const isAllowed = await checkRateLimit(supabase, user.id, 'ik-mat-chat');
    if (!isAllowed) {
      console.log(`Rate limit exceeded for user ${user.id} on ik-mat-chat`);
      return new Response(JSON.stringify({ 
        error: "Du har sendt for mange forespørsler. Vennligst vent et minutt og prøv igjen." 
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();
    console.log(`User ${user.id} making ik-mat-chat request, messages: ${messages?.length}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...(buildMatKnownFacts(messages) ? [{ role: "system", content: buildMatKnownFacts(messages)! }] : []),
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "For mange forespørsler. Vennligst vent litt og prøv igjen." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Kreditter oppbrukt. Kontakt administrator." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI-tjenesten er midlertidig utilgjengelig." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      },
    });
  } catch (error) {
    console.error("Error in ik-mat-chat:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Ukjent feil" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
