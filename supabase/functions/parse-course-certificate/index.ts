import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { fileBase64, fileName, fileType } = await req.json();

    if (!fileBase64) {
      return new Response(
        JSON.stringify({ error: "Missing file data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine media type
    let mediaType = "application/pdf";
    if (fileType?.includes("image")) {
      mediaType = fileType;
    } else if (fileName?.toLowerCase().endsWith(".jpg") || fileName?.toLowerCase().endsWith(".jpeg")) {
      mediaType = "image/jpeg";
    } else if (fileName?.toLowerCase().endsWith(".png")) {
      mediaType = "image/png";
    }

    const prompt = `Du er en ekspert på å lese norske kursbevis og sertifikater. Analyser dette dokumentet og trekk ut følgende informasjon:

1. Kursnavn / Sertifikatnavn
2. Kursleverandør / Utsteder
3. Sertifikatnummer (hvis oppgitt)
4. Fullført dato / Utstedelsesdato (format: YYYY-MM-DD)
5. Utløpsdato eller gyldighetsperiode (i antall år fra fullført dato)

Svar ALLTID i følgende JSON-format, selv om du ikke finner all informasjon:
{
  "course_name": "navnet på kurset",
  "course_provider": "kursleverandør eller utsteder",
  "certificate_number": "sertifikatnummer hvis funnet, ellers null",
  "completed_date": "YYYY-MM-DD format hvis funnet, ellers null",
  "validity_years": antall år gyldig som tall, eller null hvis ikke oppgitt,
  "notes": "eventuelle andre relevante detaljer"
}

Vær nøye med datoer - konverter alle datoer til YYYY-MM-DD format.
Hvis dokumentet er et HMS-kort, varme arbeider-sertifikat, truckkurs, eller lignende norsk sertifikat, gjenkjenn dette.`;

    // Use Lovable AI with Gemini Flash
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mediaType};base64,${fileBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract JSON from response
    let parsedData = {
      course_name: null,
      course_provider: null,
      certificate_number: null,
      completed_date: null,
      validity_years: null,
      notes: null,
    };

    try {
      // Try to find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Failed to parse JSON from AI response:", parseError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: parsedData,
        rawResponse: content 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error parsing certificate:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});