import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth } from "../_shared/auth-guard.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await requireAuth(req, corsHeaders);
  if (auth instanceof Response) return auth;

  try {
    const { companyName, contactName, contactEmail, contactPhone, selectedPosters, message } = await req.json();

    if (!selectedPosters || selectedPosters.length === 0) {
      return new Response(JSON.stringify({ error: 'Ingen plakater valgt' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');

    const posterList = selectedPosters.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n');

    const emailBody = `
<h2>Ny bestilling av plakater / dokumenter (IK-MAT)</h2>

<table style="border-collapse:collapse;width:100%">
  <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Bedrift</td><td style="padding:8px;border:1px solid #ddd">${companyName}</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Kontaktperson</td><td style="padding:8px;border:1px solid #ddd">${contactName}</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">E-post</td><td style="padding:8px;border:1px solid #ddd">${contactEmail}</td></tr>
  ${contactPhone ? `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Telefon</td><td style="padding:8px;border:1px solid #ddd">${contactPhone}</td></tr>` : ''}
</table>

<h3>Bestilte plakater/dokumenter:</h3>
<ol>
${selectedPosters.map((p: string) => `  <li>${p}</li>`).join('\n')}
</ol>

${message ? `<h3>Melding fra kunde:</h3><p>${message}</p>` : ''}

<hr>
<p style="color:#666;font-size:12px">Denne bestillingen ble sendt automatisk fra Total-IK systemet.</p>
    `.trim();

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Total-IK <noreply@totalik.no>',
        to: ['post@athenahms.no'],
        cc: ['joe@athenahms.no'],
        reply_to: contactEmail,
        subject: `Bestilling av plakater - ${companyName}`,
        html: emailBody,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend error: ${err}`);
    }

    const data = await res.json();

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
