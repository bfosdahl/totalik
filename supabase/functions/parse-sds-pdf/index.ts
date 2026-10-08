import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAiGateway, AI_CHAT_MODEL } from "../_shared/ai-gateway.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `Du er en ekspert på sikkerhetsdatablader (SDS) for kjemikalier og kjemisk risikovurdering. Din oppgave er å analysere tekst fra et sikkerhetsdatablad og ekstrahere relevant informasjon, samt foreslå en risikovurdering.

Du skal returnere en JSON-struktur med følgende felt:
- product_name: Produktnavnet/kjemikalienavnet
- manufacturer: Produsent eller leverandør (hvis funnet)
- danger_classes: En liste over relevante fareklasser på norsk. Velg fra disse:
  * "Brannfarlig" - for brennbare stoffer
  * "Oksiderende" - for oksiderende stoffer
  * "Eksplosiv" - for eksplosive stoffer
  * "Giftig" - for giftige stoffer
  * "Etsende" - for etsende stoffer
  * "Irriterende" - for irriterende stoffer
  * "Helseskadelig" - for helseskadelige stoffer
  * "Miljøskadelig" - for miljøskadelige stoffer
  * "Gass under trykk" - for komprimerte gasser
- notes: Viktig tilleggsinformasjon som førstehjelpstiltak, lagringsanvisninger, eller verneutstyr (kort oppsummert)
- risk_assessment: Et objekt med forslag til risikovurdering basert på stoffets egenskaper:
  * exposure_types: Liste over relevante eksponeringstyper. Velg fra: "innånding", "hudkontakt", "svelging", "øyekontakt"
  * exposure_level: Foreslått eksponeringsnivå. Velg fra: "lav", "middels", "høy"
  * exposure_duration: Foreslått varighet. Velg fra: "kort", "periodisk", "langvarig"
  * hazard_severity: Alvorlighetsgrad 1-5 (1=ubetydelig, 5=kritisk). Basér på H-setninger og fareklasser.
  * exposure_probability: Sannsynlighet 1-5 (1=svært lite, 5=svært sannsynlig). Basér på typisk bruk av produktet.
  * required_ppe: Liste over påkrevd verneutstyr. Velg fra: "Vernebriller", "Ansiktsskjerm", "Kjemikalieresistente hansker", "Åndedrettsvern", "Verneforkle/drakt", "Vernestøvler"
  * work_tasks: Liste med typiske arbeidsoppgaver der stoffet brukes (maks 3), hvert objekt har "description" og "frequency" (velg fra: "daglig", "ukentlig", "månedlig", "sjelden")
  * conclusion: En kort konklusjon (2-3 setninger) om risikoen ved bruk av dette stoffet og viktigste tiltak

Analyser H-setninger (faresetninger) og P-setninger (sikkerhetssetninger) for å bestemme riktige fareklasser og risikovurdering.

I tillegg til feltene over skal du ta med disse feltene. Bruk tom streng eller tom liste når opplysningen ikke står i dokumentet. ALDRI finn på verdier, og ALDRI legg til verneutstyr (required_ppe) som ikke er nevnt i dokumentet:

- cas_numbers: liste, ett objekt per komponent/stoff som er oppgitt. Hvert objekt har "name" (komponentnavn), "cas" (CAS-nummer), "ec" (EC-/EC/NLP-nummer) og "percentage" (mengde/prosent slik det står). Utelat en nøkkel eller bruk tom streng når den ikke står.
- hazard_statements: liste over faresetninger. Hvert objekt har "code" (f.eks. "H225" eller, når dokumentet bare har gamle R-setninger, "R11") og "text" (setningsteksten slik den står).
- signal_word: varselsord slik det står, f.eks. "Fare" eller "Advarsel". Tom streng hvis det ikke står.
- revision_date: revisjonsdato eller utgivelsesdato på ISO-format YYYY-MM-DD. Tom streng hvis det ikke står.
- emergency_phone: nødtelefonnummer slik det står, inkludert eventuelt navn på tjenesten. Tom streng hvis det ikke står.
- pictograms: liste over farepiktogrammer som faktisk vises, med kode og/eller navn (f.eks. "GHS02" eller "flamme"). Tom liste hvis ingen vises.

