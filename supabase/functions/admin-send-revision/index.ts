import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:720px;margin:auto;padding:24px">
<h2 style="color:#0b3d6e;margin:0 0 4px">Revisjonsrapport HMS</h2>
<p style="margin:0 0 16px;color:#555"><strong>Arce Bygg AS</strong> &middot; Org.nr. 924 562 803 &middot; Biristrandvegen 282, 2837 Biristrand</p>
<p>Hei Arturas,</p>
<p>Vi har gjennomg&aring;tt den innsendte HMS-h&aring;ndboken for Arce Bygg AS og satt opp Total-IK med <strong>IK HMS</strong>-modulen for bygg/t&oslash;mrer-bransjen. H&aring;ndboken har grunnstrukturen p&aring; plass med bygg-spesifikke rutiner, men de fleste seksjonene mangler konkret innhold og signaturer.</p>

<h3 style="color:#0b3d6e">Hovedfunn</h3>
<ol>
<li><strong>Egenerkl&aelig;ring er ikke signert</strong> (s. 7). M&aring; signeres digitalt av daglig leder.</li>
<li><strong>Avtale om &aring; ikke ha verneombud</strong> (s. 6) er ikke signert. Bedriften har 1 ansatt og kan inng&aring; slik avtale (AML &sect; 6-1), men den m&aring; signeres og fornyes hvert 2. &aring;r.</li>
<li><strong>Pliktig HMS-kurs for daglig leder</strong> Arturas Povilaitis etter AML &sect; 3-5 (6&ndash;7 timer) &ndash; ingen dokumentasjon. Tilbys av oss.</li>
<li><strong>Lover og forskrifter</strong> (s. 11): kun plassholder, ingen konkret oversikt. M&aring; listes opp (AML, IK-forskriften, byggherreforskriften, forskrift om utf&oslash;relse av arbeid, plan- og bygningsloven, SAK10, kjemikalieforskriften, st&oslash;yforskriften).</li>
<li><strong>Avtaleoversikt</strong> (s. 10) er tom. Skal inneholde regnskap, forsikring, yrkesskadeforsikring, elektriker, brannvern, renovasjon, leverand&oslash;rer av byggevarer m.m.</li>
<li><strong>Oppl&aelig;ring</strong> (s. 12) og <strong>system-gjennomgang</strong> (s. 13) er tomme overskrifter uten dokumentert innhold.</li>
<li><strong>Avviksregister</strong> (s. 14) er tomt. Skal brukes aktivt &ndash; ogs&aring; sm&aring; saker.</li>
<li><strong>M&aring;lsetting for IK/HMS</strong> (s. 15 og 33): mangler konkrete, m&aring;lbare m&aring;l.</li>
<li><strong>Organisasjonskart</strong> (s. 16 og 34): viser kun &laquo;Arbeidsgiver: Arturas Povilaitis&raquo;. Roller (HMS-ansvarlig, brannvernleder, f&oslash;rstehjelpsansvarlig, ansvarlig s&oslash;ker/utf&oslash;rende der relevant) m&aring; legges inn.</li>
<li><strong>Risikoanalyse IK/BYGG</strong> (s. 17) er tom. M&aring; suppleres med typiske byggrisikoer: arbeid i h&oslash;yden, fallsikring, stillas, tunge l&oslash;ft, klem-/kuttskader, st&oslash;v og st&oslash;y fra maskiner, vibrerende verkt&oslash;y, elektriske verkt&oslash;y.</li>
<li><strong>Risikoanalyse IK/HMS</strong> (s. 35) er tom. Skal dekke psykososialt, ergonomi, alene-arbeid og generell HMS.</li>
<li><strong>Handlingsplan</strong> (s. 18 og 36) er tom. Skal vise konkrete tiltak, ansvarlig og frist for hver risiko.</li>
<li><strong>Stoffkartotek</strong> mangler. M&aring; inneholde sikkerhetsdatablad for byggskum, lim, fugemasse, impregneringsmidler, l&oslash;semidler, rengj&oslash;ringsmidler m.m.</li>
<li><strong>CE-dokumentasjon</strong> for tre-bearbeidingsmaskiner, sirkels&aring;g, h&oslash;velbenk og elektriske verkt&oslash;y mangler.</li>
<li><strong>Vibrerende verkt&oslash;y</strong>: ingen vurdering av eksponering (forskrift om utf&oslash;relse av arbeid kap. 14) for slagbor, vinkelsliper, spikerpistol m.m.</li>
<li><strong>Fallsikring og arbeid i h&oslash;yden</strong>: kun overskrift i rutinekap. 2.1. Sertifisert fallsikringsutstyr, kontroll, oppl&aelig;ring og stillas-kompetanse m&aring; dokumenteres.</li>
<li><strong>H&oslash;rselsvern og st&oslash;ym&aring;ling</strong>: ingen dokumentasjon p&aring; st&oslash;yeksponering fra maskiner og bruk av h&oslash;rselsvern.</li>
<li><strong>St&oslash;v</strong> (tre-/kvartsst&oslash;v): mangler vurdering og rutine for st&oslash;vmaske/avsug.</li>
<li><strong>Vernerunder</strong> p&aring; byggeplass mangler &ndash; rutine og sjekklister m&aring; opprettes (egenkontroll siden bedriften ikke har verneombud).</li>
<li><strong>Brann og beredskap</strong> (rutinekap. 6): generelle rutiner, men dokumentasjon p&aring; r&oslash;mningsplan, kontroll av sl&oslash;kkemidler p&aring; byggeplass og varme arbeider-sertifikat mangler.</li>
<li><strong>ID-kort/HMS-kort</strong> for byggebransjen er pliktig (byggekortforskriften) &ndash; m&aring; dokumenteres.</li>
<li><strong>F&oslash;rstehjelp</strong>: sjekklister for kontroll av f&oslash;rstehjelpsutstyr (p&aring; byggeplass og i bil) og dokumentert oppl&aelig;ring mangler.</li>
<li><strong>Yrkesskadeforsikring</strong> (lovp&aring;lagt) &ndash; polise m&aring; dokumenteres.</li>
<li><strong>Underentrepren&oslash;rer</strong> (rutinekap. 1.9): rutinen finnes, men sjekkliste/evaluering ved bruk av UE er ikke dokumentert.</li>
</ol>

