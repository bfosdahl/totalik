import { Resend } from "npm:resend@4.0.0";
import { getTermsHtml, getTermsNoticeHtml } from "../_shared/terms-content.ts";
import { loginBlockHtml } from "../_shared/default-password.ts";

// Engangsfunksjon: sender en kopi av CRM/NextCom-velkomstmailen til Viktor.
// Hardkodet mottaker + token slik at den ikke kan misbrukes.
const TOKEN = "preview-crm-welcome-3f9a1c";
const RECIPIENT = "viktor@athenahms.no";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-preview-token",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.headers.get("x-preview-token") !== TOKEN) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);
  const companyName = "Eksempel Bedrift AS";
  const firstName = "Ola";
  const demoEmail = "ola.nordmann@eksempelbedrift.no";

  const html = `<!DOCTYPE html>
<html lang="no">
<head><meta charset="utf-8"></head>
<body>
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background:#fff8ec;border-left:4px solid #f0a020;padding:12px 16px;border-radius:0 8px 8px 0;margin:0 0 24px 0;">
            <p style="margin:0;color:#7a4b00;font-size:14px;"><strong>Kopi/forh&#229;ndsvisning:</strong> Dette er e-posten kunden mottar n&#229;r vi henter en kunde via API fra NextCom.</p>
          </div>
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a1a2e; margin: 0;">Velkommen til Total-IK!</h1>
          </div>

          <p style="color: #333; font-size: 16px;">Hei ${firstName},</p>

          <p style="color: #333; font-size: 16px;">
            Din brukerkonto er opprettet og klar til bruk. Du kan logge inn med e-postadressen din og passordet du mottar i en egen e-post.
          </p>

          <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #1a1a2e; margin: 0 0 12px 0;">&#10004; Kontoen din er aktiv</h3>
            <p style="color: #555; margin: 0;">Du har full tilgang til ${companyName} sitt system i Total-IK. Logg inn for &#229; komme i gang.</p>
          </div>

          ${loginBlockHtml(demoEmail)}

          ${getTermsNoticeHtml()}

          ${getTermsHtml()}

          <div style="background: #e8f4f8; border: 1px solid #b8daff; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #004085; font-size: 14px;">
              <strong>Ved &#229; logge inn bekrefter du at du har lest og godtar avtalevilk&#229;rene ovenfor.</strong>
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

          <p style="color: #999; font-size: 12px; text-align: center;">
            Dette er en automatisk generert e-post fra Total-IK.<br>
            Hvis du ikke har opprettet denne kontoen, kan du ignorere denne e-posten.
          </p>
        </div>
</body>
</html>`;

  const sent = await resend.emails.send({
    from: "Total-IK <noreply@totalik.no>",
    to: [RECIPIENT],
    subject: `[Kopi] Velkommen til ${companyName} - Konto opprettet`,
    html,
  });

  if (sent.error) {
    console.error("Resend error:", sent.error);
    return new Response(JSON.stringify({ error: sent.error }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true, id: sent.data?.id }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
