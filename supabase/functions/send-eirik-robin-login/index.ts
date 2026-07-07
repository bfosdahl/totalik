import { Resend } from "https://esm.sh/resend@2.0.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  }
  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

    const html = `<!DOCTYPE html><html lang="no"><head><meta charset="utf-8"></head><body>
<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:20px;color:#333;line-height:1.55;">
  <h1 style="color:#1a1a2e;margin:0 0 16px;">Oppdatering &#8211; innlogging for nye ansatte</h1>
  <p>Hei Eirik,</p>
  <p>Takk for tilbakemeldingen din. Vi har n&#229; gjort to ting:</p>

  <div style="background:#f8f9fa;border-left:4px solid #10b981;padding:14px 18px;border-radius:6px;margin:22px 0;">
    <h3 style="margin:0 0 8px;color:#1a1a2e;">1) Robin Sunds&#248; er klar til &#229; logge inn</h3>
    <ul style="margin:0;padding-left:22px;">
      <li>URL: <a href="https://totalik.no/auth">https://totalik.no/auth</a></li>
      <li>E-post: <strong>robin98.rds@gmail.com</strong></li>
      <li>Midlertidig passord: <strong>Abc_1234</strong></li>
    </ul>
    <p style="margin:8px 0 0;">Be han logge inn og bytte passord under <strong>Innstillinger &#8594; Passord</strong>.</p>
  </div>

  <div style="background:#f8f9fa;border-left:4px solid #0066cc;padding:14px 18px;border-radius:6px;margin:22px 0;">
    <h3 style="margin:0 0 8px;color:#1a1a2e;">2) Vi har lagt om hvordan nye brukere f&#229;r tilgang</h3>
    <p style="margin:0 0 8px;">&#197;rsaken til at Robin ikke kom inn f&#248;rste gang, var at &#171;sett passord&#187;-lenken i velkomst-eposten er en <strong>engangslenke</strong>. Outlook (og Microsoft Defender SafeLinks) &#229;pner slike lenker automatisk i forh&#229;ndsvisning, og da er lenken brukt opp f&#248;r mottakeren rekker &#229; klikke.</p>
    <p style="margin:0 0 8px;">For &#229; unng&#229; dette f&#229;r alle nye ansatte fra n&#229; av det samme startpassordet <strong>Abc_1234</strong> rett i velkomst-e-posten, sammen med innloggingslenken. Ingen engangslenker involvert &#8211; de kommer alltid inn.</p>
    <p style="margin:0;">Trenger en ansatt nytt passord senere, kan du (eller vi som systemadmin) sette et nytt direkte fra <strong>Ansatte &#8594; velg person &#8594; Sett nytt passord</strong>.</p>
  </div>

  <div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:14px 18px;border-radius:6px;margin:22px 0;">
    <h3 style="margin:0 0 8px;color:#1a1a2e;">Om timeredigering f&#248;r godkjenning</h3>
    <p style="margin:0;">Dette er allerede mulig. P&#229; <strong>L&#248;nnsgrunnlag</strong>/<strong>Timeoversikt</strong> kan du klikke <strong>blyant-ikonet</strong> p&#229; en time for &#229; endre dato, tid, timetype, prosjekt og beskrivelse f&#248;r du godkjenner. Skal du bare rette teksten g&#229;r det p&#229; et par sekunder.</p>
  </div>

  <p>Si fra om noe er uklart.</p>

  <p style="margin-top:24px;">Med vennlig hilsen<br>
  <strong>Ben Fosdahl</strong><br>
  Total-IK / Athena Kurs og Internkontroll AS</p>
</div>
</body></html>`;

    const result = await resend.emails.send({
      from: "Total-IK <noreply@totalik.no>",
      to: ["sivertsen@ssm-marine.no"],
      bcc: ["ben@athenahms.no"],
      subject: "Total-IK &#8211; Innlogging for Robin + ny rutine for nye brukere",
      html,
    });

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