VIKTIG: Returner KUN gyldig JSON, ingen annen tekst. Eksempel:
{
  "product_name": "Aceton",
  "manufacturer": "Jotun AS",
  "cas_numbers": [{"name": "Aceton", "cas": "67-64-1", "ec": "200-662-2", "percentage": "100 %"}],
  "hazard_statements": [{"code": "H225", "text": "Meget brannfarlig væske og damp."}, {"code": "H319", "text": "Gir alvorlig øyeirritasjon."}],
  "signal_word": "Fare",
  "revision_date": "2020-02-27",
  "emergency_phone": "Giftinformasjonen: +47 22 59 13 00",
  "pictograms": ["GHS02", "GHS07"],
  "danger_classes": ["Brannfarlig", "Irriterende"],
  "notes": "Bruk vernehansker og vernebriller. Oppbevares utilgjengelig for barn.",
  "risk_assessment": {
    "exposure_types": ["innånding", "hudkontakt", "øyekontakt"],
    "exposure_level": "middels",
    "exposure_duration": "periodisk",
    "hazard_severity": 3,
    "exposure_probability": 3,
    "required_ppe": ["Vernebriller", "Kjemikalieresistente hansker", "Åndedrettsvern"],
    "work_tasks": [
      {"description": "Rengjøring av overflater", "frequency": "daglig"},
      {"description": "Fortynning av maling", "frequency": "ukentlig"}
    ],
    "conclusion": "Aceton er brannfarlig og kan irritere hud og øyne. Bruk alltid verneutstyr og sørg for god ventilasjon. Unngå langvarig hudkontakt."
  }
}`;

// Accepts YYYY-MM-DD or DD.MM.YYYY (also / or -) and returns YYYY-MM-DD, otherwise "".
function toIsoDate(value: unknown): string {
  if (typeof value !== "string") return "";
  const v = value.trim();
  let y: number, m: number, d: number;
  let match = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) { y = +match[1]; m = +match[2]; d = +match[3]; }
  else {
    match = v.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (!match) return "";
    d = +match[1]; m = +match[2]; y = +match[3];
  }
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return "";
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log("Unauthorized: No valid auth header");
      return new Response(
        JSON.stringify({ error: "Uautorisert. Vennligst logg inn." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user with Supabase
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

    const { pdfBase64, fileName } = await req.json();
    
    if (!pdfBase64) {
      return new Response(JSON.stringify({ error: "PDF-data mangler" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Parsing SDS PDF:", fileName, "for user:", userId);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // 3.8 (low) first, automatic fallback to 2.5 on error or after 45 s.
    const response = await callAiGateway(LOVABLE_API_KEY, {
      model: AI_CHAT_MODEL,
      messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: [
              {
                type: "text",
                text: `Analyser dette sikkerhetsdatabladet (SDS) og ekstraher produktinformasjon. Returner KUN JSON.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${pdfBase64}`
                }
              }
            ]
          }
        ],
    }, null, { reasoningEffort: "low", totalTimeoutMs: 45_000 });

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

    const aiResponse = await response.json();
    console.log("AI response received for user:", userId);

    const content = aiResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("Ingen respons fra AI");
    }

    // Parse JSON from response
    let parsedData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Kunne ikke finne JSON i responsen");
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Content:", content);
      return new Response(JSON.stringify({ 
        error: "Kunne ikke tolke PDF-innholdet. Prøv igjen eller fyll ut manuelt.",
        rawContent: content
      }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Parsed SDS data for user:", userId, parsedData);

    const riskAssessment = parsedData.risk_assessment || {};

    return new Response(JSON.stringify({
      success: true,
      data: {
        product_name: parsedData.product_name || "",
        manufacturer: parsedData.manufacturer || "",
        cas_numbers: Array.isArray(parsedData.cas_numbers) ? parsedData.cas_numbers.filter((c: any) => c && typeof c === "object").map((c: any) => ({
          name: typeof c.name === "string" ? c.name : "",
          cas: typeof c.cas === "string" ? c.cas : "",
          ec: typeof c.ec === "string" ? c.ec : "",
          percentage: typeof c.percentage === "string" ? c.percentage : "",
        })) : [],
        hazard_statements: Array.isArray(parsedData.hazard_statements) ? parsedData.hazard_statements.filter((h: any) => h && typeof h === "object").map((h: any) => ({
          code: typeof h.code === "string" ? h.code : "",
          text: typeof h.text === "string" ? h.text : "",
        })) : [],
        signal_word: typeof parsedData.signal_word === "string" ? parsedData.signal_word : "",
        revision_date: toIsoDate(parsedData.revision_date),
        emergency_phone: typeof parsedData.emergency_phone === "string" ? parsedData.emergency_phone : "",
        pictograms: Array.isArray(parsedData.pictograms) ? parsedData.pictograms.filter((p: unknown) => typeof p === "string") : [],
        danger_classes: Array.isArray(parsedData.danger_classes) ? parsedData.danger_classes : [],
        notes: parsedData.notes || "",
        risk_assessment: {
          exposure_types: Array.isArray(riskAssessment.exposure_types) ? riskAssessment.exposure_types : [],
          exposure_level: riskAssessment.exposure_level || "",
          exposure_duration: riskAssessment.exposure_duration || "",
          hazard_severity: typeof riskAssessment.hazard_severity === 'number' ? riskAssessment.hazard_severity : 3,
          exposure_probability: typeof riskAssessment.exposure_probability === 'number' ? riskAssessment.exposure_probability : 3,
          required_ppe: Array.isArray(riskAssessment.required_ppe) ? riskAssessment.required_ppe : [],
          work_tasks: Array.isArray(riskAssessment.work_tasks) ? riskAssessment.work_tasks : [],
          conclusion: riskAssessment.conclusion || "",
        },
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in parse-sds-pdf:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Ukjent feil" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
