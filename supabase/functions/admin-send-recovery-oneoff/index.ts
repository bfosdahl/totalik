import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const cronSecret = req.headers.get("x-cron-secret");
    const expected = Deno.env.get("ADMIN_ACTIONS_SECRET");
    if (!expected || !cronSecret || cronSecret !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { email, firstName } = await req.json();
    if (!email) return new Response(JSON.stringify({ error: "email required" }), { status: 400, headers: corsHeaders });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: "https://totalik.no/auth" },
    });

    if (resetError || !resetData?.properties?.action_link) {
      console.error("Reset link error", resetError);
      return new Response(JSON.stringify({ error: resetError?.message || "no link" }), { status: 400, headers: corsHeaders });
    }

    const link = resetData.properties.action_link;
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const name = firstName || "bruker";

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;background:#f8fafc;margin:0;padding:20px;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
<div style="background:linear-gradient(135deg,#1a365d 0%,#2563eb 100%);color:#fff;padding:30px;text-align:center;">
<h1 style="margin:0;font-size:24px;">Tilbakestill passord</h1>
</div>
<div style="padding:30px;">
<p>Hei ${name},</p>
<p>Vi har generert en ny tilbakestillingslenke for deg i Total-IK. Klikk p&aring; knappen under for &aring; sette nytt passord:</p>
<p style="text-align:center;margin:30px 0;">
<a href="${link}" style="display:inline-block;background:#2563eb;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600;">Sett nytt passord</a>
</p>
<p style="font-size:13px;color:#64748b;">Lenken er gyldig i 1 time. Hvis knappen ikke fungerer, kopier denne URL-en inn i nettleseren:</p>
<p style="word-break:break-all;font-size:12px;color:#475569;background:#f1f5f9;padding:10px;border-radius:6px;">${link}</p>
<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:15px;margin:20px 0;border-radius:0 8px 8px 0;font-size:14px;">
<strong>Tips:</strong> Etter du har satt nytt passord, logg inn p&aring; samme enhet (telefon eller PC). Hvis du blir utestengt p&aring; grunn av inaktivitet, bare bruk &quot;Glemt passord&quot;-funksjonen p&aring; <a href="https://totalik.no/auth">totalik.no/auth</a> for &aring; f&aring; en ny lenke.
</div>
<p>Mvh,<br>Total-IK</p>
</div>
<div style="text-align:center;padding:20px;color:#64748b;font-size:12px;background:#f8fafc;">
Total-IK &middot; <a href="https://totalik.no" style="color:#2563eb;">totalik.no</a>
</div>
</div></body></html>`;

    const sendRes = await resend.emails.send({
      from: "Total-IK <noreply@totalik.no>",
      to: [email],
      bcc: ["ben@athenahms.no"],
      subject: "Tilbakestill passord - Total-IK",
      html,
    });

    console.log("Sent", sendRes);
    return new Response(JSON.stringify({ success: true, sendRes }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
