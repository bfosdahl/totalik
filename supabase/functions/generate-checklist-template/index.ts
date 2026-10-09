import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAiGateway, AI_PRIMARY_MODEL } from "../_shared/ai-gateway.ts";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userErr } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { tema, kategori, trade, detaljer, rutine_referanse, language } = await req.json();

    // Input length validation to prevent prompt-injection / large responses
    const tooLong = [tema, kategori, trade, detaljer, rutine_referanse, language]
      .filter(Boolean)
      .some((v: any) => typeof v === "string" && v.length > 2000);
    if (tooLong) {
      return new Response(JSON.stringify({ error: "Input er for langt" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    if (!tema) {
      return new Response(JSON.stringify({ error: "Tema er påkrevd" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Du er en norsk kvalitetssikringsekspert for byggebransjen (KS Bygg). Lag en komplett sjekkliste-mal basert på følgende:

Tema/tittel: ${tema}
${kategori ? `Kategori: ${kategori}` : ""}
${trade ? `Fag/håndverk: ${trade}` : ""}
${detaljer ? `Tilleggsdetaljer: ${detaljer}` : ""}
${rutine_referanse ? `Tilknyttet rutine: ${rutine_referanse}` : ""}

Svar BARE med gyldig JSON (ingen markdown, ingen forklaring) med denne strukturen:
{
  "template_name": "Malens navn",
  "description": "Kort beskrivelse av sjekklisten (1-2 setninger)",
  "category": "Passende kategori fra listen: Tømrerarbeid, Våtrom, Betongstøp, Grunnarbeid, Vinduer og dører, Isolasjon, Lufttetthet, Brannkrav, Førprosjekt, Sluttkontroll, FDV-kontroll, Overtakelse, Underentreprenør, Generell egenkontroll",
  "trade": "Relevant fag (f.eks. Tømrer, Murer, Betongarbeider, Rørlegger, Elektriker, Generelt)",
  "checkpoints": [
    {
      "checkpoint_text": "Sjekkpunktet beskrevet klart og konsist",
      "help_text": "Utfyllende hjelpetekst som forklarer hva som skal kontrolleres og hvordan"
    }
  ],
  "related_standards": ["Relevante standarder og forskrifter, f.eks. NS 3420, TEK17, SAK10"]
}

Lag 8-15 sjekkpunkter som er praktiske, konkrete og relevante for norsk byggebransje. Hvert sjekkpunkt skal ha tydelig hjelpetekst.

SPRÅK (viktigst av alt): ${
      typeof language === "string" && language.trim() && language.trim().toLowerCase() !== "auto"
        ? `Skriv ALT innhold (template_name, description, category, trade, checkpoint_text, help_text, related_standards) på ${language.trim()}.`
        : `Oppdag språket brukeren har skrevet i (tema/tilleggsdetaljer) og skriv ALT innhold (template_name, description, category, trade, checkpoint_text, help_text, related_standards) på NØYAKTIG det samme språket. Hvis språket er uklart, bruk norsk (bokmål).`
    } JSON-nøklene skal alltid være uendret på engelsk. Behold navn på norske standarder og forskrifter (NS 3420, TEK17, SAK10) uoversatt, men forklar dem på valgt språk.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Model, reasoning effort, timeout and fallback are set centrally in _shared/ai-gateway.ts.
    const response = await callAiGateway(LOVABLE_API_KEY, {
      model: AI_PRIMARY_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }, { totalTimeoutMs: 45_000 });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "For mange forespørsler, prøv igjen om litt." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Kreditt brukt opp, kontakt administrator." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI API error:", response.status, errText);
      throw new Error(`AI API returned ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    let checklist;
    try {
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      checklist = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Kunne ikke tolke AI-svaret");
    }

    return new Response(JSON.stringify({ checklist }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    console.error("generate-checklist-template error:", error);
    return new Response(JSON.stringify({ error: "En uventet feil oppstod" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
