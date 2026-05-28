// TEMPORARY DEBUG FUNCTION — DELETE IMMEDIATELY AFTER USE
// Hardcoded to Eirik's account only for one-time QA test.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_EMAIL = "sivertsenssm@gmail.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const { password } = await req.json().catch(() => ({}));
  if (!password || password.length < 12) {
    return new Response(JSON.stringify({ error: "password (min 12 chars) required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: prof } = await admin
    .from("profiles")
    .select("user_id")
    .ilike("email", ALLOWED_EMAIL)
    .maybeSingle();

  if (!prof?.user_id) {
    return new Response(JSON.stringify({ error: "user not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { error } = await admin.auth.admin.updateUserById(prof.user_id, { password });
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
