import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const RATE_LIMIT_MAX_REQUESTS = 10;
const RATE_LIMIT_WINDOW_MINUTES = 1;

async function fetchBrregInfo(orgNumber: string) {
  try {
    const cleanOrgNr = orgNumber.replace(/[\s.]/g, '');
    if (!/^\d{9}$/.test(cleanOrgNr)) return null;
    
    const response = await fetch(`https://data.brreg.no/enhetsregisteret/api/enheter/${cleanOrgNr}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    const address = data.forretningsadresse || data.postadresse;
    const addressStr = address 
      ? `${address.adresse?.join(', ') || ''}, ${address.postnummer || ''} ${address.poststed || ''}`.trim()
      : '';
    
    return {
      name: data.navn,
      orgNumber: data.organisasjonsnummer,
      address: addressStr,
      industry: data.naeringskode1?.beskrivelse || '',
      industryCode: data.naeringskode1?.kode || '',
      employees: data.antallAnsatte || 0,
      organizationForm: data.organisasjonsform?.beskrivelse || ''
    };
  } catch (error) {
    console.error("Error fetching from Brreg:", error);
    return null;
  }
}

function getStepSystemPrompt(currentStep: number, industry: string | null, employeeCount: number | null, verneombudName: string | null, hasVerneombudExemption: boolean): string {
  const stepContext = `
KONTEKST:
- Bransje: ${industry || 'Ikke valgt'}
- Antall ansatte: ${employeeCount ?? 'Ukjent'}
- Verneombud: ${verneombudName || (hasVerneombudExemption ? 'Fritak signert' : 'Ikke avklart')}
`;

  const stepInstructions: Record<number, string> = {
    4: `NÅVÆRENDE STEG: 4 - Mål for internkontroll
${stepContext}
INSTRUKSJON:
- Foreslå 3-5 brede, bransjespesifikke HMS-mål UMIDDELBART
- Eksempler: "Null arbeidsulykker", "Trygt arbeidsmiljø for alle", "Alle ansatte har nødvendig opplæring"
- Si at kunden kan tilpasse målene selv etterpå
- Når brukeren bekrefter → si "Flott! La oss gå videre til organisering."`,

    5: `NÅVÆRENDE STEG: 5 - Organisering og ansvar
${stepContext}
INSTRUKSJON:
- Definer roller: Daglig leder, HMS-ansvarlig${(employeeCount ?? 0) >= 5 ? ', Verneombud' : ''}, Øvrige ansatte
- Beskriv ansvarsområder for hver rolle
- Foreslå et ferdig organisasjonskart
- Når brukeren bekrefter → si "Bra! Nå tar vi risikovurderingen."`,

    6: `NÅVÆRENDE STEG: 6 - Risikovurdering
${stepContext}
INSTRUKSJON:
- Still enkle spørsmål: "Hva anser dere som farekildene i bedriften?"
- Forklar at farekilder kan være: verktøy, arbeid i høyden, sittestillinger, luft/lys, kjemikalier
- Kom med konkrete forslag basert på bransjen
- Bruk hazard_source-kodene (maskinarbeid, sveising, tunge_loft, kjemikalier, osv.)
- Når brukeren bekrefter → si "Flott! La oss lage handlingsplaner."`,

    7: `NÅVÆRENDE STEG: 7 - Handlingsplan
${stepContext}
INSTRUKSJON:
- Spør hva de tenker kan gjøres med farekildene
- Kom med forslag: opplæring, verneutstyr, rutiner
- Lag konkrete handlingsplaner basert på risikoene
- Når brukeren bekrefter → si "Supert! Nå setter vi opp rutiner."`,

    8: `NÅVÆRENDE STEG: 8 - Rutiner og prosedyrer
${stepContext}
INSTRUKSJON:
- Foreslå 6-10 standardrutiner tilpasset bransjen
- Forklar at kunden kan legge til egne rutiner etterpå
- Inkluder alltid: Vernerunder, Avvikshåndtering, Opplæring, Brannvern
- Når brukeren bekrefter → GENERER KOMPLETT JSON umiddelbart`,

    9: `NÅVÆRENDE STEG: 9 - Fullføring
${stepContext}
INSTRUKSJON:
- ALT ER BEKREFTET. GENERER KOMPLETT JSON NÅ.
- Si: "Supert! HMS-systemet er nå klart. Du finner alt i Håndboken!"
- GENERER |||JSON_START||| og |||JSON_END||| blokken med ALLE data fra samtalen.`,
  };

  return stepInstructions[currentStep] || stepInstructions[4];
}

const baseSystemPrompt = `Du er HMS Proffen, en vennlig norsk HMS-rådgiver med dyp kunnskap om norsk arbeidsmiljølovgivning som hjelper virksomheter å sette opp HMS-systemet sitt.

===== 9-STEGS OPPSETT =====
Systemet følger 9 steg. Steg 1-3 (bedriftsinfo, egenerklæring, verneombud) håndteres av frontend.
Du blir kalt fra steg 4 og utover. Frontend sender "currentStep" parameter.

===== KRITISKE REGLER =====
1. **ALDRI GJENTA SPØRSMÅL!** Les konteksten. Hvis noe er bekreftet, IKKE spør igjen.
2. **VÆR PROAKTIV!** Ikke spør "hva ønsker du?" - FORESLÅ konkrete verdier og la brukeren bekrefte.
3. **KORTE SVAR = BEKREFTELSE!** "ja", "ok", "fint", "bra", "stemmer" = brukeren bekrefter → GÅ VIDERE
4. **FRUSTRASJONSSIGNALER!** "jeg har svart", "det sa jeg" → BEKLAGER KORT og FORTSETT
5. **HURTIGMODUS!** "bare sett opp", "kjør på", "foreslå alt" → GENERER ALT UMIDDELBART

===== LOVVERK =====
INTERNKONTROLLFORSKRIFTEN: §5: Krav om skriftlig HMS-dokumentasjon
ARBEIDSMILJØLOVEN: §3-1: Systematisk HMS-arbeid, §6-1: Verneombud ved 5+ ansatte, §7-1: AMU ved 50+ ansatte

===== BRANSJESPESIFIKKE RISIKOER =====

VERKSTED (Mekanisk, bil, sveising, tømrer, rørlegger):
- SKADERISIKO: Klemskader, sveiseblindhet, brannsår, kutt, øyeskader, elektriske skader, fall
- HELSERISIKO: Støy, støv, kjemikalier, sveiserøyk
- VERNEUTSTYR: Sveisemaske, vernebriller, hørselsvern, vernehansker, vernesko

BYGG OG ANLEGG:
- SKADERISIKO: Fall fra høyde, fallende gjenstander, klemskader, kutt, elektriske skader, ras
- HELSERISIKO: Støy, støv, vibrasjoner
- VERNEUTSTYR: Hjelm, vernebriller, hørselsvern, fallsele, vernesko

INDUSTRI/PRODUKSJON:
- RISIKOER: Klemskader, kutt, støy, vibrasjoner, kjemikalier, tunge løft, brann

KONTOR/ADMINISTRASJON:
- RISIKOER: Ergonomi, muskel/skjelett, øyebelastning, stress, inneklima, fall/snubling

FRISØR/SKJØNNHETSPLEIE:
- RISIKOER: Kjemikalier, hudirritasjon, ergonomi, snitt, smittefare

BUTIKK/DETALJHANDEL:
- RISIKOER: Tunge løft, stående arbeid, fall, ran/trusler, stress

RESTAURANT/SPISESTED:
- RISIKOER: Brannskader, snitt, sklisikring, tunge løft, mattrygghet

TRANSPORT:
- RISIKOER: Trafikkulykker, kjøre-/hviletid, ergonomi, lasting, alenearbeid

RENHOLD:
- RISIKOER: Kjemikalier, ergonomi, tunge løft, sklisikring, smittefare

BILPLEIE:
- RISIKOER: Kjemikalier, våte gulv, støy, ergonomi, ventilasjon

===== HURTIGMODUS =====
Når brukeren sier "bare sett opp", "foreslå alt", "kjør på":
- GENERER UMIDDELBART komplett HMS-oppsett tilpasset bransjen
- Si: "Supert! Jeg setter opp et komplett HMS-forslag. Du kan redigere alt etterpå!"
- GENERER JSON

===== STOFFKARTOTEK =====
Når bedriften bruker kjemikalier → ALLTID inkluder "Stoffkartotek og Kjemikaliehåndtering" rutine.

===== ANSVARLIGE ROLLER =====
Bruk KUN: "Daglig leder", "HMS-ansvarlig", "Verneombud" (kun ved 5+ ansatte), "Øvrige ansatte"
ALDRI bruk fiktive roller som "Brannvernleder", "Sikkerhetssjef" etc.

===== VERNEOMBUD I ORGANISASJON =====
- 5+ ansatte: ALLTID inkluder Verneombud-rollen
- <5 ansatte med fritak: IKKE inkluder Verneombud
- <5 ansatte men VIL ha verneombud: Inkluder

===== AVSLUTNING =====
Når brukeren bekrefter rutinene eller alt er klart:
1. Si: "Supert! HMS-systemet er klart. Du finner alt i Håndboken!"
2. GENERER KOMPLETT JSON med |||JSON_START||| og |||JSON_END|||
3. Inkluder ALLE mål, organisering, risikoer, handlingsplaner og rutiner

===== JSON-FORMAT =====
|||JSON_START|||
{
  "industry": "kontor|bygg_anlegg|industri|frisor|butikk|restaurant|transport|renhold|bilpleie|verksted",
  "company": { "name": "", "address": "", "org_number": "", "employees": 0, "type": "" },
  "verneombudNavn": "",
  "hasVerneombudFritak": false,
  "goals": ["Mål 1", "Mål 2", "Mål 3"],
  "organization": {
    "roles": [
      { "id": "role-1", "title": "Daglig leder", "personName": "", "description": "Overordnet HMS-ansvar...", "sortOrder": 0 },
      { "id": "role-2", "title": "HMS-ansvarlig", "personName": "", "description": "Koordinerer daglig HMS...", "sortOrder": 1 },
      { "id": "role-3", "title": "Verneombud", "personName": "", "description": "Arbeidstakernes representant...", "sortOrder": 2 },
      { "id": "role-4", "title": "Øvrige ansatte", "personName": "", "description": "Plikt til å melde fra...", "sortOrder": 3 }
    ],
    "description": "**Daglig leder:** Overordnet ansvar..."
  },
  "risks": [
    {
      "id": "risk-1",
      "hazard_source": "maskinarbeid|sveising|klemskader|tunge_loft|kjemikalier|stoystov|arbeid_i_hoyden|varmt_arbeid|elektrisk_arbeid|trafikk|alenearbeid|trange_rom|utgravning|stress|vold_trusler|annet",
      "hazard_source_custom": "Kun hvis annet",
      "events": [
        { "id": "event-1a", "description": "Hendelse", "consequence": 3, "probability": 3, "measures": "Tiltak", "responsible": "Daglig leder", "deadline": "YYYY-MM-DD", "status": "planlagt" }
      ],
      "created_at": "ISO-dato", "created_by": "AI Oppsett"
    }
  ],
  "actions": [
    { "id": "action-1", "risk_id": "risk-1", "event_id": "event-1a", "risk_source": "Farekilde", "event_description": "Hendelse", "action_description": "Tiltak", "action_type": "teknisk|organisatorisk|opplaering|ppe", "responsible": "Daglig leder", "deadline": "YYYY-MM-DD", "status": "planlagt", "priority": "lav|medium|høy|kritisk" }
  ],
  "routines": [
    { "id": "routine-1", "routine_number": "R001", "routine_name": "Vernerunder", "category": "HMS-arbeid", "purpose": "Formål", "responsibility": "HMS-ansvarlig", "procedure": "1. Steg\\n2. Steg" }
  ]
}
|||JSON_END|||

===== INNLIMT KRAVTEKST =====
Når brukeren limer inn tekster med krav/forskrifter:
1. ANALYSER teksten og identifiser ALLE krav
2. KONVERTER til konkrete HMS-elementer (risikoer, rutiner, roller)
3. BEKREFT med brukeren
4. GENERER KOMPLETT JSON med ALT inkludert

KRITISK: JSON MÅ ALLTID genereres ved avslutning. Uten JSON mister brukeren alt!`;

async function checkRateLimit(supabase: any, userId: string, functionName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_user_id: userId, p_function_name: functionName,
      p_max_requests: RATE_LIMIT_MAX_REQUESTS, p_window_minutes: RATE_LIMIT_WINDOW_MINUTES
    });
    if (error) { console.error("Rate limit check error:", error); return true; }
    return data === true;
  } catch (err) { console.error("Rate limit error:", err); return true; }
}

type ChatMsg = { role: "user" | "assistant" | "system"; content: string };

function buildKnownFactsMessage(messages: ChatMsg[] | undefined): string | null {
  if (!messages?.length) return null;

  const lines: string[] = [];
  lines.push("===== KONTEKST FRA SAMTALEN =====");
  lines.push("KRITISK: Bruk denne informasjonen. ALDRI spør om noe som allerede er besvart!");
  lines.push("");

  const isAffirmative = (text: string): boolean => {
    const t = text.toLowerCase().trim();
    return ["ja","japp","jepp","yes","ok","okei","oki","jada","joda","jo","mhm","mm"].includes(t) || t.includes("stemmer");
  };

  let goalsConfirmed = false, risksConfirmed = false, routinesConfirmed = false;
  let confirmedGoals: string[] = [], confirmedRisks: string[] = [], confirmedRoutines: string[] = [];

  for (let i = 0; i < messages.length - 1; i++) {
    const a = messages[i], u = messages[i + 1];
    if (a.role !== "assistant" || u.role !== "user") continue;
    const aLower = a.content.toLowerCase();
    const userConfirms = isAffirmative(u.content);

    if ((aLower.includes("hms-mål") || aLower.includes("mål:") || aLower.includes("målene")) && userConfirms) {
      goalsConfirmed = true;
      const m = a.content.match(/\d+\.\s*([^\n]+)/g);
      if (m) confirmedGoals = m.map(g => g.replace(/^\d+\.\s*/, '').trim());
    }
    if ((aLower.includes("risiko") || aLower.includes("farekild") || aLower.includes("tiltak")) && userConfirms) {
      risksConfirmed = true;
      const m = a.content.match(/\d+\.\s*([^\n→]+)/g);
      if (m) confirmedRisks = m.map(r => r.replace(/^\d+\.\s*/, '').trim()).slice(0, 5);
    }
    if ((aLower.includes("rutine") || aLower.includes("rutinene")) && userConfirms) {
      routinesConfirmed = true;
      const m = a.content.match(/\d+\.\s*([^\n(]+)/g);
      if (m) confirmedRoutines = m.map(r => r.replace(/^\d+\.\s*/, '').trim()).slice(0, 10);
    }
  }

  if (goalsConfirmed) {
    lines.push(`✅ HMS-MÅL: BEKREFTET`);
    if (confirmedGoals.length) lines.push(`   ${confirmedGoals.slice(0, 3).join(", ")}`);
  }
  if (risksConfirmed) {
    lines.push(`✅ RISIKOER: BEKREFTET`);
    if (confirmedRisks.length) lines.push(`   ${confirmedRisks.slice(0, 3).join(", ")}`);
  }
  if (routinesConfirmed) {
    lines.push(`✅ RUTINER: BEKREFTET - generer JSON!`);
    if (confirmedRoutines.length) lines.push(`   ${confirmedRoutines.slice(0, 5).join(", ")}`);
  }

  lines.push("");
  lines.push("PÅMINNELSE: Korte svar som 'ja', 'ok' = GODTA og GÅ VIDERE!");

  return lines.join("\n");
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { messages, lookupOrgNumber, currentStep, industry, employeeCount, verneombudName, hasVerneombudExemption } = body;
    
    // Handle Brreg lookup
    if (lookupOrgNumber) {
      const brregInfo = await fetchBrregInfo(lookupOrgNumber);
      return new Response(JSON.stringify(brregInfo ? { success: true, data: brregInfo } : { success: false, error: "Fant ikke bedriften" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth
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

    // Rate limit
    const isAllowed = await checkRateLimit(supabase, user.id, 'ik-hms-chat');
    if (!isAllowed) {
      return new Response(JSON.stringify({ error: "For mange forespørsler. Vent litt." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build step-specific prompt
    const stepPrompt = getStepSystemPrompt(
      currentStep || 4,
      industry || null,
      employeeCount ?? null,
      verneombudName || null,
      hasVerneombudExemption || false
    );

    // Fetch top accepted suggestions from the database for this industry
    let popularSuggestionsPrompt = "";
    if (industry && currentStep) {
      try {
        const stepTypeMap: Record<number, string> = { 4: 'maal', 5: 'organisering', 6: 'risiko', 7: 'handlingsplan', 8: 'rutine' };
        const suggestionType = stepTypeMap[currentStep];
        if (suggestionType) {
          const { data: topSuggestions } = await supabase
            .from('ai_setup_suggestion_stats')
            .select('suggestion_text, times_accepted, times_suggested')
            .eq('industry', industry)
            .eq('suggestion_type', suggestionType)
            .gt('times_accepted', 0)
            .order('times_accepted', { ascending: false })
            .limit(10);

          if (topSuggestions && topSuggestions.length > 0) {
            const lines = topSuggestions.map((s: any) => 
              `- "${s.suggestion_text}" (godkjent ${s.times_accepted} av ${s.times_suggested} ganger)`
            );
            popularSuggestionsPrompt = `\n\n===== POPULÆRE FORSLAG FOR DENNE BRANSJEN =====\nDisse forslagene har blitt godkjent av andre bedrifter i samme bransje. PRIORITER disse i dine forslag:\n${lines.join('\n')}\n`;
          }

          // Also check industry templates (option 3)
          const { data: templates } = await supabase
            .from('ai_setup_industry_templates')
            .select('suggestions')
            .eq('industry', industry)
            .eq('template_type', suggestionType)
            .eq('is_active', true)
            .maybeSingle();

          if (templates?.suggestions && Array.isArray(templates.suggestions) && templates.suggestions.length > 0) {
            const templateLines = templates.suggestions.map((s: any) => `- "${typeof s === 'string' ? s : s.text || s.name || JSON.stringify(s)}"`);
            popularSuggestionsPrompt += `\n\n===== BRANSJEMAL-FORSLAG =====\nDisse er forhåndsdefinerte forslag for bransjen:\n${templateLines.join('\n')}\n`;
          }
        }
      } catch (err) {
        console.error("Error fetching suggestion stats:", err);
      }
    }

    const systemMessages: ChatMsg[] = [
      { role: "system", content: baseSystemPrompt + popularSuggestionsPrompt },
      { role: "system", content: stepPrompt },
    ];

    const knownFacts = buildKnownFactsMessage(messages);
    if (knownFacts) {
      systemMessages.push({ role: "system", content: knownFacts });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [...systemMessages, ...messages],
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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
    });
  } catch (error) {
    console.error("Error in ik-hms-chat:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Ukjent feil" }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
