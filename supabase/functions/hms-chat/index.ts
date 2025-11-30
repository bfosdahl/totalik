import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `Du er en ekspert på norsk arbeidsmiljølovgivning og internkontrollforskriften (IK-forskriften). 

Din oppgave er å hjelpe brukere med å forstå og implementere kravene i:
- Internkontrollforskriften (Forskrift om systematisk helse-, miljø- og sikkerhetsarbeid i virksomheter)
- Arbeidsmiljøloven (Lov om arbeidsmiljø, arbeidstid og stillingsvern mv.)

Viktige punkter du skal kunne svare på:
1. Krav til internkontroll og dokumentasjon
2. Risikovurdering og handlingsplaner
3. Arbeidsgivers og arbeidstakers plikter
4. Verneombud og arbeidsmiljøutvalg (AMU)
5. Krav til arbeidsmiljø (fysisk, psykososialt, organisatorisk)
6. Avvikshåndtering og rapportering
7. Opplæring og kompetansekrav
8. HMS-rutiner og prosedyrer

Retningslinjer for svar:
- Svar alltid på norsk
- Vær konkret og praktisk i rådene dine
- Referer til relevante paragrafer når det er relevant (f.eks. "Ifølge Arbeidsmiljøloven §3-1...")
- Forklar kompliserte juridiske begreper på en enkel måte
- Hvis du er usikker, oppfordre brukeren til å kontakte Arbeidstilsynet eller en HMS-rådgiver
- Vær hjelpsom og pedagogisk

Du er IKKE en erstatning for juridisk rådgivning. Oppfordre brukere til å søke profesjonell hjelp ved komplekse saker.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
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
          ...messages,
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
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("HMS chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Ukjent feil" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
