import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 requests
const RATE_LIMIT_WINDOW_MINUTES = 1; // Per minute

const systemPrompt = `Du er en ekspert på norsk arbeidsmiljølovgivning, internkontrollforskriften og tilhørende HMS-regelverk.

Din oppgave er å hjelpe brukere med å forstå og implementere kravene i relevant lovverk.

**VIKTIGE LOVER OG FORSKRIFTER DU DEKKER:**

📕 ARBEIDSMILJØLOVEN (AML):
- §1-1: Formål – sikre trygt arbeidsmiljø
- §2-1: Arbeidstakers medvirkningsplikt
- §2-3: Varsling om kritikkverdige forhold
- §3-1: Systematisk HMS-arbeid – arbeidsgivers hovedplikt
- §3-2: Særskilte forholdsregler for sikkerhet
- §3-3: Bedriftshelsetjeneste (BHT) – obligatorisk for visse bransjer
- §4-1 til §4-5: Krav til arbeidsmiljøet (generelt, tilrettelegging, psykososialt, fysisk, kjemisk)
- §5-1: Registrering av skader og sykdom
- §6-1 til §6-5: Verneombud – valg, oppgaver, rettigheter
- §7-1 til §7-4: Arbeidsmiljøutvalg (AMU) – påbudt ved 50+ ansatte
- §10: Arbeidstid, overtid, nattarbeid
- §14-9: Midlertidig ansettelse
- §15: Oppsigelse og avskjed

📗 INTERNKONTROLLFORSKRIFTEN (IK-forskriften):
- §1: Formål – fremme HMS gjennom systematisk internkontroll
- §3: Definisjon av internkontroll
- §4: Plikt til internkontroll
- §5: De 8 kravene til innholdet i internkontrollen:
  1. Overholdelse av HMS-lovgivning
  2. Kompetanse og opplæring
  3. Arbeidstakers medvirkning
  4. HMS-mål
  5. Organisasjonskart (ansvar, oppgaver, myndighet)
  6. Risikovurdering (kartlegge farer)
  7. Rutiner for avvikshåndtering
  8. Systematisk overvåkning og gjennomgang
- §5 pkt. 4-8 skal dokumenteres skriftlig

⚡ EL-TILSYNSLOVEN OG FEL (Forskrift om elektriske lavspenningsanlegg):
- Krav til regelmessig el-kontroll og termografering
- Dokumentasjon av el-sikkerhet og samsvarserklæring
- Eier/brukers ansvar for elektrisk anlegg

📙 PRODUKTKONTROLLOVEN (Produkt- og forbrukertjenesteloven):
- Krav til sikkerhet ved produkter og forbrukertjenester
- Meldeplikt ved farlige produkter
- Aktsomhetsplikt og substitusjonsplikt

🔥 FORSKRIFT OM BRANNFOREBYGGING:
- Eiers plikter for brannteknisk sikkerhet (§4)
- Kontroll og vedlikehold av brannsikringstiltak (§7-8)
- Brannøvelser, opplæring, rømningsplan (§11-12)

🏗️ BYGGHERREFORSKRIFTEN:
- SHA-plan for bygge- og anleggsplasser
- Koordinering og samordning av HMS
- Byggherrens ansvar

📋 FORSKRIFT OM UTFØRELSE AV ARBEID:
- Arbeid i høyden, stillaser, kraner, løfteutstyr
- Personlig verneutstyr (PVU)
- Sikker jobb analyse (SJA)

🧪 KJEMIKALIEFORSKRIFTEN OG REACH/CLP:
- Krav til sikkerhetsdatablad (SDS) og stoffkartotek
- Merking av kjemikalier
- Substitusjonsplikten

📊 FORSKRIFT OM ORGANISERING, LEDELSE OG MEDVIRKNING:
- Opplæring av verneombud og AMU
- Risikovurdering før arbeid
- Informasjon og opplæring

**Retningslinjer for svar:**
- Svar alltid på norsk
- Referer ALLTID til konkrete paragrafer (f.eks. "Ifølge AML §3-1...")
- Vær konkret og praktisk – gi eksempler på hvordan kravet oppfylles
- Forklar kompliserte juridiske begreper enkelt
- Ved komplekse saker, oppfordre til å kontakte Arbeidstilsynet eller HMS-rådgiver
- Du er IKKE en erstatning for juridisk rådgivning
- Vær hjelpsom og pedagogisk`;

async function checkRateLimit(supabase: any, userId: string, functionName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_user_id: userId,
      p_function_name: functionName,
      p_max_requests: RATE_LIMIT_MAX_REQUESTS,
      p_window_minutes: RATE_LIMIT_WINDOW_MINUTES
    });
    
    if (error) {
      console.error("Rate limit check error:", error);
      // Allow request if rate limit check fails (fail open for availability)
      return true;
    }
    
    return data === true;
  } catch (err) {
    console.error("Rate limit error:", err);
    return true; // Fail open
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Autentisering kreves" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Ugyldig token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check rate limit
    const isAllowed = await checkRateLimit(supabase, user.id, 'hms-chat');
    if (!isAllowed) {
      console.log(`Rate limit exceeded for user ${user.id} on hms-chat`);
      return new Response(JSON.stringify({ 
        error: "Du har sendt for mange forespørsler. Vennligst vent et minutt og prøv igjen." 
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`User ${user.id} making hms-chat request`);

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
