import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAiGateway, AI_CHAT_MODEL } from "../_shared/ai-gateway.ts";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userErr } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { tema, bransje, nivaa } = await req.json();
    const tooLong = [tema, bransje, nivaa]
      .filter(Boolean)
      .some((v: any) => typeof v === "string" && v.length > 2000);
    if (tooLong) {
      return new Response(JSON.stringify({ error: "Input er for langt" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    if (!tema) {
      return new Response(JSON.stringify({ error: "Tema er påkrevd" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const detailLevel = nivaa === "kort" ? "3-5" : nivaa === "detaljert" ? "10-15" : "6-8";

    const prompt = `Du er en norsk HMS- og kvalitetssikringsekspert. Lag en komplett rutinemal basert på følgende:

Tema: ${tema}
${bransje ? `Bransje: ${bransje}` : ""}
Detaljnivå: ${nivaa} (${detailLevel} sjekkliste-punkter)

Svar BARE med gyldig JSON (ingen markdown, ingen forklaring) med denne strukturen:
{
  "title": "Rutinens tittel",
  "description": "Kort beskrivelse (1-2 setninger)",
  "purpose": "Formålet med rutinen (2-3 setninger)",
  "module": "en av: ks_ik_bygg, hms, ik_mat, ik_alkohol, felles",
  "subcategory": "underkategori, f.eks. Vernerunde, Renhold, Temperaturlogg",
  "target_roles": ["roller som skal utføre rutinen"],
  "frequency": "en av: daglig, ukentlig, maanedlig, aarlig, ved_behov",
  "steps": [
    {"text": "Beskriv steget", "is_checkbox": true}
  ],
  "legal_refs": ["Relevante lover og forskrifter"],
  "tags": ["relevante", "tagger"]
}

Sørg for at rutinen er praktisk, konkret og følger norsk lovgivning. Skriv på norsk (bokmål).`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // 3.8 (low) first, automatic fallback to 2.5 on error or after 45 s.
    const response = await callAiGateway(LOVABLE_API_KEY, {
      model: AI_CHAT_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }, null, { totalTimeoutMs: 45_000 });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI API error:", errText);
      throw new Error(`AI API returned ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response (handle potential markdown wrapping)
    let routine;
    try {
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      routine = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Kunne ikke tolke AI-svaret");
    }

    return new Response(JSON.stringify({ routine }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    console.error("generate-routine-template error:", error);
    return new Response(JSON.stringify({ error: "En uventet feil oppstod" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
