import { createClient } from "npm:@supabase/supabase-js@2";
import { DEFAULT_PASSWORD, loginBlockHtml } from "../_shared/default-password.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const secret = req.headers.get("x-cron-secret");
    const expected = Deno.env.get("ADMIN_ACTIONS_SECRET");
    if (!expected || secret !== expected) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "missing email" }), { status: 400, headers: corsHeaders });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: profile, error: profErr } = await admin
      .from("profiles")
      .select("user_id, email, first_name, companies(name)")
      .ilike("email", email)
      .maybeSingle();
    if (profErr) throw profErr;
    if (!profile?.user_id) {
      return new Response(JSON.stringify({ error: "user not found" }), { status: 404, headers: corsHeaders });
    }

    const { error: pwErr } = await admin.auth.admin.updateUserById(profile.user_id, {
      password: DEFAULT_PASSWORD,
    });
    if (pwErr) throw pwErr;

    const companyName = (profile.companies as any)?.name || "Total-IK";
    const firstName = profile.first_name || "";

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h1 style="color:#1a1a2e;text-align:center;margin:0 0 24px 0;">Innlogging til Total-IK</h1>
        <p style="color:#333;font-size:16px;">Hei${firstName ? ` ${firstName}` : ""},</p>
        <p style="color:#333;font-size:16px;">Her er innloggingsinformasjonen din til Total-IK for ${companyName}.</p>
        ${loginBlockHtml(profile.email)}
        <hr style="border:none;border-top:1px solid #eee;margin:30px 0;">
        <p style="color:#999;font-size:12px;text-align:center;">Automatisk e-post fra Total-IK.</p>
      </div>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Total-IK <noreply@totalik.no>",
        to: [profile.email],
        subject: "Innlogging til Total-IK",
        html,
      }),
    });
    const body = await res.text();
    if (!res.ok) {
      return new Response(JSON.stringify({ error: "resend failed", status: res.status, details: body }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, sent_to: profile.email, details: body }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
