import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { DEFAULT_PASSWORD, loginBlockHtml } from "../_shared/default-password.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.headers.get("x-admin-secret") !== Deno.env.get("ADMIN_ACTIONS_SECRET")) {
    return json({ error: "forbidden" }, 403);
  }

  const body = await req.json().catch(() => null);
  const userId = String(body?.userId ?? "");
  const newEmail = String(body?.newEmail ?? "").trim().toLowerCase();
  const firstName = String(body?.firstName ?? "");
  const companyName = String(body?.companyName ?? "");
  if (!userId || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(newEmail)) return json({ error: "bad input" }, 400);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  const { error: authErr } = await admin.auth.admin.updateUserById(userId, {
    email: newEmail,
    email_confirm: true,
    password: DEFAULT_PASSWORD,
  });
  if (authErr) return json({ error: authErr.message }, 500);

  const { error: profErr } = await admin.from("profiles").update({ email: newEmail }).eq("user_id", userId);
  if (profErr) return json({ error: profErr.message }, 500);

  const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
    <h2>Hei ${firstName || ""},</h2>
    <p>Vi har oppdatert e-postadressen p&aring; kontoen din i Total-IK til <strong>${newEmail}</strong>.</p>
    <p>Her er innloggingsinformasjonen din for <strong>${companyName}</strong>:</p>
    ${loginBlockHtml(newEmail, null)}
    <p>Ta gjerne kontakt om du trenger hjelp til &aring; komme i gang.</p>
    <hr/><p style="color:#999;font-size:12px;">Total-IK &ndash; Digitalt internkontrollsystem</p>
  </div>`;

  const r = await resend.emails.send({
    from: "Total-IK <noreply@totalik.no>",
    to: newEmail,
    subject: "Total-IK - innloggingsinformasjon",
    html,
  });

  return json({ success: !r.error, emailId: r.data?.id ?? null, emailError: r.error ?? null });
});
