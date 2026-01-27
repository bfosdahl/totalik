import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  en: "English",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, targetLanguage, contentType = "handbook", companyId } = await req.json();

    if (!content || !targetLanguage) {
      return new Response(
        JSON.stringify({ error: "Missing content or targetLanguage" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If target is Norwegian, just return the original
    if (targetLanguage === "no") {
      return new Response(
        JSON.stringify({ translatedContent: content, cached: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first
    const contentHash = hashContent(content);
    
    if (companyId) {
      const { data: cached } = await supabase
        .from("content_translations")
        .select("translated_content")
        .eq("company_id", companyId)
        .eq("content_hash", contentHash)
        .eq("target_language", targetLanguage)
        .maybeSingle();

      if (cached?.translated_content) {
        console.log("[translate-content] Cache hit for", targetLanguage);
        return new Response(
          JSON.stringify({ translatedContent: cached.translated_content, cached: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Call Lovable AI for translation
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const targetLangName = LANGUAGE_NAMES[targetLanguage] || targetLanguage;

    const systemPrompt = `You are a professional translator specializing in workplace safety (HMS/HSE) and quality management systems.
Translate the following Norwegian text to ${targetLangName}.

IMPORTANT RULES:
1. Maintain all formatting, including headings, bullet points, and structure
2. Keep technical terms accurate and appropriate for ${targetLangName}-speaking workers
3. Preserve any HTML or markdown formatting
4. Do not add explanations - only provide the translation
5. Keep numbers, dates, and company-specific terms unchanged
6. Maintain a professional but accessible tone`;

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
          { role: "user", content: content },
        ],
        temperature: 0.3, // Lower temperature for more consistent translations
      }),
    });

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
    const translatedContent = aiResponse.choices?.[0]?.message?.content;

    if (!translatedContent) {
      throw new Error("No translation received from AI");
    }

    // Cache the translation
    if (companyId) {
      await supabase.from("content_translations").upsert({
        company_id: companyId,
        content_hash: contentHash,
        source_language: "no",
        target_language: targetLanguage,
        original_content: content,
        translated_content: translatedContent,
        content_type: contentType,
      }, {
        onConflict: "company_id,content_hash,target_language",
      });
    }

    console.log("[translate-content] Successfully translated to", targetLanguage);

    return new Response(
      JSON.stringify({ translatedContent, cached: false }),
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
