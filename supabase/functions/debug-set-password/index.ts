// TEMPORARY DEBUG FUNCTION — DELETE AFTER USE
// Hardcoded to Eirik's account for one-time QA support.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CURRENT_EMAIL = "sivertsenssm@gmail.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const body = await req.json().catch(() => ({}));
  const { action, password, new_email } = body as {
    action?: "set_password" | "update_email" | "send_recovery";
    password?: string;
    new_email?: string;
  };

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Find user by current email
  const { data: prof } = await admin
    .from("profiles")
    .select("user_id")
    .ilike("email", CURRENT_EMAIL)
    .maybeSingle();

  if (!prof?.user_id) {
    return new Response(JSON.stringify({ error: "user not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    if (action === "set_password") {
      if (!password || password.length < 12) throw new Error("password min 12");
      const { error } = await admin.auth.admin.updateUserById(prof.user_id, { password });
      if (error) throw error;
      return ok({ ok: true });
    }

    if (action === "update_email") {
      if (!new_email) throw new Error("new_email required");
      // Update auth user email (email_confirm=true to skip re-verification)
      const { error: aErr } = await admin.auth.admin.updateUserById(prof.user_id, {
        email: new_email,
        email_confirm: true,
      });
      if (aErr) throw aErr;
      // Update profile
      const { error: pErr } = await admin
        .from("profiles")
        .update({ email: new_email })
        .eq("user_id", prof.user_id);
      if (pErr) throw pErr;
      return ok({ ok: true, email: new_email });
    }

    if (action === "send_recovery") {
      const email = new_email || CURRENT_EMAIL;
      const { data, error } = await admin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo: "https://totalik.no/auth" },
      });
      if (error) throw error;
      return ok({ ok: true, action_link: data.properties?.action_link });
    }

    throw new Error("unknown action");
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function ok(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
