import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  }
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const email = "briancarlo94@gmail.com";
    const firstName = "Brian Carlo";
    const companyName = "Gamos Audio AS";
    const loginUrl = "https://totalik.no/auth";

    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: loginUrl },
    });
    if (linkErr || !linkData?.properties?.action_link) {
      return new Response(JSON.stringify({ error: linkErr?.message || "link failed" }), { status: 500 });
    }
    const resetLink = linkData.properties.action_link;

    const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);
    const result = await resend.emails.send({
      from: "Total-IK <noreply@totalik.no>",
      to: [email],
      bcc: ["ben@athenahms.no"],
      subject: `Velkommen til Total-IK – ${companyName}`,
      html: `<!DOCTYPE html><html lang="no"><head><meta charset="utf-8"></head><body>
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
  <h1 style="color:#1a1a2e;margin:0 0 16px;">Velkommen til Total-IK!</h1>
  <p>Hei ${firstName},</p>
  <p>Brukerkontoen din for <strong>${companyName}</strong> er n&#229; opprettet og systemet er ferdig satt opp for deg.</p>

  <div style="background:#f8f9fa;border-left:4px solid #0066cc;padding:16px 20px;border-radius:8px;margin:24px 0;">
    <h3 style="margin:0 0 8px;color:#1a1a2e;">Innlogging</h3>
    <p style="margin:0 0 6px;"><strong>Brukernavn:</strong> ${email}</p>
    <p style="margin:0;">Klikk p&#229; knappen under for &#229; sette ditt eget passord. Lenken er gyldig i 24 timer.</p>
  </div>

  <div style="text-align:center;margin:28px 0;">
    <a href="${resetLink}" style="background:linear-gradient(135deg,#0066cc 0%,#0052a3 100%);color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:600;">Sett passord og logg inn</a>
  </div>

  <p style="font-size:13px;color:#666;">Hvis knappen ikke fungerer, kopier denne lenken inn i nettleseren:</p>
  <p style="font-size:12px;color:#0066cc;word-break:break-all;">${resetLink}</p>

  <hr style="border:none;border-top:1px solid #eee;margin:28px 0;">

  <h3 style="color:#1a1a2e;margin:0 0 10px;">Slik kommer du i gang</h3>
  <ul style="padding-left:20px;line-height:1.6;">
    <li>Logg inn og gå til menyen <strong>IK/HMS</strong> – alt rundt internkontroll og HMS ligger her.</li>
    <li>Klikk på <strong>Håndbok</strong> for å se din ferdig oppsatte HMS-håndbok. Du kan også laste den ned som PDF derfra.</li>
    <li>Skulle du ønske å legge til flere bedrifter under samme konto, kan du gjøre det ved å opprette <strong>avdelinger</strong> – hver avdeling fungerer som sin egen enhet i systemet.</li>
  </ul>

  <p>Si fra hvis du lurer på noe, så hjelper vi deg gjerne i gang.</p>

  <p style="margin-top:24px;">Mvh,<br>Ben Fosdahl<br>Athena Kurs og Internkontroll AS</p>

  <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
  <p style="color:#999;font-size:12px;text-align:center;">Total-IK – totalik.no</p>
</div>
</body></html>`,
    });

    return new Response(JSON.stringify({ ok: true, id: result.data?.id }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
