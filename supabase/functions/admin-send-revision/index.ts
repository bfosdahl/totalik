import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:720px;margin:auto;padding:24px">
<h2 style="color:#0b3d6e;margin:0 0 4px">Revisjonsrapport HMS</h2>
<p style="margin:0 0 16px;color:#555"><strong>Svensen Malerservice</strong> &middot; Org.nr. 917 476 926 &middot; Rossgutua 255, 2848 Skreia</p>
<p>Hei &Aring;ge,</p>
<p>Vi har gjennomg&aring;tt den innsendte HMS-h&aring;ndboken for Svensen Malerservice og satt opp Total-IK med <strong>IK HMS</strong> tilpasset maler- og byggtapetseringsvirksomhet. H&aring;ndboken har en enkel grunnstruktur, men de fleste kapitlene er tomme plassholdere uten konkret innhold, frister eller signaturer. Under f&oslash;lger en oppsummering av funn og hva som b&oslash;r p&aring; plass.</p>

<div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:12px 16px;margin:16px 0">
Bedriften har <strong>1 ansatt</strong> (daglig leder &Aring;ge Svensen). Avtale om ikke &aring; ha verneombud er derfor i utgangspunktet i orden iht. AML &sect; 6-1, men avtalen p&aring; s. 6 m&aring; signeres og dateres.
</div>

<h3 style="color:#0b3d6e">Hovedfunn</h3>
<ol>
<li><strong>Avtale om ikke &aring; ha verneombud</strong> (s. 6) er ikke signert eller datert &ndash; m&aring; signeres digitalt av &Aring;ge Svensen.</li>
<li><strong>Egenerkl&aelig;ring</strong> (s. 7) er ikke signert. M&aring; signeres digitalt av daglig leder.</li>
<li><strong>Pliktig HMS-kurs for daglig leder</strong> &Aring;ge Svensen etter AML &sect; 3-5 (6&ndash;7 timer) &ndash; ingen dokumentasjon. Vi tilbyr dette kurset.</li>
<li><strong>Lover og forskrifter</strong> (s. 11) er kun plassholder. M&aring; listes konkret: AML, IK-forskriften, forskrift om utf&oslash;relse av arbeid, forskrift om tiltaks- og grenseverdier, kjemikalieforskriften, avfallsforskriften, brann- og eksplosjonsvernloven.</li>
<li><strong>Avtaleoversikt</strong> (s. 10) inneholder kun &eacute;n leverand&oslash;r. M&aring; suppleres med regnskap, forsikring, yrkesskadeforsikring, elektriker, brannvern og leverand&oslash;rer av maling/kjemikalier.</li>
<li><strong>Oppl&aelig;ring</strong> (s. 12) og <strong>system-gjennomgang</strong> (s. 13) er tomme overskrifter.</li>
<li><strong>Avviksregister</strong> (s. 14) er tomt. Skal brukes aktivt &ndash; ogs&aring; n&aelig;rulykker og materiellskader.</li>
<li><strong>M&aring;lsetting for IK/HMS</strong> (s. 15) er generell &ndash; mangler konkrete, m&aring;lbare m&aring;l for malerbedriften.</li>
<li><strong>Organisasjonskart</strong> (s. 16) viser bare arbeidsgiver &Aring;ge Svensen. M&aring; merkes med roller som HMS-ansvarlig, brannvernleder og f&oslash;rstehjelpsansvarlig.</li>
<li><strong>Risikoanalyse</strong> (s. 17) inneholder kun &eacute;tt punkt (el-kontroll). For malervirksomhet mangler vurdering av kjemikalier/l&oslash;semidler, st&oslash;v fra sliping, ergonomi (arbeid over hodeh&oslash;yde, knestillinger), arbeid i h&oslash;yden/stillas, st&oslash;y, fallrisiko, kj&oslash;ring til kunde og psykososialt ved alenearbeid.</li>
<li><strong>Handlingsplan</strong> (s. 18) har frist <strong>juli 2017</strong> &ndash; ikke fulgt opp p&aring; over 8 &aring;r. M&aring; oppdateres med nye frister.</li>
<li><strong>Stoffkartotek</strong> mangler. Som maler m&aring; sikkerhetsdatablad foreligge for all maling, l&oslash;semidler, white spirit, l&oslash;sningsmidler, sparkel, lim, fugemasse, rengj&oslash;ringsmidler, beis, lakk og impregneringsmidler (forskrift om utf&oslash;relse av arbeid kap. 2).</li>
<li><strong>Kjemisk helsefare</strong>: vurdering av eksponering for l&oslash;semiddeld&aring;mp, isocyanater og st&oslash;v &ndash; mangler. Krever risikovurdering og dokumentert bruk av &aring;ndedrettsvern (helmaske/halvmaske med riktig filter).</li>
<li><strong>Arbeid i h&oslash;yden / stillas</strong>: dokumentasjon p&aring; stillaskurs (2-, 5- eller 9-meterskurs), fallsikringsutstyr og kontroll av stiger og bukker mangler.</li>
<li><strong>Personlig verneutstyr</strong>: oversikt og utdeling av hansker (nitril ved l&oslash;semidler), vernebriller, st&oslash;vmaske P3, &aring;ndedrettsvern A2P3, h&oslash;rselsvern og vernesko mangler.</li>
<li><strong>Brann og beredskap</strong> (kap. 2) er kun en tom overskrift. M&aring; ha rutine for varme arbeider, l&oslash;semiddellager, brannslukker i bil og p&aring; arbeidssted, samt selvantenning av filler med olje/beis.</li>
<li><strong>Ulykker og skader</strong> (kap. 2.2) mangler innhold &ndash; m&aring; ha rutine for varsling av Arbeidstilsynet (815 48 222) og NAV ved alvorlig personskade.</li>
<li><strong>F&oslash;rstehjelp</strong>: f&oslash;rstehjelpsutstyr i bil og p&aring; arbeidssted, kontroll og oppl&aelig;ring mangler.</li>
<li><strong>El-kontroll</strong>: dokumentasjon p&aring; gjennomf&oslash;rt el-kontroll mangler (var planlagt 2017).</li>
<li><strong>Yrkesskadeforsikring</strong> (s. 19) &ndash; selskap og polise er ikke fylt inn. M&aring; dokumenteres (lovp&aring;lagt).</li>
<li><strong>Avfallsh&aring;ndtering</strong>: rutine for levering av farlig avfall (malingrester, l&oslash;semidler, sparkel, t&oslash;rkepapir tilgriset med kjemikalier) til godkjent mottak mangler.</li>
<li><strong>Ergonomi</strong>: ingen vurdering av belastningsskader fra rulling/pensling over hodeh&oslash;yde, kne-/ryggbelastning ved gulvarbeid.</li>
<li><strong>St&oslash;v og sliping</strong>: rutine for st&oslash;vavsug, P3-maske og rengj&oslash;ring av arbeidssted mangler.</li>
<li><strong>Alenearbeid</strong>: som enkeltmannsforetak b&oslash;r det v&aelig;re rutine for innsjekk hos kunde/partner og varsling ved fall eller ulykke.</li>
<li><strong>Bilbruk</strong>: rutine for sikker lasting/sikring av kjemikalier under transport mangler.</li>
</ol>

