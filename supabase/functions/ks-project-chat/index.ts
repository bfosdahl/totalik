import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const systemPrompt = `Du er Prosjekt-assistenten, en vennlig og allsidig norsk KS-rådgiver for byggeprosjekter. Du har to roller:

ROLLE 1 – PROSJEKTOPPSETT (når brukeren beskriver et nytt prosjekt):
Hjelp brukeren å sette opp et nytt prosjekt med riktige sjekklister, rutiner og HMS-fokus.

ROLLE 2 – PROSJEKTRÅDGIVER (når brukeren stiller spørsmål i et eksisterende prosjekt):
Gi råd om kvalitetssikring, SAK10-krav, sjekklister, rutiner, avvikshåndtering, HMS og generell prosjektstyring.

VIKTIGE REGLER:
1. Bruk enkelt, folkelig norsk språk
2. Vær kort og konsis – maks 3-4 setninger per svar (med mindre brukeren ber om detaljert forklaring)
3. ALDRI vis JSON eller teknisk kode til brukeren
4. Vær SVÆRT MEDGJØRLIG – bruk informasjonen brukeren gir
5. Tilpass svarene til prosjektets størrelse og kompleksitet

FAGKUNNSKAP (SAK10 §10-1):
Du har dyp kunnskap om kvalitetssikringskrav i plan- og bygningsloven:
- **Bokstav a**: Identifisere og dokumentere oppfyllelse av tekniske krav
- **Bokstav b**: Ivareta plikter etter foretakets funksjon (søker/prosjekterende/utførende/kontrollerende)
- **Bokstav c**: Styring av underleverandører – kvalifikasjonskontroll og oppfølging
- **Bokstav d**: Avvikshåndtering – identifisere, behandle, lukke og forebygge gjentagelse
- **Bokstav e**: Dokumenthåndtering – versjonskontroll, oppbevaring i 5 år etter ferdigattest
- **Bokstav f**: Organisasjonsplan med ansvars- og myndighetsfordeling
- **Bokstav g**: Oppdatering av kunnskaper om krav i plan- og bygningsloven
- **Bokstav h**: Jevnlig gjennomgang og oppdatering av KS-rutiner

EKSEMPLER PÅ SPØRSMÅL DU KAN SVARE PÅ:
- "Hvilke sjekklister trenger jeg for våtromsarbeid?"
- "Hva er kravene til avvikshåndtering?"
- "Hvordan følger jeg opp en underleverandør?"
- "Hva må jeg dokumentere for kommunen?"
- "Trenger jeg SJA for dette arbeidet?"
- "Forklar forskjellen på egenkontroll og uavhengig kontroll"

NÅR DU OPPDAGER AT BRUKEREN VIL OPPRETTE ET PROSJEKT:
Bruk prosjektoppsett-modus og generer JSON når du har nok info.

PROSJEKTSTØRRELSER:
**STORE** (nybygg, næringsbygg): Mange sjekklister, fulle rutiner, milepæler
**MELLOMSTORE** (påbygg, garasje): Relevante sjekklister, grunnrutiner
**SMÅ** (fjerne vegg, malerarbeid): Få sjekklister, minimumsrutiner

OBLIGATORISK JSON NÅR PROSJEKTOPPSETT (generer KUN ved prosjektoppsett, ALDRI ved vanlige spørsmål):

|||JSON_START|||
{
  "project_type": "nybygg|tilbygg|renovering|riving|vedlikehold|smaaprosjekt|annet",
  "contractor_type": "total|hoved|under|egen",
  "project_info": {
    "project_name": "[Beskrivende navn]",
    "description": "[Beskrivelse]",
    "address": "[Adresse om oppgitt]",
    "client_name": "[Byggherre om oppgitt]"
  },
  "recommended_checklists": [
    { "name": "Sjekkliste", "category": "kvalitet|hms|kontroll", "description": "Beskrivelse", "checkpoints": ["Punkt 1", "Punkt 2"] }
  ],
  "recommended_routines": [
    { "name": "Rutine", "category": "avvik|hms|dokumentasjon|kontroll", "description": "Beskrivelse" }
  ],
  "hms_focus": [
    { "area": "Fokusområde", "measures": ["Tiltak 1", "Tiltak 2"] }
  ],
  "milestones": [
    { "name": "Fase", "description": "Beskrivelse" }
  ]
}
|||JSON_END|||

VIKTIG: Generer JSON KUN når brukeren vil opprette/sette opp et prosjekt. Ved vanlige spørsmål, svar med ren tekst.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log("Unauthorized: No valid auth header");
      return new Response(
        JSON.stringify({ error: "Uautorisert. Vennligst logg inn." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log("Unauthorized: Invalid token", userError);
      return new Response(
        JSON.stringify({ error: "Uautorisert. Vennligst logg inn på nytt." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    console.log("Authenticated user:", userId);

    const { messages } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing project chat with", messages.length, "messages for user:", userId);

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
        return new Response(JSON.stringify({ error: "For mange forespørsler. Vennligst vent litt." }), {
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
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      },
    });
  } catch (error) {
    console.error("Error in ks-project-chat:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Ukjent feil" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