<div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:12px 16px;margin:16px 0">
<strong>Konklusjon:</strong> H&aring;ndboken har solid grunnstruktur med bygg-spesifikke rutiner, men de fleste kapitlene mangler konkret innhold og signaturer. Systemet i Total-IK er n&aring; aktivert og rutinene kan flyttes over.
</div>

<h3 style="color:#0b3d6e">Hva er gjort i systemet</h3>
<ul>
<li>Modulen IK HMS er aktivert</li>
<li>Bransje satt til bygg/t&oslash;mrer</li>
<li>Antall ansatte registrert (1)</li>
<li>Maler for rutiner, sjekklister og risikoanalyse er tilgjengelige</li>
</ul>

<h3 style="color:#0b3d6e">Neste steg</h3>
<ol>
<li>Logg inn p&aring; <a href="https://totalik.no">totalik.no</a> og fullf&oslash;r oppsettsveiviseren</li>
<li>Signer egenerkl&aelig;ring og verneombud-avtale digitalt</li>
<li>Fyll ut risikoanalyse og handlingsplan tilpasset bygg/t&oslash;mrerarbeid</li>
<li>Registrer kjemikalier og CE-dokumentasjon p&aring; maskiner</li>
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
      to: ["arce@arcebygg.no"],
      bcc: ["gard@athenahms.no"],
      reply_to: "gard@athenahms.no",
      subject: "Revisjonsrapport HMS – Arce Bygg AS",
      html,
    }),
  });
  const j = await r.json();
  console.log("resend", r.status, JSON.stringify(j));
  return new Response(JSON.stringify(j), { status: r.status, headers: { "Content-Type": "application/json" } });
});
