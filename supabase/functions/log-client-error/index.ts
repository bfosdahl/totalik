import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      error_message,
      error_stack,
      component_stack,
      url,
      user_agent,
      source,
      metadata,
    } = await req.json();

    if (!error_message) {
      return new Response(
        JSON.stringify({ error: "error_message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Require authentication — drop logs from unauthenticated callers
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userErr } = await anonClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const userId: string = userData.user.id;

    // Insert with service role (after rate limit check)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Rate limit: max 30 error logs per minute per user
    const { data: rateOk } = await supabaseAdmin.rpc("check_rate_limit", {
      p_user_id: userId,
      p_function_name: "log-client-error",
      p_max_requests: 30,
      p_window_minutes: 1,
    });
    if (rateOk === false) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: insertError } = await supabaseAdmin
      .from("client_error_logs")
      .insert({
        user_id: userId,
        error_message: String(error_message).slice(0, 2000),
        error_stack: error_stack ? String(error_stack).slice(0, 5000) : null,
        component_stack: component_stack ? String(component_stack).slice(0, 3000) : null,
        url: url ? String(url).slice(0, 2000) : null,
        user_agent: user_agent ? String(user_agent).slice(0, 500) : null,
        source: source || "unknown",
        metadata: metadata ?? null,
      });

    if (insertError) {
      console.error("Failed to insert error log:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to log error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("log-client-error failed:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
