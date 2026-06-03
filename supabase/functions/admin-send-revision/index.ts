import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:720px;margin:auto;padding:24px">
<h2 style="color:#0b3d6e;margin:0 0 4px">Revisjonsrapport HMS &amp; KS Bygg</h2>
<p style="margin:0 0 16px;color:#555"><strong>Nova Bygg AS</strong> &middot; Org.nr. 816 937 582 &middot; Postboks 48, 7400 Trondheim</p>
<p>Hei Nader,</p>
<p>Vi har gjennomg&aring;tt den innsendte HMS-h&aring;ndboken for Nova Bygg AS og satt opp Total-IK med <strong>IK HMS</strong>, <strong>IK Bygg</strong> og <strong>KS Bygg</strong>-modulene. H&aring;ndboken har en god struktur med b&aring;de HMS- og bygg-rutiner, men de fleste seksjoner mangler innhold og signaturer.</p>

<h3 style="color:#0b3d6e">Hovedfunn</h3>
<ol>
<li><strong>Egenerkl&aelig;ring er ikke signert</strong> (s. 7). M&aring; signeres digitalt av daglig leder og representant for de ansatte.</li>
<li><strong>Avtale om &aring; ikke ha verneombud</strong> (s. 6) er ikke signert. Bedriften har 1 ansatt og kan inng&aring; slik avtale (AML &sect; 6-1), men den m&aring; signeres og fornyes hvert 2. &aring;r.</li>
<li><strong>Pliktig HMS-kurs for daglig leder</strong> (Nader Hassavari) etter AML &sect; 3-5 (6&ndash;7 timer) &ndash; ingen dokumentasjon. Tilbys av oss.</li>
<li><strong>Lover og forskrifter</strong> (s. 11): kun henvisning til lovdata.no, ingen konkret oversikt. M&aring; listes opp (AML, IK-forskriften, PBL, SAK10, TEK17, byggherreforskriften).</li>
<li><strong>Avtaleoversikt</strong> (s. 10) er nesten tom &ndash; kun Mimircon.no oppf&oslash;rt. Skal inneholde regnskap, BHT, forsikring, elektriker, brannvern, renovasjon m.m.</li>
<li><strong>Opplaering</strong> (s. 12) og <strong>gjennomgang av system</strong> (s. 13) er tomme overskrifter uten innhold.</li>
<li><strong>Avviksregister</strong> (s. 14) er tomt. Skal brukes aktivt &ndash; ogs&aring; sm&aring; saker.</li>
<li><strong>M&aring;lsetting for IK-HMS</strong> (s. 15) mangler konkrete m&aring;l.</li>
<li><strong>Organisasjonskart</strong> (s. 16) viser kun arbeidsleder Nader Hassavari &ndash; m&aring; suppleres med roller (HMS-ansvarlig, brannvernleder, f&oslash;rstehjelpsansvarlig).</li>
<li><strong>Risikoanalyse HMS</strong> (s. 17): tomme tabeller uten utfylte farekilder, konsekvens eller sannsynlighet.</li>
<li><strong>Handlingsplan HMS</strong> (s. 18): tom &ndash; ingen tiltak, ansvarlige eller frister.</li>
<li><strong>Risikoanalyse og handlingsplan IK-Bygg</strong> (s. 22&ndash;23): samme problem &ndash; tomme tabeller.</li>
<li><strong>Stoffkartotek</strong> mangler helt. Som byggebedrift m&aring; lim, fugemasse, l&oslash;semidler, maling, sparkel m.m. registreres med sikkerhetsdatablad.</li>
<li><strong>Trebearbeidingsmaskiner</strong> (rutine 2.1, s. 25) &ndash; CE-dokumentasjon, brukerveiledning og dokumentert oppl&aelig;ring m&aring; legges inn.</li>
<li><strong>Vibrerende verkt&oslash;y</strong> (rutine 2.5, s. 27): tabell over vibrasjonsniv&aring; er tom. M&aring; fylles ut for hvert verkt&oslash;y (produsenten oppgir niv&aring;).</li>
<li><strong>Vernerunder</strong>: ingen dokumenterte runder. Skal gjennomf&oslash;res &aring;rlig med sjekkliste.</li>
<li><strong>Brann og beredskap</strong>: rutiner finnes (2.4, 2.8), men dokumentasjon p&aring; brann&oslash;velse, r&oslash;mningsplan og kontroll av sl&oslash;kkemidler mangler.</li>
<li><strong>KS Bygg/SAK10-rutiner</strong>: rutiner for v&aring;trom (2.9) og dokumentstyring (1.1) finnes, men ikke koblet til konkrete prosjekter. Byggesaksbehandling, sentral godkjenning og gjennomf&oslash;ringsplan m&aring; settes opp.</li>
</ol>

<div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:12px 16px;margin:16px 0">
<strong>Konklusjon:</strong> H&aring;ndboken er strukturelt p&aring; plass, men de fleste kapitlene mangler konkret innhold. Systemet i Total-IK er n&aring; aktivert og rutinene kan flyttes over &ndash; med n&oslash;dvendige oppdateringer.
</div>

<h3 style="color:#0b3d6e">Hva er gjort i systemet</h3>
<ul>
<li>Modulene IK HMS, IK Bygg og KS Bygg er aktivert</li>
<li>Bransje satt til &laquo;Bygg&raquo;</li>
<li>Antall ansatte registrert (1)</li>
<li>Maler for rutiner, sjekklister, risikoanalyse og prosjekt er tilgjengelige</li>
</ul>

<h3 style="color:#0b3d6e">Neste steg</h3>
<ol>
<li>Logg inn p&aring; <a href="https://totalik.no">totalik.no</a> og fullf&oslash;r oppsettsveiviseren</li>
<li>Signer egenerkl&aelig;ring og verneombud-avtale digitalt</li>
<li>Fyll ut risikoanalyse og handlingsplan med konkrete farekilder og tiltak</li>
<li>Registrer kjemikalier (lim, maling, l&oslash;semidler) i stoffkartoteket</li>
<li>Legg inn maskindokumentasjon for trebearbeidingsmaskiner og vibrerende verkt&oslash;y</li>
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
      to: ["novabygger@gmail.com"],
      bcc: ["ben@athenahms.no", "viktor@athenahms.no"],
      subject: "Revisjonsrapport HMS & KS Bygg – Nova Bygg AS",
      html,
    }),
  });
  const j = await r.json();
  console.log("resend", r.status, JSON.stringify(j));
  return new Response(JSON.stringify(j), { status: r.status, headers: { "Content-Type": "application/json" } });
});
