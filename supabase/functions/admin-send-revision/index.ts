import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:720px;margin:auto;padding:24px">
<h2 style="color:#0b3d6e;margin:0 0 4px">Revisjonsrapport HMS</h2>
<p style="margin:0 0 16px;color:#555"><strong>Staal &amp; S&oslash;nn AS</strong> &middot; Org.nr. 916 169 493 &middot; Aremarkveien 42/48, 1792 Tistedal</p>
<p>Hei Tony og resten av teamet,</p>
<p>Vi har gjennomg&aring;tt den innsendte HMS-h&aring;ndboken for Staal &amp; S&oslash;nn AS og satt opp Total-IK med <strong>IK HMS</strong>-modulen for bransje &laquo;Produksjon/Butikk&raquo;. H&aring;ndboken er solid bygd opp med m&aring;l, organisasjonskart, risikovurdering og rutiner &ndash; men flere punkter krever oppdatering.</p>

<h3 style="color:#0b3d6e">Hovedfunn</h3>
<ol>
<li><strong>Risikoanalyse og handlingsplan er utdatert.</strong> Tiltakene i kapittel 11 har frister fra 2017&ndash;2022 (bl.a. elektro-egenkontroll 22.11.2022, dataskjermarbeid, l&oslash;semidler, muskel/skjelett). Skal gjennomg&aring;s og oppdateres minimum &aring;rlig.</li>
<li><strong>Egenerkl&aelig;ring er ikke signert.</strong> Felt for daglig leder og representant for de ansatte st&aring;r tomme (s. 8). M&aring; signeres digitalt i systemet.</li>
<li><strong>Pliktig HMS-kurs for daglig leder</strong> (Tony Andr&eacute; Hoffg&aring;rd) etter AML &sect; 3-5 (6&ndash;7 timer) &ndash; ingen dokumentasjon i h&aring;ndboken. Vi kan tilby kurset.</li>
<li><strong>Verneombud:</strong> 3 ansatte gir ikke pliktig verneombud (AML &sect; 6-1), men dere skal ha skriftlig avtale om annen ordning. Signeres digitalt under HMS-aktiviteter.</li>
<li><strong>Maskinsikkerhet &ndash; Felder b&aring;ndsag og K&ouml;lle F45 fresemaskin</strong> (punkt 11.13 og 11.14) er listet uten konkret tiltak/sjekkliste. M&aring; ha CE-dokumentasjon, brukerveiledning, vernekapper, sakkyndig kontroll og dokumentert oppl&aelig;ring for hver bruker.</li>
<li><strong>Stoffkartotek mangler.</strong> Rutine 5.2 &laquo;Bruk og h&aring;ndtering av kjemikalier&raquo; viser til system, men ingen kjemikalier er registrert. Lim, lakk, l&oslash;semidler, oljer m&aring; legges inn med sikkerhetsdatablad.</li>
<li><strong>Avviksregister er tomt.</strong> Rutine 2.1 finnes, men ingen avvik er registrert. Skal brukes aktivt &ndash; ogs&aring; sm&aring; saker.</li>
<li><strong>Vernerunder:</strong> Rutine 2.5 beskrevet, men ingen dokumenterte runder. Skal gjennomf&oslash;res &aring;rlig med sjekkliste.</li>
<li><strong>Brann og beredskap:</strong> Rutine 6.1 finnes, men dokumentasjon p&aring; brann&oslash;velse, r&oslash;mningsplan og kontroll av sl&oslash;kkemidler m&aring; legges inn.</li>
<li><strong>F&oslash;rstehjelp:</strong> Rutine 4.4 beskrevet, men sjekklister for kontroll av f&oslash;rstehjelpsutstyr og dokumentert oppl&aelig;ring mangler.</li>
<li><strong>Sertifisert oppl&aelig;ring og sakkyndig kontroll</strong> (rutine 4.5 og 4.7): kompetansebevis for maskiner, truck/l&oslash;fteutstyr og &aring;rlig sakkyndig kontroll av relevant utstyr m&aring; dokumenteres.</li>
<li><strong>Medarbeidersamtaler:</strong> Rutine 3.3 sier &aring;rlig, men ingen logg. Bruk HR-modulen til &aring; planlegge og dokumentere.</li>
</ol>

<div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:12px 16px;margin:16px 0">
<strong>Konklusjon:</strong> H&aring;ndboken er strukturelt god, men trenger oppdatering av risikovurdering, signaturer og l&oslash;pende dokumentasjon. Systemet i Total-IK er n&aring; aktivert og rutinene kan flyttes over.
</div>

<h3 style="color:#0b3d6e">Hva er gjort i systemet</h3>
<ul>
<li>Modulen IK HMS er aktivert</li>
<li>Bransje satt til &laquo;Produksjon/Butikk&raquo;</li>
<li>Antall ansatte registrert (3)</li>
<li>Maler for rutiner, sjekklister og risikoanalyse er tilgjengelige</li>
</ul>

<h3 style="color:#0b3d6e">Neste steg</h3>
<ol>
<li>Logg inn p&aring; <a href="https://totalik.no">totalik.no</a> og fullf&oslash;r oppsettsveiviseren</li>
<li>Signer egenerkl&aelig;ring og verneombud-avtale digitalt</li>
<li>Oppdater risikoanalyse med nye frister</li>
<li>Registrer kjemikalier (lim, lakk, l&oslash;semidler) i stoffkartoteket</li>
<li>Legg inn maskindokumentasjon for Felder og K&ouml;lle</li>
<li>Bestill pliktig HMS-kurs for daglig leder</li>
</ol>

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
      to: ["post@staalogsonn.no"],
      bcc: ["ben@athenahms.no", "viktor@athenahms.no"],
      subject: "Revisjonsrapport HMS – Staal & Sønn AS",
      html,
    }),
  });
  const j = await r.json();
  console.log("resend", r.status, JSON.stringify(j));
  return new Response(JSON.stringify(j), { status: r.status, headers: { "Content-Type": "application/json" } });
});
