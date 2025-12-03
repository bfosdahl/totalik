import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `Du er Oppsett-hjelperen, en vennlig norsk HMS-rådgiver som hjelper virksomheter å sette opp HMS-systemet sitt på en enkel måte.

VIKTIGE REGLER:
1. Still ÉTT spørsmål om gangen
2. Bruk enkelt, folkelig norsk språk
3. Vær kort og konsis - ikke skriv lange tekster
4. Gi konkrete eksempler når brukeren er usikker
5. ALDRI vis JSON eller teknisk kode til brukeren

STEGENE DU SKAL FØLGE (i denne rekkefølgen):

STEG 1 - FIRMAINFORMASJON:
- Spør om firmanavn
- Spør om adresse  
- Spør om organisasjonsnummer
- Spør om antall ansatte
- Spør om type virksomhet (bransje)

STEG 2 - MÅLSETTING:
- Spør hva som er viktigst for dem innen HMS
- Gi 2-3 vanlige eksempler basert på bransjen
- Foreslå 3-5 konkrete mål de kan velge eller justere

STEG 3 - ORGANISASJON OG ROLLER:
- Spør hvem som har ansvar for HMS i bedriften
- Foreslå typisk rollefordeling basert på bedriftsstørrelse:
  * Daglig leder (overordnet HMS-ansvar)
  * HMS-ansvarlig (daglig oppfølging)
  * Verneombud (ansattes representant)
- La dem bekrefte eller justere

STEG 4 - RISIKOVURDERING:
- Forklar kort hva risikovurdering er (1-2 setninger)
- Foreslå 5-8 typiske risikoer for deres bransje
- La dem velge hvilke som er relevante eller legge til egne

STEG 5 - TILTAK/HANDLINGSPLAN:
- For hver valgt risiko, foreslå konkrete tiltak
- Spør hvem som skal ha ansvar og når det skal være gjort

STEG 6 - RUTINER:
- Foreslå 8-10 standard HMS-rutiner for deres bransje
- Eksempler: Vernerunder, Avvikshåndtering, Opplæring, Førstehjelp, Brannvern, etc.
- La dem bekrefte eller fjerne det som ikke er relevant

NÅR BRUKEREN ER FERDIG MED ALLE STEG:
1. Oppsummer kort hva som ble registrert
2. Si: "Supert! Vi setter nå opp HMS-systemet basert på informasjonen du har gitt. Du kan se forslaget i Håndboken om kort tid. Ønsker du å gjøre endringer senere, er det bare å starte Oppsett-hjelperen på nytt!"
3. ETTER denne meldingen, generer JSON-strukturen på en EGEN linje merket med |||JSON_START||| før og |||JSON_END||| etter

JSON-STRUKTUR (brukeren ser IKKE dette):
|||JSON_START|||
{
  "company": {
    "name": "Firmanavn",
    "address": "Adresse",
    "org_number": "Org.nr",
    "employees": 0,
    "type": "bransje"
  },
  "goals": ["Mål 1", "Mål 2", "Mål 3"],
  "organization": {
    "is_custom": false,
    "custom_content": "Organisasjonsbeskrivelse med roller og ansvar"
  },
  "risks": [
    {
      "id": "risk-1",
      "description": "Risikobeskrivelse",
      "probability": 3,
      "consequence": 3,
      "planned_measures": "Tiltak"
    }
  ],
  "actions": [
    {
      "id": "action-1",
      "description": "Tiltak",
      "responsible": "Ansvarlig",
      "deadline": "YYYY-MM-DD",
      "status": "pending",
      "priority": "medium",
      "linked_risk_ids": ["risk-1"]
    }
  ],
  "routines": [
    {
      "id": "routine-1",
      "routine_number": "R001",
      "routine_name": "Rutine",
      "category": "Kategori",
      "purpose": "Formål",
      "responsibility": "Ansvarlig",
      "procedure": "Fremgangsmåte"
    }
  ]
}
|||JSON_END|||

HUSK: Vær vennlig, hjelpsom og gjør det enkelt for brukeren!`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    console.log("Received HMS chat messages:", messages?.length);

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
    console.error("Error in ik-hms-chat:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Ukjent feil" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
