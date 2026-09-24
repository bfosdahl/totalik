import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { escapeHtml } from "../_shared/html-escape.ts";
import { DEFAULT_PASSWORD, loginBlockHtml } from "../_shared/default-password.ts";
import { brandedEmail } from "../_shared/email-brand.ts";

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
    const alt = Deno.env.get("ONEOFF_MTV_SECRET");
    const alt2 = Deno.env.get("ONEOFF_VIGGO_SECRET");
    const ok = (expected && secret === expected) || (alt && secret === alt) || (alt2 && secret === alt2);
    if (!ok) return json({ error: "unauthorized" }, 401);

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

    const previewOnly = body?.preview === true;

    const { data: profile } = await admin
      .from("profiles")
      .select("user_id, first_name")
      .ilike("email", email)
      .maybeSingle();

    if (!previewOnly) {
      if (!profile?.user_id) return json({ error: "user not found" }, 404);

      const { error: updErr } = await admin.auth.admin.updateUserById(profile.user_id, {
        password,
        email_confirm: true,
      });
      if (updErr) throw updErr;
    }

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const name = escapeHtml(profile.first_name || "bruker");

    const extraHtml = typeof body?.extra_html === "string" ? body.extra_html : "";
    const subject = typeof body?.subject === "string" && body.subject.trim()
      ? body.subject.trim()
      : "Innloggingsinformasjon - Total-IK";
    const bcc = Array.isArray(body?.bcc)
      ? ["ben@athenahms.no", ...body.bcc.filter((x: unknown) => typeof x === "string")]
      : ["ben@athenahms.no"];

    const html = brandedEmail({
      heading: "Velkommen til Total IK",
      badge: "VELKOMMEN",
      subheading: "Her er innloggingen din",
      preheader: "Innlogging til Total IK",
      bodyHtml: `
        <p style="margin:0 0 14px 0;">Hei ${name},</p>
        <p style="margin:0 0 14px 0;">Kontoen din i Total IK er klar. Bruk innloggingen under for &aring; komme i gang.</p>
        ${previewOnly ? (typeof body?.demo_email === "string" ? loginBlockHtml(body.demo_email, null) : "") : loginBlockHtml(email, null)}
        ${extraHtml}
      `,
    });

    const sendRes = await resend.emails.send({
      from: "Total-IK <noreply@totalik.no>",
      to: [email],
      bcc,
      subject,
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
