import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:720px;margin:auto;padding:24px">
<h2 style="color:#0b3d6e;margin:0 0 4px">Revisjonsrapport HMS</h2>
<p style="margin:0 0 16px;color:#555"><strong>Biltekniske Bergen AS</strong> &middot; Org.nr. 999 248 659 &middot; Sandviksbodene 65A, 5035 Bergen</p>
<p>Hei Karsten,</p>
<p>Vi har gjennomg&aring;tt den innsendte HMS-h&aring;ndboken for Biltekniske Bergen AS og satt opp Total-IK med <strong>IK HMS</strong>-modulen for bransjen verdi- og skadetaksering av motorkj&oslash;ret&oslash;y/lystb&aring;ter. H&aring;ndboken har grunnstrukturen p&aring; plass, men de fleste seksjonene mangler innhold og signaturer.</p>

<h3 style="color:#0b3d6e">Hovedfunn</h3>
<ol>
<li><strong>Egenerkl&aelig;ring er ikke signert</strong> (s. 7). M&aring; signeres digitalt av daglig leder.</li>
<li><strong>Avtale om &aring; ikke ha verneombud</strong> (s. 6) er ikke signert. Bedriften har 1 ansatt og kan inng&aring; slik avtale (AML &sect; 6-1), men den m&aring; signeres og fornyes hvert 2. &aring;r.</li>
<li><strong>Pliktig HMS-kurs for daglig leder</strong> Karsten Bruvik etter AML &sect; 3-5 (6&ndash;7 timer) &ndash; ingen dokumentasjon. Tilbys av oss.</li>
<li><strong>Lover og forskrifter</strong> (s. 11): kun henvisning til lovdata.no, ingen konkret oversikt. M&aring; listes opp (AML, IK-forskriften, forskrift om utf&oslash;relse av arbeid, kj&oslash;ret&oslash;yforskriften, vegtrafikkloven der relevant).</li>
<li><strong>Avtaleoversikt</strong> (s. 10) er nesten tom &ndash; kun Mimircon.no oppf&oslash;rt. Skal inneholde regnskap, forsikring, elektriker, brannvern, renovasjon m.m.</li>
<li><strong>Oppl&aelig;ring</strong> (s. 12) og <strong>system-gjennomgang</strong> (s. 13) er tomme overskrifter uten dokumentert innhold.</li>
<li><strong>Avviksregister</strong> (s. 14) er tomt. Skal brukes aktivt &ndash; ogs&aring; sm&aring; saker.</li>
<li><strong>M&aring;lsetting for IK/HMS</strong> (s. 15): generell tekst &ndash; mangler konkrete, m&aring;lbare m&aring;l.</li>
<li><strong>Organisasjonskart</strong> (s. 16): viser kun &laquo;Arbeidsgiver: Karsten Bruvik&raquo;. Roller (HMS-ansvarlig, brannvernleder, f&oslash;rstehjelpsansvarlig) m&aring; legges inn.</li>
<li><strong>Risikoanalyse</strong> (s. 17) inneholder kun &laquo;Sykefrav&aelig;r&raquo;. M&aring; suppleres med typiske risikoer for takseringsarbeid: kj&oslash;ring til/fra skadested, arbeid p&aring; skadebiler (skarpe kanter, glass, drivstoff/oljes&oslash;l), arbeid p&aring; verksted/lystb&aring;ter (l&oslash;ft, fall, klem), ergonomi (b&oslash;ying, l&oslash;ft), eneste-arbeider-risiko (alene-arbeid).</li>
<li><strong>Handlingsplan</strong> (s. 18) er tom. Skal vise konkrete tiltak, ansvarlig og frist for hver risiko.</li>
<li><strong>Stoffkartotek</strong> mangler. Selv ved enkel takseringsvirksomhet b&oslash;r drivstoff, oljer, bremsev&aelig;ske, rengj&oslash;ringsmidler og evt. testkjemikalier registreres med sikkerhetsdatablad.</li>
<li><strong>Alene-arbeid</strong>: som enest&aring;ende ansatt som reiser ut p&aring; skadested b&oslash;r det v&aelig;re rutine for varsling, sjekk-inn/ut og n&oslash;dkontakt (forskrift om utf&oslash;relse av arbeid &sect; 17).</li>
<li><strong>Kj&oslash;ret&oslash;y/yrkesbil</strong>: bilbelte, vinterdekk, bilstol-ergonomi, kj&oslash;re- og hviletid hvis relevant &ndash; ingen rutiner dokumentert.</li>
<li><strong>Forsikring</strong> (rutinekap. 1.2): kun overskrift &ndash; faktiske polisenumre, dekning og yrkesskadeforsikring (lovp&aring;lagt) m&aring; dokumenteres.</li>
<li><strong>Brann og beredskap</strong> (rutinekap. 2): rutinene er generelle. Dokumentasjon p&aring; r&oslash;mningsplan og kontroll av sl&oslash;kkemidler p&aring; eget kontor mangler.</li>
<li><strong>Vernerunder</strong> (rutinekap. 3.1): teksten viser til verneombud, men bedriften har valgt &aring; ikke ha verneombud. Rutinen m&aring; tilpasses &ndash; eier/daglig leder gjennomf&oslash;rer egenkontroll &aring;rlig.</li>
<li><strong>F&oslash;rstehjelp</strong>: sjekklister for kontroll av f&oslash;rstehjelpsutstyr (b&aring;de p&aring; kontor og i yrkesbil) og dokumentert oppl&aelig;ring mangler.</li>
<li><strong>Personvern/GDPR</strong>: ved taksering h&aring;ndteres personopplysninger og bilder fra skader. Rutine for behandling, lagring og sletting b&oslash;r dokumenteres.</li>
</ol>

