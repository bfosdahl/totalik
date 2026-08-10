import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RECIPIENTS = [
  "joe@athenahms.no",
  "gard@athenahms.no",
  "viktor@athenahms.no",
  "julian@athenahms.no",
  "filip@athenahms.no",
];

const html = `
<div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;line-height:1.5">
  <h2 style="color:#1e3a5f;margin-bottom:4px">Bruksrapport &ndash; SSM MARINE AS</h2>
  <p style="margin-top:0;color:#6b7280">Kontaktperson: Eirik Sivertsen &middot; Sist aktivitet: 7. august 2026</p>

  <h3 style="color:#1e3a5f">Brukere</h3>
  <p><strong>14 aktive brukere</strong> (alle med status &laquo;active&raquo;)<br>
  Aktive moduler: <strong>IK-HMS</strong> og <strong>KS BYGG</strong></p>

  <h3 style="color:#1e3a5f">Bruk totalt</h3>
  <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-size:14px">
    <tr><td>Timef&oslash;ringer</td><td align="right"><strong>217</strong></td></tr>
    <tr><td>Dagsrapporter</td><td align="right"><strong>74</strong></td></tr>
    <tr><td>Sjekklister</td><td align="right"><strong>31</strong></td></tr>
    <tr><td>Prosjekter</td><td align="right"><strong>20</strong></td></tr>
    <tr><td>Kj&oslash;rebok</td><td align="right"><strong>18</strong></td></tr>
    <tr><td>Milep&aelig;ler</td><td align="right"><strong>11</strong></td></tr>
    <tr><td>SJA (bygg)</td><td align="right"><strong>9</strong></td></tr>
    <tr><td>Avvik i prosjekt</td><td align="right"><strong>8</strong></td></tr>
  </table>

  <h3 style="color:#1e3a5f">Aktivitet pr. bruker (timer / dagsrapporter / sjekklister)</h3>
  <ul style="font-size:14px">
    <li>Andreas Svalland &ndash; 63 / 10 / 0</li>
    <li>Henrik Torsvik &ndash; 53 / 22 / 2</li>
    <li>Eirik Sivertsen &ndash; 32 / 25 / 6</li>
    <li>&Oslash;vrige brukere &ndash; lavere aktivitet, 3 brukere uten registrert aktivitet</li>
  </ul>

  <h3 style="color:#1e3a5f">Vurdering</h3>
  <p>Kjernebruken er <strong>timef&oslash;ring, dagsrapporter og prosjekt/sjekklister</strong>.
  HMS-delen (avvik, vernerunder, revisjon) er tiln&aelig;rmet ubrukt og b&oslash;r f&oslash;lges opp
  med oppl&aelig;ring.</p>

  <p style="color:#6b7280;font-size:12px;margin-top:24px">Sendt fra Total-IK</p>
</div>
`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resend = new Resend(resendApiKey);
    const results = [];
    for (const to of RECIPIENTS) {
      const res = await resend.emails.send({
        from: "Total-IK <noreply@totalik.no>",
        to: [to],
        subject: "Bruksrapport - SSM MARINE AS (14 brukere)",
        html,
      });
      results.push({ to, id: res.data?.id ?? null, error: res.error ?? null });
    }

    console.log("SSM usage report sent:", JSON.stringify(results));

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-ssm-usage-report error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
