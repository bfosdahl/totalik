import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

VIKTIG: Returner KUN gyldig JSON, ingen annen tekst. Eksempel:
{
  "product_name": "Aceton",
  "manufacturer": "Jotun AS",
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

    // Use Gemini with PDF/image support
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
