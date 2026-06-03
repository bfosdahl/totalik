import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:720px;margin:auto;padding:24px">
<h2 style="color:#0b3d6e;margin:0 0 4px">Revisjonsrapport HMS</h2>
<p style="margin:0 0 16px;color:#555"><strong>Wlodzimierz Kujawa Eiendomsservice</strong> &middot; Org.nr. 997 648 943 &middot; Kr&aring;ker&oslash;yveien 19, 1671 Kr&aring;ker&oslash;y</p>
<p>Hei Wlodzimierz,</p>
<p>Vi har gjennomg&aring;tt den innsendte HMS-h&aring;ndboken for Wlodzimierz Kujawa Eiendomsservice og satt opp Total-IK med <strong>IK HMS</strong>-modulen for bransje &laquo;Eiendomsservice/Bygg&raquo;. H&aring;ndboken har grunnstrukturen p&aring; plass, men de fleste seksjonene mangler innhold og signaturer.</p>

<h3 style="color:#0b3d6e">Hovedfunn</h3>
<ol>
<li><strong>Egenerkl&aelig;ring er ikke signert</strong> (s. 7). M&aring; signeres digitalt av daglig leder.</li>
<li><strong>Avtale om &aring; ikke ha verneombud</strong> (s. 6) er ikke signert. Bedriften har 1 ansatt og kan inng&aring; slik avtale (AML &sect; 6-1), men den m&aring; signeres og fornyes hvert 2. &aring;r.</li>
<li><strong>Pliktig HMS-kurs for daglig leder</strong> (Wlodzimierz Roman Kujawa) etter AML &sect; 3-5 (6&ndash;7 timer) &ndash; ingen dokumentasjon. Tilbys av oss.</li>
<li><strong>Lover og forskrifter</strong> (s. 11): kun henvisning til lovdata.no, ingen konkret oversikt. M&aring; listes opp (AML, IK-forskriften, byggherreforskriften, forskrift om utf&oslash;relse av arbeid).</li>
<li><strong>Avtaleoversikt</strong> (s. 10) er nesten tom &ndash; kun Mimircon.no oppf&oslash;rt. Skal inneholde regnskap, BHT, forsikring, elektriker, brannvern, renovasjon m.m.</li>
<li><strong>Opplaering</strong> (s. 12) og <strong>system-gjennomgang</strong> (s. 13) er tomme overskrifter uten dokumentert innhold.</li>
<li><strong>Avviksregister</strong> (s. 14) er tomt. Skal brukes aktivt &ndash; ogs&aring; sm&aring; saker.</li>
<li><strong>M&aring;lsetting for IK/HMS</strong> (s. 15) mangler konkrete m&aring;l.</li>
<li><strong>Organisasjonskart</strong> (s. 16) viser kun arbeidsgiver &ndash; m&aring; suppleres med roller (HMS-ansvarlig, brannvernleder, f&oslash;rstehjelpsansvarlig).</li>
<li><strong>Handlingsplan</strong> (s. 18&ndash;19): tiltakene har frister fra <em>februar 2018</em> &ndash; alvorlig utdatert. M&aring; gjennomg&aring;s og oppdateres med nye frister.</li>
<li><strong>Risikoanalyse</strong> (s. 17): identifiserer h&oslash;rselsskader, fallskader fra h&oslash;yden, fallende gjenstander og brann i el-anlegg, men mangler eksisterende/planlagte tiltak.</li>
<li><strong>Stoffkartotek</strong> mangler. Som eiendomsservice m&aring; rengj&oslash;ringsmidler, l&oslash;semidler, lim, maling, oljer m.m. registreres med sikkerhetsdatablad.</li>
<li><strong>Verneutstyr ved arbeid i h&oslash;yden</strong>: rutiner for fallsikring, stillas og stiger m&aring; dokumenteres &ndash; b&aring;de innk&oslash;p, kontroll og oppl&aelig;ring.</li>
<li><strong>H&oslash;rselsvern og st&oslash;ymaling</strong>: tiltak for h&oslash;rselsskader er listet, men m&aring;ling/kontroll av st&oslash;yniv&aring; og bruk av h&oslash;rselsvern m&aring; dokumenteres.</li>
<li><strong>Vernerunder</strong>: ingen dokumenterte runder. Skal gjennomf&oslash;res &aring;rlig med sjekkliste.</li>
<li><strong>Brann og beredskap</strong>: rutiner finnes, men dokumentasjon p&aring; brann&oslash;velse, r&oslash;mningsplan og kontroll av sl&oslash;kkemidler mangler.</li>
<li><strong>ID-kort / HMS-kort</strong> (rutine 4.2): m&aring; dokumentere at alle ansatte har gyldig HMS-kort fra Arbeidstilsynet ved arbeid p&aring; bygg- og anleggsplass.</li>
<li><strong>F&oslash;rstehjelp</strong>: rutine beskrevet, men sjekklister for kontroll av f&oslash;rstehjelpsutstyr og dokumentert oppl&aelig;ring mangler.</li>
</ol>

<div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:12px 16px;margin:16px 0">
<strong>Konklusjon:</strong> H&aring;ndboken er strukturelt p&aring; plass, men kritisk utdatert (handlingsplan fra 2018) og de fleste kapitlene mangler konkret innhold. Systemet i Total-IK er n&aring; aktivert og rutinene kan flyttes over.
</div>

<h3 style="color:#0b3d6e">Hva er gjort i systemet</h3>
<ul>
<li>Modulen IK HMS er aktivert</li>
<li>Bransje satt til &laquo;Eiendomsservice/Bygg&raquo;</li>
<li>Antall ansatte registrert (1)</li>
<li>Maler for rutiner, sjekklister og risikoanalyse er tilgjengelige</li>
</ul>

<h3 style="color:#0b3d6e">Neste steg</h3>
<ol>
<li>Logg inn p&aring; <a href="https://totalik.no">totalik.no</a> og fullf&oslash;r oppsettsveiviseren</li>
<li>Signer egenerkl&aelig;ring og verneombud-avtale digitalt</li>
<li>Oppdater handlingsplan med nye frister og tiltak</li>
<li>Registrer kjemikalier i stoffkartoteket</li>
<li>Dokumenter HMS-kort, fallsikringsutstyr og kontroll</li>
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
      to: ["wlodek-kujawa@wp.pl"],
      bcc: ["ben@athenahms.no", "viktor@athenahms.no"],
      subject: "Revisjonsrapport HMS – Wlodzimierz Kujawa Eiendomsservice",
      html,
    }),
  });
  const j = await r.json();
  console.log("resend", r.status, JSON.stringify(j));
  return new Response(JSON.stringify(j), { status: r.status, headers: { "Content-Type": "application/json" } });
});
