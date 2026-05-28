import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RATE_LIMIT_MAX_REQUESTS = 5; // Max 5 requests (this is a heavy operation)
const RATE_LIMIT_WINDOW_MINUTES = 5; // Per 5 minutes

const systemPrompt = `Du er en ekspert på norsk matsikkerhet og HACCP (Hazard Analysis and Critical Control Points).

Din oppgave er å generere skreddersydd IK-MAT innhold for norske matvirksomheter basert på deres spesifikke oppsett.

Du skal generere:
1. Målsettinger - spisset mot deres virksomhetstype og omfang
2. HACCP-analyse med kritiske kontrollpunkter (KKP) - følg HACCP-metodikken strengt
3. Generell risikovurdering for mat og servering - tradisjonell konsekvens/sannsynlighet-analyse
4. Rutiner - detaljerte prosedyrer for deres utstyr og arbeidsflyt
5. Temperaturkontrollskjemaer - ett per kjøler/fryser med navn og lokasjon
6. Renholdsplan - tilpasset deres soner og utstyr

VIKTIG:
- Bruk norsk språk og norske matvareforskrifter
- Vær spesifikk og praktisk, unngå generiske råd
- Skil tydelig mellom HACCP/KKP (kritiske kontrollpunkter) og generell risikovurdering
- HACCP fokuserer på mattrygghetsfare i produksjonskjeden
- Generell risikovurdering dekker andre aspekter (arbeidsmiljø, økonomi, omdømme)
- Følg HACCP-metodikk: identifiser KKP, kritiske grenser, overvåking, korrigerende tiltak
- Generer JSON-format som er lett å lagre i database

Output-format:
{
  "goals": [
    { "goal_text": "...", "is_predefined": false }
  ],
  "haccp": [
    {
      "step": "prosess-steg (f.eks. Mottak, Nedkjøling, Oppvarming)",
      "hazard": "biologisk/kjemisk/fysisk fare",
      "criticalLimit": "konkret grenseverdi (f.eks. temp < 4°C)",
      "monitoring": "hvordan og hvor ofte overvåke",
      "correctiveAction": "hva gjøre hvis grense overskrides",
      "verification": "hvordan verifisere at systemet fungerer"
    }
  ],
  "risks": [
    {
      "hazard": "fare/risiko",
      "consequence": 1-5,
      "probability": 1-5,
      "riskLevel": "Lav/Middels/Høy/Kritisk",
      "measures": "forebyggende tiltak"
    }
  ],
  "routines": [
    {
      "routine_name": "navn",
      "purpose": "formål",
      "responsibility": "ansvar",
      "procedure": "fremgangsmåte",
      "frequency": "frekvens"
    }
  ],
  "temperatureSchemas": [
    {
      "equipment_name": "navn",
      "location": "plassering",
      "type": "kjøler/fryser",
      "target_temp": "mål temp",
      "frequency": "kontrollfrekvens"
    }
  ],
  "cleaningPlan": {
    "zones": ["ren sone", "uren sone"],
    "tasks": [
      {
        "area": "område",
        "task": "oppgave",
        "frequency": "frekvens",
        "responsible": "ansvarlig",
        "method": "metode"
      }
    ]
  }
}`;

