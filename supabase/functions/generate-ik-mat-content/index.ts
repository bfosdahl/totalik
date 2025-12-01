import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `Du er en ekspert på norsk matsikkerhet og HACCP (Hazard Analysis and Critical Control Points).

Din oppgave er å generere skreddersydd IK-MAT innhold for norske matvirksomheter basert på deres spesifikke oppsett.

Du skal generere:
1. Målsettinger - spisset mot deres virksomhetstype og omfang
2. Risikovurdering - HACCP-basert, tilpasset deres prosesser
3. Rutiner - detaljerte prosedyrer for deres utstyr og arbeidsflyt
4. Temperaturkontrollskjemaer - ett per kjøler/fryser med navn og lokasjon
5. Renholdsplan - tilpasset deres soner og utstyr

VIKTIG:
- Bruk norsk språk og norske matvareforskrifter
- Vær spesifikk og praktisk, unngå generiske råd
- Inkluder konkrete temperaturer, frekvenser og ansvar
- Følg HACCP-metodikk for kritiske kontrollpunkter
- Generer JSON-format som er lett å lagre i database

Output-format:
{
  "goals": [
    { "goal_text": "...", "is_predefined": false }
  ],
  "risks": [
    {
      "hazard": "beskrivelse",
      "consequence": 3,
      "probability": 2,
      "measures": "tiltak"
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
2. Generer HACCP-basert risikovurdering med kritiske kontrollpunkter
3. Lag 8-12 detaljerte rutiner tilpasset deres oppsett
4. Generer temperaturkontrollskjema for hver kjøler og fryser med navn, lokasjon og måltemperaturer
5. Lag en komplett renholdsplan med konkrete oppgaver, frekvens og ansvar

Vær svært spesifikk og praktisk. Ikke bruk generiske fraser.`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { setupAnswers } = await req.json();
    console.log("Received setup answers:", setupAnswers);

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
      error: error instanceof Error ? error.message : "Ukjent feil" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
