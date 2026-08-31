import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

    const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;padding:20px;color:#1f2937;font-size:15px;line-height:1.6">
      <h2 style="color:#1a1a2e;margin:0 0 16px 0">Testbruker til Total-IK</h2>
      <p>Hei,</p>
      <p>Her f&aring;r du en testbruker slik at du kan logge inn og se hele systemet v&aring;rt i praksis.</p>

      <div style="background:#f4f7fb;border:1px solid #d0d7e2;border-radius:8px;padding:20px;margin:24px 0;">
        <p style="margin:0 0 8px 0"><strong>Innloggingsadresse:</strong> <a href="https://totalik.no/auth" style="color:#0066cc">https://totalik.no/auth</a></p>
        <p style="margin:0 0 8px 0"><strong>E-post:</strong> ben@athenahms.no</p>
        <p style="margin:0"><strong>Passord:</strong> <code style="background:#fff;padding:4px 8px;border-radius:4px;border:1px solid #d0d7e2">Abc_1234</code></p>
      </div>

      <div style="text-align:center;margin:24px 0">
        <a href="https://totalik.no/auth" style="background:linear-gradient(135deg,#0066cc 0%,#0052a3 100%);color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block">Logg inn p&aring; Total-IK</a>
      </div>

      <h3 style="color:#1a1a2e;margin:28px 0 8px 0">Hva du finner i testbrukeren</h3>
      <p>Testbrukeren har <strong>alle moduler aktivert</strong>, slik at du fritt kan klikke deg rundt.
      For deg er det nok <strong>KS Bygg</strong> og <strong>IK-HMS</strong> som er de viktigste &ndash; det er der du finner
      kvalitetssikring av byggeprosjekter (sjekklister, SJA, avvik, dagsrapporter, SHA-plan) og selve internkontrollsystemet
      med h&aring;ndbok, rutiner, risikovurderinger og m&aring;l.</p>

      <h3 style="color:#1a1a2e;margin:28px 0 8px 0">Tips: se ogs&aring; p&aring; Personaladministrasjon</h3>
      <p>Vi anbefaler at du tar en titt p&aring; <strong>Personaladministrasjon</strong>. Der ligger blant annet
      ansattoversikt, arbeidsavtaler, timef&oslash;ring, fravr og ferie, medarbeidersamtaler og personalliste &ndash;
      mye av det som ellers blir liggende i perm og regneark.</p>

      <div style="background:#fff8ec;border-left:4px solid #f0a020;padding:12px 16px;border-radius:0 8px 8px 0;margin:24px 0">
        <p style="margin:0"><strong>Husk:</strong> Lurer du p&aring; hvor du finner noe i systemet, kan du n&aring;r som helst sp&oslash;rre
        <strong>HMS PROFFEN</strong> eller <strong>BYGG PROFFEN</strong> &ndash; de innebygde AI-hjelperne v&aring;re.
        De svarer p&aring; HMS- og byggfaglige sp&oslash;rsm&aring;l, og viser deg hvor i systemet du skal g&aring; for &aring; gj&oslash;re ting.</p>
      </div>

      <p>Bare ta kontakt hvis du lurer p&aring; noe eller vil ha en gjennomgang.</p>
      <p>Med vennlig hilsen<br/><strong>Ben Fosdahl</strong><br/>Athena Kurs og Internkontroll AS / Total-IK<br/>
      <a href="mailto:ben@athenahms.no" style="color:#0066cc">ben@athenahms.no</a></p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
      <p style="color:#999;font-size:12px">Total-IK &ndash; Digitalt internkontrollsystem</p>
    </div>`;

    const sent = await resend.emails.send({
      from: "Total-IK <noreply@totalik.no>",
      to: ["post@askerbyggogbad.no"],
      cc: ["ben@athenahms.no"],
      reply_to: "ben@athenahms.no",
      subject: "Testbruker til Total-IK - innloggingsinformasjon",
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
  } catch (error) {
    console.error("send-testbruker-oneoff error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
