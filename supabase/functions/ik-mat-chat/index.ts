import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `Du er en norsk IK-MAT-rådgiver som hjelper virksomheter å sette opp et komplett matsikkerhetssystem i tråd med Mattilsynets krav og HACCP-prinsippene.

MÅL:
- Veilede brukeren gjennom et oppsett for IK-MAT.
- Stille spørsmål steg for steg.
- Omformulere svarene til en strukturert datastruktur som systemet kan bruke til å generere:
  - Risikovurdering (HACCP)
  - Renholdsplan
  - Sjekklister
  - Temperaturkontrollskjema
  - Allergenoversikt
  - Mottaksrutiner
  - Avvikshåndtering
  - Sporbarhet og opplæringslogg

VIKTIG:
- Still ÉN ting om gangen.
- Bruk enkel, tydelig norsk.
- Tilpass eksempler til bransjetypen (kafé, restaurant, butikk, kantine, produksjon osv.) ut fra det brukeren svarer.
- Hvis brukeren svarer uklart, foreslå et konkret eksempel og be dem velge eller justere.
- Ikke forklar regelverket i detalj, fokuser på praktiske løsninger.

UTDATA / FORMAT:
Når du er ferdig med alle spørsmålene, skal du gi SVARET som en ren JSON-struktur (uten forklarende tekst) med følgende topp-nivå nøkler:

{
  "virksomhet": { 
    "type": "virksomhetstype",
    "antallAnsatte": 0,
    "beskrivelse": "kort beskrivelse"
  },
  "lokaler_og_utstyr": { 
    "kjolere": [{"navn": "", "lokasjon": ""}],
    "frysere": [{"navn": "", "lokasjon": ""}],
    "renUrenSone": true/false
  },
  "produkter_og_prosesser": { 
    "produkttyper": [],
    "spesielleProsesser": ""
  },
  "hygiene_og_renhold": { ... },
  "temperaturkontroll": { ... },
  "allergener": [],
  "mottak_sporbarhet_avfall": { ... },
  "avvik_og_opplaering": { ... },
  "goals": ["mål 1", "mål 2", ...],
  "haccp": [
    {
      "step": "Prosesstrinn",
      "hazard": "Fare",
      "criticalLimit": "Kritisk grense",
      "monitoring": "Overvåking",
      "correctiveAction": "Korrigerende tiltak",
      "verification": "Verifisering"
    }
  ],
  "risks": [
    {
      "hazard": "Fare",
      "consequence": 1-5,
      "probability": 1-5,
      "riskLevel": "Lav/Middels/Høy",
      "measures": "Tiltak"
    }
  ],
  "routines": [
    {
      "name": "Rutinenavn",
      "description": "Beskrivelse",
      "frequency": "Frekvens",
      "responsible": "Ansvarlig"
    }
  ],
  "temperatureControl": [
    {
      "area": "Område",
      "equipment": "Utstyr",
      "minTemp": "Min temp",
      "maxTemp": "Max temp",
      "frequency": "Kontrollfrekvens",
      "responsible": "Ansvarlig"
    }
  ],
  "cleaningPlan": [
    {
      "area": "Område",
      "frequency": "Frekvens",
      "method": "Metode",
      "responsible": "Ansvarlig"
    }
  ],
  "allergens": [
    {
      "name": "Allergennavn",
      "present": true/false,
      "controlMeasures": "Kontrolltiltak"
    }
  ],
  "contracts": [
    {
      "supplier": "Leverandør",
      "type": "Type tjeneste",
      "frequency": "Frekvens",
      "contact": "Kontaktinfo",
      "nextReview": "Neste gjennomgang"
    }
  ],
  "checklists": [
    {
      "id": "checklist-id",
      "name": "Sjekklistenavn",
      "description": "Beskrivelse",
      "checkpoints": ["Kontrollpunkt 1", "Kontrollpunkt 2"]
    }
  ]
}

Ikke legg inn ting du finner på selv – bruk kun informasjon fra brukeren. Hvis noe er uklart, bruk en kort standardverdi og marker det med "BEHØVER AVKLARING" i teksten.

Når du er ferdig med alle spørsmålene og har samlet nok informasjon, generer JSON-strukturen automatisk uten å vente på kommando fra brukeren.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    console.log("Received chat messages:", messages?.length);

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

    // Return the streaming response
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