function buildPrompt(answers: any): string {
  const {
    businessType,
    numberOfEmployees,
    coolers,
    freezers,
    hasCleanZone,
    allergens,
    specificProcesses
  } = answers;

  return `Generer komplett IK-MAT innhold for følgende virksomhet:

VIRKSOMHETSINFO:
- Type: ${businessType}
- Antall ansatte: ${numberOfEmployees}
- Ren/uren sone: ${hasCleanZone ? 'Ja, har separate soner' : 'Nei, ingen separasjon'}
- Allergener håndtert: ${allergens?.length > 0 ? allergens.join(', ') : 'Ingen spesifisert'}
${specificProcesses ? `- Spesielle prosesser: ${specificProcesses}` : ''}

KJØLEUTSTYR:
${coolers && coolers.length > 0 ? coolers.map((c: any, i: number) => 
  `Kjøler ${i + 1}: ${c.name} (${c.location})`
).join('\n') : 'Ingen kjølere registrert'}

FRYSEUTSTYR:
${freezers && freezers.length > 0 ? freezers.map((f: any, i: number) => 
  `Fryser ${i + 1}: ${f.name} (${f.location})`
).join('\n') : 'Ingen frysere registrert'}

KRAV:
1. Lag 3-5 spesifikke målsettinger for denne virksomheten
2. Generer HACCP-analyse med 4-8 kritiske kontrollpunkter (KKP) i produksjonskjeden
   - Inkluder: prosess-steg, fare, kritisk grense, overvåking, korrigerende tiltak, verifisering
3. Lag generell risikovurdering (ikke HACCP) for mat og servering med 6-10 risikoer
   - Dekk: hygiene, allergen-håndtering, arbeidsmiljø, brann, økonomi, omdømme
   - Bruk skala 1-5 for konsekvens og sannsynlighet
4. Lag 8-12 detaljerte rutiner tilpasset deres oppsett
5. Generer temperaturkontrollskjema for hver kjøler og fryser med navn, lokasjon og måltemperaturer
6. Lag en komplett renholdsplan med konkrete oppgaver, frekvens og ansvar

Vær svært spesifikk og praktisk. Ikke bruk generiske fraser.`;
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
      return true;
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
    const isAllowed = await checkRateLimit(supabase, user.id, 'generate-ik-mat-content');
    if (!isAllowed) {
      console.log(`Rate limit exceeded for user ${user.id} on generate-ik-mat-content`);
      return new Response(JSON.stringify({ 
        success: false,
        error: "Du har sendt for mange forespørsler. Vennligst vent noen minutter og prøv igjen." 
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { setupAnswers } = await req.json();
    console.log(`User ${user.id} generating IK-MAT content`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = buildPrompt(setupAnswers);
    console.log("Generated prompt for AI");

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
          { role: "user", content: prompt }
        ],
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

    const data = await response.json();
    console.log("AI response received");

    // Parse the AI response to extract JSON
    const aiMessage = data.choices?.[0]?.message?.content;
    if (!aiMessage) {
      throw new Error("No content in AI response");
    }

    // Extract JSON from markdown code blocks if present
    let generatedContent;
    try {
      const jsonMatch = aiMessage.match(/```json\n([\s\S]*?)\n```/) || aiMessage.match(/```\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        generatedContent = JSON.parse(jsonMatch[1]);
      } else {
        generatedContent = JSON.parse(aiMessage);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      throw new Error("AI returnerte ugyldig format. Prøv igjen.");
    }
    
    // Generate checklists, cleaning plan, allergen table, and contracts
    generatedContent.checklists = [
      {
        id: "mottakskontroll",
        name: "Mottakskontroll",
        description: "Kontroll av råvarer ved mottak",
        checkpoints: [
          "Sjekk temperatur på kjølevarer (under 4°C)",
          "Kontroller emballasje for skader",
          "Verifiser holdbarhetsdato",
          "Undersøk lukt og utseende",
          "Dokumenter mottakskontroll"
        ]
      },
      {
        id: "temperatur",
        name: "Temperaturkontroll",
        description: "Daglig kontroll av kjøl og frys",
        checkpoints: setupAnswers.coolers.map((c: any) => 
          `Sjekk ${c.name} (${c.location}) - maks 4°C`
        ).concat(setupAnswers.freezers.map((f: any) => 
          `Sjekk ${f.name} (${f.location}) - maks -18°C`
        ))
      }
    ];

    generatedContent.cleaningPlan = [
      { area: "Kjøkkenbenker", frequency: "Hver dag", method: "Desinfeksjon med godkjent middel", responsible: "Kjøkkenpersonale" },
      { area: "Gulv", frequency: "Hver dag", method: "Mopping med varmt vann og såpe", responsible: "Renholdspersonale" },
      { area: "Kjøleskap/frysere", frequency: "Ukentlig", method: "Tømme, vaske og desinfisere", responsible: "IK-MAT ansvarlig" },
      { area: "Ovner og komfyr", frequency: "Daglig/ukentlig", method: "Avfetting og rengjøring", responsible: "Kjøkkenpersonale" }
    ];

    generatedContent.allergens = setupAnswers.allergens.map((a: string) => ({
      name: a,
      present: true,
      controlMeasures: `Separate redskaper, merking, opplæring av personale`
    }));

    generatedContent.contracts = [
      { supplier: "Skadedyrkontroll AS", type: "Skadedyrkontroll", frequency: "Kvartalsvis", contact: "Kontakt leverandør", nextReview: "Etter 3 måneder" },
      { supplier: "Vaskeriservice", type: "Tekstilvask", frequency: "Ukentlig", contact: "Kontakt leverandør", nextReview: "Årlig" }
    ];

    return new Response(JSON.stringify({ 
      success: true,
      content: generatedContent 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in generate-ik-mat-content:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: "En uventet feil oppstod" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
