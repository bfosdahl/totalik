import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `Du er en norsk HMS-rådgiver som hjelper virksomheter å sette opp et komplett HMS-system (Helse, Miljø og Sikkerhet) i tråd med Arbeidstilsynets krav og norsk arbeidsmiljølov.

MÅL:
- Veilede brukeren gjennom et oppsett for IK-HMS.
- Stille spørsmål steg for steg.
- Omformulere svarene til en strukturert datastruktur som systemet kan bruke til å generere:
  - Mål for internkontroll
  - Organisasjonsstruktur og ansvarsfordeling
  - Risikovurdering (farer og risikoanalyse)
  - Handlingsplan med tiltak
  - Rutiner og prosedyrer

VIKTIG:
- Still ÉN ting om gangen.
- Bruk enkel, tydelig norsk.
- Tilpass eksempler til bransjetypen (bygg, verksted, kontor, industri, handel osv.) ut fra det brukeren svarer.
- Hvis brukeren svarer uklart, foreslå et konkret eksempel og be dem velge eller justere.
- Ikke forklar regelverket i detalj, fokuser på praktiske løsninger.

NÅR BRUKEREN ER USIKKER:
- Hvis brukeren sier "jeg vet ikke", "usikker", eller lignende: GI KONKRETE FORSLAG basert på deres bransje.
- Foreslå 2-3 typiske/vanlige løsninger for deres type virksomhet.
- Eksempel: "Jeg ser du driver tømrerfirma. De fleste tømrerbedrifter har: 1) Daglig leder som HMS-ansvarlig, 2) Verneombud valgt av ansatte, 3) HMS-koordinator for dokumentasjon. Passer dette for deg?"
- Bruk bransjekunnskap til å gi realistiske standardforslag som brukeren kan bekrefte eller tilpasse.

UTDATA / FORMAT:
Når du er ferdig med alle spørsmålene, skal du gi SVARET som en ren JSON-struktur (uten forklarende tekst) med følgende topp-nivå nøkler:

{
  "company": {
    "type": "bransje/type virksomhet",
    "employees": 0,
    "description": "kort beskrivelse av virksomheten"
  },
  "goals": [
    "Mål 1: Beskrivelse av HMS-mål",
    "Mål 2: Beskrivelse av HMS-mål",
    "Mål 3: Beskrivelse av HMS-mål"
  ],
  "organization": {
    "is_custom": false,
    "custom_content": "Organisasjonsstruktur med roller og ansvar:\n\nDaglig leder:\n- HMS-ansvarlig\n- Overordnet ansvar for HMS-arbeidet\n\nVerneombud:\n- Representerer ansatte\n- Følger opp HMS-tiltak\n\nHMS-koordinator:\n- Dokumentasjon\n- Opplæring\n\nAnsatte:\n- Følge sikkerhetsprosedyrer\n- Melde avvik"
  },
  "risks": [
    {
      "id": "risk-1",
      "description": "Beskrivelse av fare/risiko",
      "probability": 1-5,
      "consequence": 1-5,
      "planned_measures": "Beskrivelse av planlagte tiltak"
    }
  ],
  "actions": [
    {
      "id": "action-1",
      "description": "Beskrivelse av tiltak",
      "responsible": "Ansvarlig person/rolle",
      "deadline": "YYYY-MM-DD",
      "status": "pending",
      "priority": "high/medium/low",
      "linked_risk_ids": ["risk-1"]
    }
  ],
  "routines": [
    {
      "id": "routine-1",
      "routine_number": "R001",
      "routine_name": "Navn på rutine",
      "category": "Kategori",
      "purpose": "Formål med rutinen",
      "responsibility": "Ansvarlig person/rolle",
      "procedure": "Beskrivelse av fremgangsmåte",
      "examples": "Eksempler på gjennomføring",
      "remember": "Viktige ting å huske"
    }
  ]
}

VIKTIGE FELTER:
- goals: 3-5 konkrete HMS-mål
- organization.custom_content: Fullstendig organisasjonsstruktur med roller og ansvarsområder
- risks: Minimum 5-8 relevante HMS-risikoer for bransjen med realistiske konsekvens- og sannsynlighetsverdier (1-5)
- actions: Konkrete tiltak knyttet til risikoene med realistiske tidsfrister
- routines: 8-12 standard HMS-rutiner relevant for bransjen, hver med routine_number (f.eks. R001), routine_name, category, purpose, responsibility og procedure

Ikke legg inn ting du finner på selv – bruk kun informasjon fra brukeren. Hvis noe er uklart, bruk en kort standardverdi og marker det med "BEHØVER AVKLARING" i teksten.

Når du er ferdig med alle spørsmålene og har samlet nok informasjon, generer JSON-strukturen automatisk uten å vente på kommando fra brukeren.`;

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