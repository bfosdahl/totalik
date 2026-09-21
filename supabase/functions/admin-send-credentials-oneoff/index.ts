import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { escapeHtml } from "../_shared/html-escape.ts";
import { DEFAULT_PASSWORD, loginBlockHtml } from "../_shared/default-password.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const secret = req.headers.get("x-cron-secret");
    const expected = Deno.env.get("ADMIN_ACTIONS_SECRET");
    if (!expected || secret !== expected) return json({ error: "unauthorized" }, 401);

    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" && body.password.length >= 8
      ? body.password
      : DEFAULT_PASSWORD;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "invalid email" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const { data: profile } = await admin
      .from("profiles")
      .select("user_id, first_name")
      .ilike("email", email)
      .maybeSingle();

    if (!profile?.user_id) return json({ error: "user not found" }, 404);

    const { error: updErr } = await admin.auth.admin.updateUserById(profile.user_id, {
      password,
      email_confirm: true,
    });
    if (updErr) throw updErr;

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const name = escapeHtml(profile.first_name || "bruker");

    const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
      <h2>Innloggingsinformasjon til Total-IK</h2>
      <p>Hei ${name},</p>
      <p>Her er innloggingsinformasjonen din til Total-IK:</p>
      ${loginBlockHtml(email, null)}
      <hr/><p style="color:#999;font-size:12px;">Total-IK &ndash; Digitalt internkontrollsystem</p>
    </div>`;

    const sendRes = await resend.emails.send({
      from: "Total-IK <noreply@totalik.no>",
      to: [email],
      bcc: ["ben@athenahms.no"],
      subject: "Innloggingsinformasjon - Total-IK",
      html,
    });
    if (sendRes.error) {
      console.error("Resend error", sendRes.error);
      return json({ error: String(sendRes.error.message ?? sendRes.error) }, 502);
    }

    return json({ success: true, id: sendRes.data?.id ?? null });
  } catch (e) {
    console.error("admin-send-credentials-oneoff error:", e);
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});