<div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:12px 16px;margin:16px 0">
<strong>Konklusjon:</strong> H&aring;ndboken er svaert tynn og har ikke v&aelig;rt oppdatert siden 2017. Den st&oslash;rste mangelen for en malerbedrift er manglende stoffkartotek, risikovurdering av kjemisk eksponering og arbeid i h&oslash;yden, samt pliktig HMS-kurs for daglig leder. Systemet i Total-IK er n&aring; aktivert slik at rutiner, stoffkartotek, sjekklister og risikovurdering kan settes opp p&aring; en strukturert m&aring;te.
</div>

<h3 style="color:#0b3d6e">Hva er gjort i systemet</h3>
<ul>
<li>Modulen <strong>IK HMS</strong> er aktivert med bransje maler/byggtapetsering</li>
<li>Antall ansatte registrert (1)</li>
<li>Maler for rutiner, sjekklister, risikoanalyse og stoffkartotek er tilgjengelige</li>
</ul>

<h3 style="color:#0b3d6e">Neste steg</h3>
<ol>
<li>Logg inn p&aring; <a href="https://totalik.no">totalik.no</a> og fullf&oslash;r oppsettsveiviseren</li>
<li>Signer egenerkl&aelig;ring og avtale om ikke &aring; ha verneombud digitalt</li>
<li>Oppdater risikoanalyse og handlingsplan med nye, aktuelle frister</li>
<li>Registrer kjemikalier (maling, l&oslash;semidler, sparkel m.m.) i stoffkartoteket</li>
<li>Last opp dokumentasjon p&aring; stillas-/h&oslash;ydekurs, el-kontroll og yrkesskadeforsikring</li>
<li>Bestill pliktig HMS-kurs for daglig leder &Aring;ge Svensen</li>
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
      to: ["age.svensen@gmail.com"],
      cc: ["gard@athenahms.no"],
      bcc: ["ben@athenahms.no"],
      reply_to: "gard@athenahms.no",
      subject: "Revisjonsrapport HMS – Svensen Malerservice",
      html,
    }),
  });
  const body = await r.text();
  return new Response(body, { status: r.status, headers: { "Content-Type": "application/json" } });
});
