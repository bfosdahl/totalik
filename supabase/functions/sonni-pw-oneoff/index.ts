import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

Deno.serve(async () => {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const userId = "3d7efe89-6404-4805-9506-f4e184a9f8c7";
  const email = "hamaroyrenhold@hbasse.no";
  const password = "Sonni123!";

  const { error: updErr } = await admin.auth.admin.updateUserById(userId, { password });
  if (updErr) return new Response(JSON.stringify({ step: "update", error: updErr.message }), { status: 500 });

  const resendKey = Deno.env.get("RESEND_API_KEY");
  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;">
    <div style="max-width:600px;margin:0 auto;background:#fff;padding:30px;border-radius:8px;">
      <h2 style="color:#1a1a2e;">Hei Sonni,</h2>
      <p>Passordet ditt på Total-IK er oppdatert.</p>
      <div style="background:#f8f9fa;border:1px solid #e9ecef;border-radius:6px;padding:16px;margin:20px 0;">
        <p style="margin:0;"><strong>E-post:</strong> ${email}</p>
        <p style="margin:8px 0 0;"><strong>Passord:</strong> ${password}</p>
      </div>
      <p>Logg inn her: <a href="https://totalik.no/auth">https://totalik.no/auth</a></p>
      <p>Vi anbefaler at du endrer passordet etter første innlogging.</p>
      <p style="color:#666;font-size:12px;margin-top:30px;">Vennlig hilsen<br/>Total-IK</p>
    </div></body></html>`;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Total-IK <noreply@totalik.no>",
      to: [email],
      bcc: ["ben@athenahms.no"],
      subject: "Ditt nye passord til Total-IK",
      html,
    }),
  });
  const txt = await r.text();
  return new Response(JSON.stringify({ ok: r.ok, resend: txt }), { status: r.ok ? 200 : 500 });
});
