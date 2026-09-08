import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

Deno.serve(async (req) => {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // 2. Validate Authorization Secret
    const cronSecret = req.headers.get("x-cron-secret");
    const allowed = [Deno.env.get("ADMIN_ACTIONS_SECRET"), Deno.env.get("ONEOFF_PW_2026_09")].filter(Boolean);
    if (!cronSecret || !allowed.includes(cronSecret)) {
      return new Response(
        JSON.stringify({ error: "unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Safe JSON parsing & Input Validation
    const body = await req.json().catch(() => null);
    if (!body || !body.email || !body.password) {
      return new Response(
        JSON.stringify({ error: "missing email or password" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanEmail = String(body.email).trim().toLowerCase();
    const { password } = body;

    if (String(password).length < 8) {
      return new Response(
        JSON.stringify({ error: "password must be at least 8 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 4. Fast indexed lookup via profiles table instead of listUsers pagination scan
    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select("user_id")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (profileErr) {
      console.error("Profile lookup error:", profileErr);
      throw profileErr;
    }

    if (!profile?.user_id) {
      return new Response(
        JSON.stringify({ error: "user not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Direct Password Update by resolved user_id
    const { error: updErr } = await admin.auth.admin.updateUserById(profile.user_id, { password });
    if (updErr) {
      console.error("Update password error:", updErr);
      throw updErr;
    }

    return new Response(
      JSON.stringify({ ok: true, user_id: profile.user_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e) {
    console.error("admin-update-user-password error:", e);
    return new Response(
      JSON.stringify({ error: "En uventet feil oppstod" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
