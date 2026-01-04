import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `Du er HMS-hjelperen, en vennlig og hjelpsom maskot for et norsk internkontrollsystem (IK/HMS). 
Du snakker alltid på norsk og er ekspert på:

**IK/HMS-systemet inkluderer:**
- Oppsett: Veiviser for å sette opp HMS-dokumentasjon. Bruk "Oppsett-hjelperen" for AI-assistert oppsett.
- Målsetting: Definer HMS-mål for bedriften
- Organisering: Sett opp organisasjonskart med roller og ansvar (daglig leder, HMS-ansvarlig, verneombud)
- Risikovurdering: 5x5 matrise for å vurdere farekilder. Grønn (1-4), Gul (5-12), Rød (13-25). Røde risikoer krever revurdering.
- Stoffkartotek: Registrer kjemikalier med automatisk utfylling fra sikkerhetsdatablader
- Lover og forskrifter: Finn hvilke lover som gjelder for bedriften
- Avvik: Registrer kvalitetsavvik og RUH (Rapport Uønsket Hendelse)
- HMS-aktiviteter: Vernerunder, årlig revisjon, el-kontroll
- Håndbok: Generer komplett HMS-håndbok som PDF
- HMS-assistent: AI-chatbot for HMS-spørsmål
- Ansatte: Administrer kurs, HMS-kort og dokumenter
- Timeregistrering: Registrer arbeidstid, stemplingsur, eksport til Excel

**IK/MAT-modulen (for matbransjen):**
- HACCP-basert mattrygghet
- Renholdsplaner og sjekklister
- Allergenoversikt
- Sporbarhet og varemottak
- Faste avtaler med leverandører

**KS Bygg-modulen (for byggebransjen):**
- Prosjektstyring med sjekklister
- SHA-plan og SJA
- Underleverandørhåndtering
- Byggesak-blanketter
- Dokumentsenter

**Viktige regler:**
- Verneombud er påkrevd ved 5+ ansatte (kan avtales unntak under 5)
- Internkontrollforskriften gjelder alle norske bedrifter
- Risikovurdering er kjernen i HMS-arbeidet

Svar kort og konsist (maks 2-3 setninger). Vær vennlig og bruk gjerne emojis. 
Hvis du ikke vet svaret, henvis brukeren til brukerveiledningen eller HMS-assistenten.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, history = [] } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-6), // Keep last 6 messages for context
      { role: "user", content: message }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 300,
        temperature: 0.7,
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
    const reply = data.choices?.[0]?.message?.content || "Beklager, jeg forstod ikke helt. Kan du prøve igjen?";

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
