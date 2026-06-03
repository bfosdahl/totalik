import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:720px;margin:auto;padding:24px">
<h2 style="color:#0b3d6e;margin:0 0 4px">Revisjonsrapport HMS / KS-Bygg</h2>
<p style="margin:0 0 16px;color:#555"><strong>Bygge-Service Tomczyk</strong> &middot; Org.nr. 997 892 860 &middot; Tres&aring;kervegen 5, 5542 Karmsund</p>
<p>Hei Dariusz,</p>
<p>Vi har gjennomg&aring;tt den innsendte HMS-h&aring;ndboken og satt opp Total-IK med modulene <strong>IK HMS</strong>, <strong>IK Bygg</strong> og <strong>KS Bygg</strong> for bransje &laquo;Bygg&raquo;. Under f&oslash;lger funn fra revisjonen.</p>
<h3 style="color:#0b3d6e">Hovedfunn</h3>
<ol>
<li><strong>Egenerkl&aelig;ring er ikke signert</strong> (h&aring;ndboken s. 7). M&aring; signeres digitalt.</li>
<li><strong>Forretningsid&eacute; og avtaleoversikt</strong> er kun delvis utfylt.</li>
<li><strong>Lover og forskrifter:</strong> mangler konkret oversikt (PBL, SAK10, TEK17, AML, IK-forskriften).</li>
<li><strong>Oppl&aelig;ring:</strong> ingen dokumentasjon p&aring; gjennomf&oslash;rte kurs eller faglige kvalifikasjoner etter PBL/SAK10.</li>
<li><strong>Pliktig HMS-kurs for daglig leder</strong> (AML &sect; 3-5). Selv som enkeltpersonforetak anbefales kurset n&aring;r dere arbeider p&aring; byggeplass (byggherreforskriften &sect; 9). Vi tilbyr kurset.</li>
<li><strong>Avviksregister er tomt.</strong> Rutine for &aring; melde, behandle og lukke avvik m&aring; tas i bruk (ogs&aring; for SAK10 &sect; 10-1 bokstav x).</li>
<li><strong>Risikoanalyse mangler innhold</strong> for b&aring;de IK/HMS og IK/Bygg (tomme tabeller s. 17 og 28).</li>
<li><strong>Handlingsplan mangler</strong> &ndash; skal bygges p&aring; risikoanalysen.</li>
<li><strong>Organisasjonskart</strong> er ikke utfylt med roller og stedfortreder.</li>
<li><strong>Stoffkartotek mangler.</strong> Maling, lim, sparkel, l&oslash;semidler m&aring; registreres med sikkerhetsdatablad.</li>
<li><strong>KS Bygg / SAK10-rutiner:</strong> maler finnes, men er ikke knyttet til konkrete prosjekter. Sjekklister for t&oslash;mrer- og bjelkelagsarbeid m&aring; brukes per prosjekt.</li>
<li><strong>Vernerunder/internrevisjon:</strong> ingen dokumenterte runder. Skal gjennomf&oslash;res &aring;rlig.</li>
</ol>
<div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:12px 16px;margin:16px 0"><strong>Konklusjon:</strong> H&aring;ndboken er strukturelt riktig oppbygd, men st&oslash;rstedelen av innholdet er tomme maler. Systemet i Total-IK er n&aring; aktivert, og innholdet kan fylles ut direkte der.</div>
<h3 style="color:#0b3d6e">Hva er gjort i systemet</h3>
<ul><li>Modulene IK HMS, IK Bygg og KS Bygg er aktivert</li><li>Bransje satt til &laquo;Bygg&raquo;</li><li>Maler for rutiner, sjekklister og risikoanalyse er tilgjengelige</li></ul>
<h3 style="color:#0b3d6e">Neste steg</h3>
<ol><li>Logg inn p&aring; <a href="https://totalik.no">totalik.no</a> og fullf&oslash;r oppsettsveiviseren</li><li>Signer egenerkl&aelig;ring digitalt</li><li>Fyll ut risikoanalyse og handlingsplan</li><li>Registrer kjemikalier i stoffkartoteket</li><li>Bestill pliktig HMS-kurs for daglig leder</li></ol>
<p>Ta kontakt om dere &oslash;nsker hjelp til oppsett eller HMS-kurs.</p>
<p style="margin-top:24px">Vennlig hilsen,<br><strong>Ben Fosdahl</strong><br>Athena Kurs og Internkontroll AS / Total-IK<br><a href="mailto:ben@athenahms.no">ben@athenahms.no</a></p>
</body></html>`;

serve(async (req) => {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== Deno.env.get("CRON_SECRET")) {
    return new Response("forbidden", { status: 403 });
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Total-IK <ben@athenahms.no>",
      to: ["darek1962tomczyk@wp.pl"],
      bcc: ["ben@athenahms.no", "viktor@athenahms.no"],
      subject: "Revisjonsrapport HMS/KS-Bygg – Bygge-Service Tomczyk",
      html,
    }),
  });
  const j = await r.json();
  console.log("resend", r.status, JSON.stringify(j));
  return new Response(JSON.stringify(j), { status: r.status, headers: { "Content-Type": "application/json" } });
});