<div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:12px 16px;margin:16px 0">
<strong>Konklusjon:</strong> H&aring;ndboken har grunnstrukturen p&aring; plass, men de fleste kapitlene mangler konkret innhold og signaturer. Systemet i Total-IK er n&aring; aktivert og rutinene kan flyttes over.
</div>

<h3 style="color:#0b3d6e">Hva er gjort i systemet</h3>
<ul>
<li>Modulen IK HMS er aktivert</li>
<li>Bransje satt til taksering/konsulent</li>
<li>Antall ansatte registrert (1)</li>
<li>Maler for rutiner, sjekklister og risikoanalyse er tilgjengelige</li>
</ul>

<h3 style="color:#0b3d6e">Neste steg</h3>
<ol>
<li>Logg inn p&aring; <a href="https://totalik.no">totalik.no</a> og fullf&oslash;r oppsettsveiviseren</li>
<li>Signer egenerkl&aelig;ring og verneombud-avtale digitalt</li>
<li>Fyll ut risikoanalyse og handlingsplan tilpasset takseringsarbeid og alene-arbeid</li>
<li>Registrer kjemikalier i stoffkartoteket</li>
<li>Bestill pliktig HMS-kurs for daglig leder</li>
</ol>

<p>Ta kontakt med din kontaktperson <strong>Gard Fosdahl</strong> om du &oslash;nsker hjelp til oppsett eller HMS-kurs.</p>
<p style="margin-top:24px">Vennlig hilsen,<br><strong>Gard Fosdahl</strong><br>Athena Kurs og Internkontroll AS / Total-IK<br><a href="mailto:gard@athenahms.no">gard@athenahms.no</a></p>
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
      from: "Total-IK <gard@athenahms.no>",
      to: ["karsten@biltakst.com"],
      bcc: ["gard@athenahms.no"],
      reply_to: "gard@athenahms.no",
      subject: "Revisjonsrapport HMS – Biltekniske Bergen AS",
      html,
    }),
  });
  const j = await r.json();
  console.log("resend", r.status, JSON.stringify(j));
  return new Response(JSON.stringify(j), { status: r.status, headers: { "Content-Type": "application/json" } });
});
