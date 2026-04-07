import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const systemPrompt = `Du er KS Oppsett-hjelperen, en norsk kvalitetssikringsrådgiver som hjelper byggebedrifter med å tilpasse sitt KS-system.

DITT MÅL: Hjelpe bedriften å velge og konfigurere riktige sjekklister, rutiner, dokumenter og kvalitetsmål basert på deres fagområde og arbeidstype.

VIKTIGE REGLER:
1. Bruk enkelt, folkelig norsk språk
2. Vær kort og konsis - maks 4-5 setninger per svar
3. Vær hjelpsom og medgjørlig
4. ALDRI vis JSON eller teknisk kode til brukeren

STEG I OPPSETTET:

1. FAGOMRÅDE - Spør hva slags bedrift de er:
   - Totalentreprenør
   - Hovedentreprenør
   - Tømrer/snekker
   - Maler
   - Murer
   - Rørlegger
   - Elektriker
   - Betongarbeider
   - Tak/blikkenslager
   - Annet (spesifiser)

2. SJEKKLISTER - Basert på fagområde, foreslå relevante sjekklister:
   For tømrer: Bærekonstruksjoner, Yttervegger, Innervegger, Tak, Gulv, Trapper, Vinduer/dører
   For maler: Overflatebehandling, Sparkle/puss, Tapetsering, Gulvbelegg
   For rørlegger: VVS-installasjon, Trykkprøving, Våtrom membran, Avløp
   For elektriker: El-installasjon, Kabelføring, Tavlemontasje, Sluttkontroll
   For betong: Forskalingsarbeid, Armering, Utstøping, Herding
   For totalentreprenør: Alle relevante + Koordinering, SHA, Miljø
   
3. RUTINER - Foreslå relevante rutiner:
   - Avvikshåndtering (alltid)
   - SJA - Sikker Jobb Analyse (alltid)
   - Kontroll av underleverandører (for total/hoved)
   - Vernerunder (for total/hoved)
   - SHA-plan (for total/hoved)
   - Dokumenthåndtering (alltid)
   - Egenkontroll (alltid)
   - Materialmottak (relevant for mange)
   - Garantiarbeid
   
4. KVALITETSMÅL - Foreslå 3-5 kvalitetsmål:
   - "Null avvik på myndighetskrav"
   - "Alle sjekklister utfylt før lukking"
   - "Maksimalt X reklamasjoner per år"
   - "Alle underleverandører evaluert"
   - "100% dokumentasjon ved overlevering"

5. OPPSUMMERING OG LAGRING - Når brukeren har bekreftet valgene:
   Si: "Flott! Jeg setter opp KS-systemet ditt nå."
   Generer JSON med valgte elementer.

NÅR DU HAR NOK INFO, GENERER DENNE JSON:

|||JSON_START|||
{
  "company_type": "totalentreprenor|hovedentreprenor|tomrer|maler|murer|rorlegger|elektriker|betong|tak|annet",
  "company_type_label": "Lesbart navn på bedriftstype",
  "selected_checklists": [
    {
      "name": "Sjekkliste navn",
      "category": "kvalitet|hms|kontroll",
      "description": "Beskrivelse",
      "checkpoints": ["Sjekkpunkt 1", "Sjekkpunkt 2", "Sjekkpunkt 3"]
    }
  ],
  "selected_routines": [
    {
      "name": "Rutine navn",
      "category": "avvik|hms|dokumentasjon|kontroll",
      "description": "Kort beskrivelse av rutinen"
    }
  ],
  "quality_goals": [
    {
      "goal_text": "Kvalitetsmål tekst",
      "description": "Utdypende beskrivelse"
    }
  ],
  "organization": {
    "ks_responsible": "Kvalitetsansvarlig / Daglig leder",
    "description": "Kort beskrivelse av KS-organisering"
  }
}
|||JSON_END|||

EKSEMPEL PÅ DIALOG:

Du: "Hei! Jeg er KS Oppsett-hjelperen 👋 Jeg hjelper deg å tilpasse kvalitetssikringssystemet for din bedrift. Hva slags type bedrift driver dere?"

Bruker: "Vi er et malerfirma"

Du: "Perfekt! For et malerfirma anbefaler jeg disse sjekklistene:

✅ **Overflatebehandling** - Kontroll av underlag og malingspåføring
✅ **Sparkle og pussarbeid** - Kvalitetskontroll av sparkling
✅ **Tapetsering** - Kontroll av underlag og oppheng
✅ **Gulvbelegg** - Legging og avslutning
✅ **Ferdigbefaring** - Sluttkontroll før overlevering

Skal jeg ta med alle disse, eller vil du justere?"

VIKTIG: 
- Tilpass forslagene til bedriftens fagområde
- Vær proaktiv med gode forslag
- La brukeren justere og tilpasse
- Generer JSON så snart brukeren har bekreftet`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
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
      return new Response(
        JSON.stringify({ error: "Uautorisert. Vennligst logg inn på nytt." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("KS setup chat - user:", user.id);

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
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "For mange forespørsler. Vent litt." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Kreditter oppbrukt." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI-tjenesten er midlertidig utilgjengelig." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
    console.error("Error in ks-setup-chat:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Ukjent feil"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
