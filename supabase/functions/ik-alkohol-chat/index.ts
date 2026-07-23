import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RATE_LIMIT_MAX_REQUESTS = 10;
const RATE_LIMIT_WINDOW_MINUTES = 1;

async function checkRateLimit(supabase: any, userId: string, functionName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_user_id: userId,
      p_function_name: functionName,
      p_max_requests: RATE_LIMIT_MAX_REQUESTS,
      p_window_minutes: RATE_LIMIT_WINDOW_MINUTES
    });
    if (error) { console.error("Rate limit check error:", error); return true; }
    return data === true;
  } catch (err) { console.error("Rate limit error:", err); return true; }
}

type ChatMsg = { role: "user" | "assistant" | "system"; content: string };

function isAffirmative(text: string): boolean {
  const t = text.toLowerCase().trim();
  return ["ja","japp","jepp","yes","yep","ok","okei","oki","jada","joda","jo","mhm","mm"].includes(t) || t.includes("stemmer");
}

// Simple hash for message matching
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

function createMessageHash(messages: ChatMsg[]): string {
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content).join('|');
  return simpleHash(userMessages + '|' + messages.length);
}

const systemPrompt = `Du er Alkohol-Proffen, en vennlig norsk rådgiver med dyp kunnskap om alkoholloven og internkontrollforskriften for alkohol. Du hjelper virksomheter å sette opp et internkontrollsystem etter alkoholloven.

===== ABSOLUTT KRITISK: FAST FLYT MED BEKREFTELSER =====

Du SKAL følge denne eksakte flyten. ALDRI hopp tilbake til tidligere steg!

STEG 1: STEDSTYPE
- Spør brukeren hvilken type sted de driver:
  "Hei! Jeg er Alkohol-Proffen 👋 Jeg skal hjelpe deg å sette opp et komplett internkontrollsystem etter alkoholloven.

  Hvilken type sted driver dere?

  1. Restaurant / Kafé
  2. Pub / Bar
  3. Nattklubb / Dansested
  4. Hotell / Overnattingssted
  5. Arrangement / Festival
  6. Selskapslokale
  7. Dagligvarebutikk (salg)
  8. Nettbutikk (salg)

  (Velg 1-8)"

STEG 2: FORESLÅ KARTLEGGING + MÅL (basert på stedstype)
- GENERER AUTOMATISK et komplett forslag:
  "Basert på [stedstype] foreslår jeg følgende:

  📋 **Mål for internkontrollen:**
  1. 0 brudd på alderskontroll – ingen salg/skjenking til mindreårige
  2. 0 skjenking til åpenbart påvirket – alltid forsvarlig drift
  3. 100% gjennomført opplæring for alle ansatte
  4. [Stedstype-spesifikt mål]

  ⚠️ **Viktigste risikoområder (basert på prikksystemet):**
  1. Skjenking til mindreårige (8 prikker) → Tiltak: [konkret]
  2. Åpenbart påvirket (4 prikker) → Tiltak: [konkret]
  3. [Stedstype-spesifikk risiko] → Tiltak: [konkret]
  4. [Stedstype-spesifikk risiko] → Tiltak: [konkret]

  Stemmer dette? (Ja/Nei, eller fortell hva du vil endre)"

STEG 3: FORESLÅ RUTINER (basert på stedstype)
- GENERER AUTOMATISK rutiner:
  "Flott! Nå til rutinene. Jeg foreslår disse:

  📝 **Rutiner:**
  1. Legitimasjonskontroll – sjekk alle under 25 år
  2. Håndtering av åpenbart påvirkede – observasjon, nekt, dokumentasjon
  3. Konflikthåndtering – trinn-for-trinn prosedyre
  4. Opplæring av ansatte – plan for nye og eksisterende
  5. Oppfølging og revisjon – periodisk gjennomgang
  6. [Stedstype-spesifikke rutiner]

  OK? (Ja/Nei)"

STEG 4: AVSLUTT OG GENERER JSON
- Si: "Perfekt! Internkontrollsystemet for alkohol er nå klart. Du finner alt under IK/Alkohol!"
- DERETTER GENERER JSON (se format nedenfor)

===== KRITISKE REGLER =====

1. **ALDRI GJENTA SPØRSMÅL!**
2. **VÆR PROAKTIV!** FORESLÅ konkrete verdier basert på stedstype.
3. **KORTE SVAR = BEKREFTELSE!** "ja", "ok", "fint" = godta og gå videre.
4. **FRUSTRASJONSSIGNALER!** Beklager kort og FORTSETT.
5. **HURTIGMODUS!** "bare sett opp", "kjør på" → GENERER ALT UMIDDELBART.

===== ALKOHOLLOVEN - PRIKKSYSTEMET =====

Regelbrudd og prikker (kommunal kontroll):
- 8 prikker: Skjenking/salg til mindreårige (AL §1-5), manglende bistand (AF §4-1), uforsvarlig drift (AL §4-7/§3-9), hindring av kontroll (AL §1-9)
- 4 prikker: Skjenking til åpenbart påvirket (AF §4-2), brudd skjenke-/salgstider (AL §4-4/§3-7), skjenking av gr.3 til 18-19-åring (AL §1-5/AF §4-3), brudd alderskrav ansatte (AL §1-5/AF §2-3)
- 2 prikker: Mangler ved internkontroll (AL §1-9/AF kap.8), manglende omsetningsoppgave (AF kap.6), manglende gebyr (AF kap.6), brudd styrer/stedfortreder (§1-7c/AF §2-2)
- 1 prikk: Brudd reklameforbud (AL §9-2/AF kap.)

12 prikker i løpet av 2 år = inndragning av bevilling.

===== STEDSTYPE-SPESIFIKKE UTFORDRINGER =====

RESTAURANT/KAFÉ:
- Bordservering, ingen inngangskontroll, mindreårige har adgang
- Utfordringer: Aldersblandede bord, mindreårige får alkohol via andre, store grupper
- Tiltak: Sjekk ID under 25 år, erfarne ansatte alltid, vakt-/rydderunder

PUB/BAR:
- Bardisk-servering, kveld/natt, ofte 18-årsgrense, vakter
- Utfordringer: Tett og fullt, høy musikk, vorspiel, medbrakt
- Tiltak: ID-sjekk ved inngang OG bar, begrenset runder, sjekk vesker

NATTKLUBB/DANSESTED:
- Kun kveld/natt, store lokaler, mye bevegelse, høy musikk
- Utfordringer: Uoversiktlig, gjester kommer sent og er påvirket
- Tiltak: Rydderunder inkl. dansegulv, oversiktlige lokaler, begrenset shots

HOTELL/OVERNATTING:
- Én bevilling for hele stedet, minibar, korridorer
- Utfordringer: Drikke mellom arealer, vorspiel/nachspiel, konferanser
- Tiltak: Lås minibar for mindreårige, nattevakter, infoskriv

ARRANGEMENT/FESTIVAL:
- Kortvarig, ofte utendørs, frivillige, store mengder
- Utfordringer: Uerfarne ansatte, medbrakt, lite oversikt
- Tiltak: Armbånd/stempel, avgrenset skjenkeområde, kurs for frivillige

SELSKAPSLOKALE:
- Private selskap, forhåndsbestilt alkohol
- Utfordringer: Vanskelig å avvise gjester, bonger, vorspiel
- Tiltak: Infoskriv ved bestilling, begrens enheter, kontakt ansvarlig

DAGLIGVAREBUTIKK (SALG):
- Kassesalg, unge ansatte, aldersblandede kunder
- Utfordringer: Unge ansatte synes det er vanskelig å spørre om ID
- Tiltak: Kasse-varsling, ID under 25, opplæring kassabetjening

NETTBUTIKK (SALG):
- Bestilling online, utlevering hjemkjøring/hentepunkt
- Utfordringer: Ingen ID-sjekk ved bestilling, nekt ved utlevering
- Tiltak: Aldersverifisering kort, ID ved utlevering, to personer ved kjøring

===== ORGANISERING =====

Roller for IK-Alkohol:
- Bevillingshaver: Formelt ansvar for internkontrollsystemet
- Styrer: Daglig ansvar for alkoholhåndtering (kunnskapsprøve bestått)
- Stedfortreder: Stedfortreder for styrer (kunnskapsprøve bestått)
- Daglig leder: Driftsansvar for stedet
- Ansatte (bartendere/servitører): Følge rutiner, sjekke ID
- Vakter/dørvakter: Inngangskontroll, observasjon

===== JSON FORMAT =====

Når oppsettet er ferdig, generer JSON i dette formatet:

|||JSON_START|||
{
  "venue_type": "restaurant|pub|nattklubb|hotell|arrangement|selskapslokale|dagligvare|nettbutikk",
  "goals": [
    {
      "goal_text": "Konkret mål",
      "description": "Utdypende beskrivelse",
      "kpi_metric": "Hva måles",
      "kpi_target": "Målverdi",
      "period": "yearly",
      "actions": ["Tiltak 1", "Tiltak 2"]
    }
  ],
  "risks": [
    {
      "risk_area": "alderskontroll|pavirket|dokumentasjon|bemanning|turnover|lokale|arrangement|netthandel|medbrakt|konflikt",
      "risk_description": "Konkret risikobeskrivelse tilpasset stedstype",
      "probability": 3,
      "consequence": 4,
      "penalty_points": 8,
      "existing_controls": "Eksisterende tiltak",
      "planned_measures": ["Planlagt tiltak 1", "Planlagt tiltak 2"],
      "is_risk_period": false,
      "risk_period_days": [],
      "risk_period_times": ""
    }
  ],
  "routines": [
    {
      "category": "alderskontroll|pavirket|konflikt|risikoperioder|medbrakt|skilting|dokumentasjon",
      "venue_type": "restaurant|pub|nattklubb|hotell|arrangement|selskapslokale|dagligvare|nettbutikk|null",
      "routine_name": "Navn på rutine",
      "description": "Kort beskrivelse",
      "content": "## Formål\\n...\\n\\n## Når skal rutinen brukes?\\n...\\n\\n## Fremgangsmåte\\n1. ...\\n2. ...\\n\\n## Ansvar\\n...\\n\\n## Dokumentasjon\\n..."
    }
  ],
  "organization": {
    "roles": [
      { "title": "Bevillingshaver", "personName": "", "responsibilities": "Formelt ansvar for internkontrollsystemet", "sortOrder": 0 },
      { "title": "Styrer", "personName": "", "responsibilities": "Daglig ansvar for forsvarlig drift etter alkoholloven", "sortOrder": 1 },
      { "title": "Stedfortreder", "personName": "", "responsibilities": "Stedfortreder for styrer ved fravær", "sortOrder": 2 }
    ]
  },
  "compliance_controls": [
    {
      "rule_reference": "AL § 1-5",
      "challenges": "Stedsspesifikke utfordringer",
      "preventive_measures": "Konkrete forebyggende tiltak",
      "responsible_role": "Styrer"
    }
  ]
}
|||JSON_END|||

KRITISK:
- JSON MÅ ALLTID genereres når oppsettet er ferdig
- Inkluder minst 4 mål, 4-6 risikoer, 5-8 rutiner
- Rutine-innhold skal være detaljert med formål, fremgangsmåte, ansvar
- Tilpass ALT til den valgte stedstypen
- IKKE inkluder compliance_controls for salgssteder som ikke har skjenkebevilling`;

