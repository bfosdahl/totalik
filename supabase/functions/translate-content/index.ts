import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAiGateway, AI_CHAT_MODEL } from "../_shared/ai-gateway.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple hash function for caching
function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

const LANGUAGE_NAMES: Record<string, string> = {
  no: "Norwegian",
  pl: "Polish",
  lt: "Lithuanian",
  lv: "Latvian",
  en: "English",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // --- Auth: require valid user JWT ---
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const userClient = createClient(
    supabaseUrl,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const { content, targetLanguage, contentType = "handbook" } = await req.json();

    if (!content || !targetLanguage) {
      return new Response(
        JSON.stringify({ error: "Missing content or targetLanguage" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Derive companyId server-side from authenticated user (prevents cache poisoning)
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    const companyId = profile?.company_id ?? null;

    const contentHash = hashContent(content);

    // 1. Cache lookup (covers both real translations and "already in target language")
    if (companyId) {
      const { data: cached } = await supabase
        .from("content_translations")
        .select("translated_content, source_language")
        .eq("company_id", companyId)
        .eq("content_hash", contentHash)
        .eq("target_language", targetLanguage)
        .maybeSingle();

      if (cached?.translated_content) {
        return new Response(
          JSON.stringify({
            translatedContent: cached.translated_content,
            cached: true,
            sourceLanguage: cached.source_language,
            sameLanguage: cached.source_language === targetLanguage,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const targetLangName = LANGUAGE_NAMES[targetLanguage] || targetLanguage;

    // 2. Single AI call: detect source language AND translate if needed
    const systemPrompt = `You are a professional translator specializing in workplace safety (HMS/HSE), food safety and quality management systems.

Step 1: Detect the language the user's text is written in. Answer with one of: no, pl, lt, lv, en (or "other").
Step 2: If the detected language is already ${targetLanguage}, do NOT translate — return the text unchanged.
Otherwise translate it to ${targetLangName}.

RULES:
1. Maintain all formatting: headings, bullet points, line breaks, HTML/markdown
2. Keep technical terms accurate for ${targetLangName}-speaking workers
3. No explanations or comments
4. Keep numbers, dates, names and company-specific terms unchanged
5. Professional but accessible tone

Respond ONLY with JSON: {"detected":"<code>","text":"<result>"}`;

    // 3.8 (low) first, automatic fallback to 2.5 on error or after 45 s.
    const response = await callAiGateway(LOVABLE_API_KEY, {
      model: AI_CHAT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: content },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    }, null, { totalTimeoutMs: 45_000 });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[translate-content] AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Translation credits exhausted. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const raw = aiResponse.choices?.[0]?.message?.content;
    if (!raw) throw new Error("No translation received from AI");

    let detected = "no";
    let translatedContent = raw;
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.text === "string" && parsed.text.trim()) {
        translatedContent = parsed.text;
      }
      if (typeof parsed?.detected === "string") {
        detected = parsed.detected.toLowerCase().slice(0, 5);
      }
    } catch {
      // Fallback: treat raw output as the translation
    }

    const sameLanguage = detected === targetLanguage;
    if (sameLanguage) translatedContent = content;

    // 3. Cache result. Also cache the source language against itself so content
    //    written in e.g. Polish never triggers another AI call for Polish users.
    if (companyId) {
      const rows = [{
        company_id: companyId,
        content_hash: contentHash,
        source_language: detected,
        target_language: targetLanguage,
        original_content: content,
        translated_content: translatedContent,
        content_type: contentType,
      }];
      if (!sameLanguage && LANGUAGE_NAMES[detected]) {
        rows.push({
          company_id: companyId,
          content_hash: contentHash,
          source_language: detected,
          target_language: detected,
          original_content: content,
          translated_content: content,
          content_type: contentType,
        });
      }
      await supabase.from("content_translations").upsert(rows, {
        onConflict: "company_id,content_hash,target_language",
      });
    }

    return new Response(
      JSON.stringify({ translatedContent, cached: false, sourceLanguage: detected, sameLanguage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[translate-content] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Translation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
