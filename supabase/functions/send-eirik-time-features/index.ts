import { Resend } from "https://esm.sh/resend@2.0.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  }
  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

    const html = `<!DOCTYPE html><html lang="no"><head><meta charset="utf-8"></head><body>
<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:20px;color:#333;line-height:1.55;">
  <h1 style="color:#1a1a2e;margin:0 0 16px;">Timef&#248;ring – admin-funksjoner</h1>
  <p>Hei Eirik,</p>
  <p>Takk for tilbakemeldingene dine. Begge tingene du &#248;nsket er allerede p&#229; plass i Total-IK. Her er en kort forklaring p&#229; hvor du finner det:</p>

  <div style="background:#f8f9fa;border-left:4px solid #0066cc;padding:14px 18px;border-radius:6px;margin:22px 0;">
    <h3 style="margin:0 0 8px;color:#1a1a2e;">1) Redigere ansattes timer</h3>
    <p style="margin:0 0 8px;">G&#229; til <strong>L&#248;nnsgrunnlag</strong> eller <strong>Timeoversikt</strong>. Ved siden av hver timelinje ser du en <strong>blyant-knapp</strong> (kun synlig for admin).</p>
    <p style="margin:0 0 8px;">Der kan du endre:</p>
    <ul style="margin:0 0 8px;padding-left:22px;">
      <li>Dato</li>
      <li>Fra–til klokkeslett og antall timer</li>
      <li>Timetype (normal / 50% / 100% overtid)</li>
      <li>Prosjekt og beskrivelse</li>
    </ul>
    <p style="margin:0;">Du m&#229; skrive en kort <strong>&#229;rsak til endringen</strong>. Ansatt f&#229;r automatisk beskjed via <strong>app-varsel, push og e-post</strong> med b&#229;de gamle og nye verdier + &#229;rsaken du oppga. Alt logges ogs&#229; i revisjonsloggen.</p>
  </div>

  <div style="background:#f8f9fa;border-left:4px solid #10b981;padding:14px 18px;border-radius:6px;margin:22px 0;">
    <h3 style="margin:0 0 8px;color:#1a1a2e;">2) Registrere timer for andre ansatte</h3>
    <p style="margin:0 0 8px;">&#197;pne <strong>Registrer timer</strong>-dialogen som vanlig. &#216;verst ser du n&#229; en <strong>&#171;Ansatt&#187;-nedtrekksmeny</strong> (kun synlig for admin).</p>
    <p style="margin:0;">Velg <strong>&#171;Meg selv&#187;</strong> eller en av dine ansatte, og f&#248;r timene som normalt. Handlingen logges automatisk slik at det er sporbart hvem som la inn timene.</p>
  </div>

  <p>Si fra hvis noe ikke oppf&#248;rer seg som forventet, s&#229; tar vi det med en gang.</p>

  <p style="margin-top:24px;">Med vennlig hilsen<br>
  <strong>Ben Fosdahl</strong><br>
  Total-IK / Athena Kurs og Internkontroll AS</p>
</div>
</body></html>`;

    const result = await resend.emails.send({
      from: "Total-IK <noreply@totalik.no>",
      to: ["eirik@ssmmarine.no"],
      bcc: ["ben@athenahms.no"],
      subject: "Total-IK – Admin kan n&aring; redigere og registrere timer for ansatte",
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