function buildKnownFactsMessage(messages: ChatMsg[] | undefined): string | null {
  if (!messages?.length) return null;

  const lines: string[] = [];
  lines.push("===== KONTEKST FRA SAMTALEN =====");
  lines.push("KRITISK: Bruk denne informasjonen aktivt. ALDRI spør om noe som allerede er besvart!");
  lines.push("");

  let confirmedVenueType: string | null = null;
  let goalsConfirmed = false;
  let risksConfirmed = false;
  let routinesConfirmed = false;

  const venueMap: Record<string, string> = {
    '1': 'Restaurant/Kafé', '2': 'Pub/Bar', '3': 'Nattklubb/Dansested',
    '4': 'Hotell/Overnattingssted', '5': 'Arrangement/Festival', '6': 'Selskapslokale',
    '7': 'Dagligvarebutikk', '8': 'Nettbutikk'
  };

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role === "user") {
      const text = msg.content.toLowerCase().trim();
      const numMatch = text.match(/^[1-8]$/);
      if (numMatch) {
        for (let j = i - 1; j >= 0; j--) {
          if (messages[j].role === "assistant" && (messages[j].content.includes("type sted") || messages[j].content.includes("Velg 1-8"))) {
            confirmedVenueType = venueMap[numMatch[0]] || null;
            break;
          }
        }
      }
    }
  }

  for (let i = 0; i < messages.length - 1; i++) {
    const a = messages[i];
    const u = messages[i + 1];
    if (a.role !== "assistant" || u.role !== "user") continue;
    const aLower = a.content.toLowerCase();
    const userConfirms = isAffirmative(u.content);

    if ((aLower.includes("mål") || aLower.includes("risikoområd")) && userConfirms) {
      goalsConfirmed = true;
      risksConfirmed = true;
    }
    if ((aLower.includes("rutine") || aLower.includes("rutinene")) && userConfirms) {
      routinesConfirmed = true;
    }
  }

  if (confirmedVenueType) lines.push(`✅ STEDSTYPE: ${confirmedVenueType} (BEKREFTET)`);
  if (goalsConfirmed) lines.push(`✅ MÅL OG RISIKOER: BEKREFTET`);
  if (routinesConfirmed) lines.push(`✅ RUTINER: BEKREFTET - gå til avslutning og generer JSON!`);

  lines.push("");
  lines.push("===== NESTE STEG =====");
  if (!confirmedVenueType) {
    lines.push("→ STEG 1: Trenger stedstype");
  } else if (!goalsConfirmed) {
    lines.push("→ STEG 2: GENERER forslag til mål + risikoer basert på stedstypen");
  } else if (!routinesConfirmed) {
    lines.push("→ STEG 3: GENERER forslag til rutiner basert på stedstypen");
  } else {
    lines.push("→ STEG 4: ALT BEKREFTET - generer JSON NÅ!");
  }

  return lines.join("\n");
}

