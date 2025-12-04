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
- VIKTIG: Du SKAL generere MINST 8-10 komplette HMS-rutiner basert på bransjen
- Foreslå rutiner som: Vernerunder, Avvikshåndtering, Opplæring av ansatte, Førstehjelp, Brannvern, Ergonomi, Risikovurdering, Arbeidsutstyr, Personlig verneutstyr, Støy og vibrasjoner, Kjemikalier, Varmt arbeid, etc.
- Tilpass rutinene til bransjen brukeren jobber i
- La dem bekrefte eller fjerne det som ikke er relevant

NÅR BRUKEREN ER FERDIG MED ALLE STEG:
1. Oppsummer kort hva som ble registrert
2. Si: "Supert! Vi setter nå opp HMS-systemet basert på informasjonen du har gitt. Du kan se forslaget i Håndboken om kort tid. Ønsker du å gjøre endringer senere, er det bare å starte Oppsett-hjelperen på nytt!"
3. ETTER denne meldingen, generer JSON-strukturen på en EGEN linje merket med |||JSON_START||| før og |||JSON_END||| etter

KRITISK FOR JSON-GENERERING:
- Du MÅ generere ALLE rutinene som ble diskutert/godkjent i samtalen
- Hver rutine skal være fullstendig med alle feltene fylt ut
- IKKE generer kun én rutine - generer ALLE som brukeren godkjente (typisk 8-10 stykk)

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
      "routine_name": "Vernerunder",
      "category": "HMS-arbeid",
      "purpose": "Sikre systematisk gjennomgang av arbeidsmiljøet",
      "responsibility": "HMS-ansvarlig",
      "procedure": "1. Planlegg vernerunde minst hver måned\\n2. Bruk sjekkliste for gjennomgang\\n3. Dokumenter funn og avvik\\n4. Følg opp tiltak"
    },
    {
      "id": "routine-2",
      "routine_number": "R002",
      "routine_name": "Avvikshåndtering",
      "category": "HMS-arbeid",
      "purpose": "Sikre at avvik blir registrert og fulgt opp",
      "responsibility": "Alle ansatte",
      "procedure": "1. Meld avvik umiddelbart\\n2. Dokumenter hendelsen\\n3. Vurder årsak\\n4. Iverksett tiltak\\n5. Følg opp"
    },
    {
      "id": "routine-3",
      "routine_number": "R003",
      "routine_name": "Opplæring av ansatte",
      "category": "Kompetanse",
      "purpose": "Sikre at alle ansatte har nødvendig kompetanse",
      "responsibility": "Daglig leder",
      "procedure": "1. Kartlegg opplæringsbehov\\n2. Gjennomfør opplæring\\n3. Dokumenter gjennomført opplæring\\n4. Evaluer effekt"
    },
    {
      "id": "routine-4",
      "routine_number": "R004",
      "routine_name": "Førstehjelp",
      "category": "Beredskap",
      "purpose": "Sikre rask og korrekt førstehjelp ved ulykker",
      "responsibility": "HMS-ansvarlig",
      "procedure": "1. Sikre tilgjengelig førstehjelpsutstyr\\n2. Opplæring av ansatte\\n3. Sjekk utstyr jevnlig\\n4. Oppdater nødnumre"
    },
    {
      "id": "routine-5",
      "routine_number": "R005",
      "routine_name": "Brannvern",
      "category": "Beredskap",
      "purpose": "Forebygge brann og sikre evakuering",
      "responsibility": "Brannvernleder",
      "procedure": "1. Gjennomfør brannøvelser årlig\\n2. Kontroller slokkeutstyr\\n3. Hold rømningsveier frie\\n4. Oppdater branninstruks"
    },
    {
      "id": "routine-6",
      "routine_number": "R006",
      "routine_name": "Ergonomi",
      "category": "Arbeidsmiljø",
      "purpose": "Forebygge belastningsskader",
      "responsibility": "HMS-ansvarlig",
      "procedure": "1. Vurder arbeidsstasjoner\\n2. Tilpass utstyr til den enkelte\\n3. Varier arbeidsoppgaver\\n4. Gi opplæring i riktig arbeidsteknikk"
    },
    {
      "id": "routine-7",
      "routine_number": "R007",
      "routine_name": "Risikovurdering",
      "category": "HMS-arbeid",
      "purpose": "Identifisere og vurdere risiko i arbeidet",
      "responsibility": "HMS-ansvarlig",
      "procedure": "1. Kartlegg farer\\n2. Vurder sannsynlighet og konsekvens\\n3. Prioriter tiltak\\n4. Iverksett og følg opp"
    },
    {
      "id": "routine-8",
      "routine_number": "R008",
      "routine_name": "Arbeidsutstyr",
      "category": "Sikkerhet",
      "purpose": "Sikre trygg bruk av arbeidsutstyr",
      "responsibility": "HMS-ansvarlig",
      "procedure": "1. Kontroller utstyr før bruk\\n2. Vedlikehold etter plan\\n3. Rapporter feil umiddelbart\\n4. Gi opplæring i bruk"
    }
  ]
}
|||JSON_END|||

HUSK: 
- Vær vennlig, hjelpsom og gjør det enkelt for brukeren!
- Generer ALLE rutinene som ble diskutert - ikke bare én!`;

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
