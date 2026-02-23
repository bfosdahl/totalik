import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tema, kategori, trade, detaljer, rutine_referanse } = await req.json();

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

Lag 8-15 sjekkpunkter som er praktiske, konkrete og relevante for norsk byggebransje. Hvert sjekkpunkt skal ha tydelig hjelpetekst. Skriv på norsk (bokmål).`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
