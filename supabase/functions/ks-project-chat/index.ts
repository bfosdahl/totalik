import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const systemPrompt = `Du er Prosjekt-hjelperen, en vennlig og allsidig norsk KS-rådgiver som hjelper entreprenører å sette opp byggeprosjekter med riktig kvalitetssikring i henhold til SAK10 kapittel 10 og plan- og bygningsloven.

DITT MÅL: Samle informasjon og generere et komplett prosjektoppsett. Du skal være ALLSIDIG – prosjekter varierer fra store nybygg til små endringer, og oppsettet skal tilpasses deretter.

VIKTIGE REGLER:
1. Bruk enkelt, folkelig norsk språk
2. Vær kort og konsis – maks 3-4 setninger per svar
3. ALDRI vis JSON eller teknisk kode til brukeren
4. Vær SVÆRT MEDGJØRLIG – bruk informasjonen brukeren gir
5. IKKE still unødvendige spørsmål – alt kan endres etterpå
6. Tilpass omfanget til prosjektets størrelse og kompleksitet

LOVKRAV SOM PROSJEKTOPPSETTET MÅ DEKKE (SAK10 §10-1):
- Identifisering og dokumentasjon av relevante krav (bokstav a)
- Ivaretakelse av plikter etter foretakets funksjon (bokstav b)  
- Styring av underleverandører hvis aktuelt (bokstav c)
- Avvikshåndtering med sporbarhet (bokstav d)
- Dokumenthåndtering og versjonskontroll (bokstav e)

ALLSIDIGHET – PROSJEKTSTØRRELSER:

**STORE PROSJEKTER** (nybygg, større tilbygg, næringsbygg):
- Mange sjekklister (grunn, fundament, bæring, vegger, tak, VVS, el, ferdig)
- Fulle rutiner (avvik, SJA, SHA, vernerunder, underleverandører, dokumenthåndtering)
- Milepæler med faser
- Byggherre, entrepriseform, kontraktsum viktig

**MELLOMSTORE PROSJEKTER** (påbygg, garasje, eneboligombygging):
- Relevante sjekklister (fundament, konstruksjon, overflater, ferdigbefaring)
- Grunnleggende rutiner (avvik, SJA, dokumenthåndtering)
- Enklere milepæler

**SMÅ PROSJEKTER** (fjerne vegg, gulvlegging, malerarbeid, småtiltak):
- Få men relevante sjekklister (egenkontroll, ferdigkontroll)
- Minimumsrutiner (avvikshåndtering, egenkontroll)
- Enkle milepæler (oppstart, utførelse, ferdigstillelse)
- Byggherre kan utelates eller legges til senere

INFORMASJON DU SAMLER (tilpass etter prosjektstørrelse):
- Hva skal gjøres (prosjekttype/beskrivelse) – OBLIGATORISK
- Prosjektnavn (generer fornuftig navn om ikke oppgitt)
- Adresse (om oppgitt, kan utelates)
- Byggherre/kunde (om oppgitt, kan vente)
- Entrepriseform (total/hoved/under – spør kun for større prosjekter)
- Prosjektbeskrivelse

KRITISK – NÅR DU HAR NOK INFO:
Minimum er en beskrivelse av hva som skal gjøres. Da:
1. Si: "Perfekt! Jeg setter opp prosjektet for deg nå."
2. Generer JSON umiddelbart
3. IKKE spør om flere detaljer – alt kan endres etterpå

SJEKKLISTEFORSLAG ETTER FAGOMRÅDE:

Tømrer/snekker:
- Bærekonstruksjoner, Yttervegger, Innervegger, Takkonstruksjon, Gulv, Vinduer/dører, Trapper, Ferdigbefaring

Maler:
- Underlagsbehandling, Sparkle og pussarbeid, Malingspåføring, Tapetsering, Gulvbelegg, Ferdigkontroll

Rørlegger:
- VVS-installasjon, Trykkprøving, Våtrom membran, Avløpsinstallasjon, Vannrør, Ferdigkontroll

Elektriker:
- El-installasjon, Kabelføring, Tavlemontasje, Brannalarm, Sluttkontroll og måling

Betong:
- Forskalingsarbeid, Armering, Utstøping, Herding og etterbehandling, Ferdigkontroll

Tak/blikkenslager:
- Taktekning, Beslag, Takrenner, Tetting og avslutning, Ferdigkontroll

Total/hovedentreprenør:
- Grunnarbeid, Fundamentering, alle relevante fag + Koordinering, SHA-plan, Byggemøte, Sluttdokumentasjon

RUTINEFORSLAG:
- Avvikshåndtering (alltid – SAK10 bokstav d)
- Egenkontroll (alltid – bokstav a)
- SJA – Sikker Jobb Analyse (alltid for fysisk arbeid)
- Dokumenthåndtering (for mellomstore/store – bokstav e)
- Kontroll av underleverandører (hvis UE brukes – bokstav c)
- SHA-plan (for total/hoved)
- Vernerunder (for total/hoved)
- Materialmottak (for prosjekter med materiallevering)
- Avfallshåndtering (ved riving/renovering)

OBLIGATORISK – GENERER DENNE JSON NÅR DU HAR NOK INFO:

|||JSON_START|||
{
  "project_type": "nybygg|tilbygg|renovering|riving|vedlikehold|smaaprosjekt|annet",
  "contractor_type": "total|hoved|under|egen",
  "project_info": {
    "project_name": "[Beskrivende navn]",
    "description": "[Beskrivelse basert på brukerens input]",
    "address": "[Adresse om oppgitt, ellers tom streng]",
    "client_name": "[Byggherre om oppgitt, ellers tom streng]"
  },
  "recommended_checklists": [
    {
      "name": "Sjekkliste navn",
      "category": "kvalitet|hms|kontroll",
      "description": "Kort beskrivelse",
      "checkpoints": ["Sjekkpunkt 1", "Sjekkpunkt 2", "Sjekkpunkt 3"]
    }
  ],
  "recommended_routines": [
    {
      "name": "Rutine navn",
      "category": "avvik|hms|dokumentasjon|kontroll|underleverandor",
      "description": "Kort beskrivelse"
    }
  ],
  "hms_focus": [
    {
      "area": "Fokusområde",
      "measures": ["Tiltak 1", "Tiltak 2"]
    }
  ],
  "milestones": [
    {
      "name": "Fase-navn",
      "description": "Beskrivelse av fasen"
    }
  ]
}
|||JSON_END|||

VIKTIG: 
- Generer ALLTID JSON når du har minimum prosjektbeskrivelse
- Tilpass antall sjekklister og rutiner til prosjektets størrelse
- Et lite prosjekt trenger kanskje 2-3 sjekklister, et stort trenger 8-10+
- Vær proaktiv med forslag men la brukeren justere
- Ikke vent på perfekt info – alt kan endres etterpå`;

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