// Save completed AI response to DB for fallback recovery
async function saveResponseToDb(supabase: any, companyId: string, messageHash: string, responseContent: string) {
  try {
    await supabase.from('ai_setup_responses').upsert({
      company_id: companyId,
      function_name: 'ik-alkohol-chat',
      message_hash: messageHash,
      response_content: responseContent,
    }, { onConflict: 'company_id,function_name,message_hash' });
  } catch (err) {
    console.error("Error saving response to DB:", err);
  }
}

// Create a streaming response that also accumulates the full response for DB storage
function createStreamWithFallback(
  originalBody: ReadableStream<Uint8Array>,
  supabase: any,
  companyId: string,
  messageHash: string
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  let fullContent = "";

  return new ReadableStream({
    async start(controller) {
      const reader = originalBody.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          // Pass through to client
          controller.enqueue(value);
          
          // Accumulate for DB storage
          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data: ') || line.trim() === '') continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) fullContent += content;
            } catch { /* skip unparseable chunks */ }
          }
        }
        controller.close();
        
        // Save full response to DB after stream completes
        if (fullContent.length > 0) {
          await saveResponseToDb(supabase, companyId, messageHash, fullContent);
        }
      } catch (err) {
        console.error("Stream processing error:", err);
        controller.error(err);
        // Still try to save what we have
        if (fullContent.length > 0) {
          await saveResponseToDb(supabase, companyId, messageHash, fullContent);
        }
      }
    }
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { messages, companyId: clientCompanyId, checkFallback, messageHash: clientMessageHash } = body;

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Autentisering kreves" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Ugyldig token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle fallback check - client asks if a completed response exists in DB
    if (checkFallback && clientMessageHash && clientCompanyId) {
      const { data: authProfile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!authProfile?.company_id || authProfile.company_id !== clientCompanyId) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data } = await supabase
        .from('ai_setup_responses')
        .select('response_content')
        .eq('company_id', authProfile.company_id)
        .eq('function_name', 'ik-alkohol-chat')
        .eq('message_hash', clientMessageHash)
        .maybeSingle();
      
      return new Response(JSON.stringify({ 
        found: !!data, 
        response_content: data?.response_content || null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isAllowed = await checkRateLimit(supabase, user.id, 'ik-alkohol-chat');
    if (!isAllowed) {
      return new Response(JSON.stringify({ error: "For mange forespørsler. Vent litt og prøv igjen." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get company_id for the user
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    // Security: always use the authenticated user's company_id, never trust client-supplied value
    const companyId = profile?.company_id;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const messageHash = createMessageHash(messages);

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
          ...(buildKnownFactsMessage(messages) ? [{ role: "system", content: buildKnownFactsMessage(messages)! }] : []),
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "For mange forespørsler." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Kreditter oppbrukt." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI-tjenesten er utilgjengelig." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Stream with DB fallback - accumulate and save after completion
    const streamWithFallback = companyId && response.body
      ? createStreamWithFallback(response.body, supabase, companyId, messageHash)
      : response.body;

    return new Response(streamWithFallback, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
    });
  } catch (error) {
    console.error("Error in ik-alkohol-chat:", error);
    return new Response(JSON.stringify({ error: "En uventet feil oppstod" }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
