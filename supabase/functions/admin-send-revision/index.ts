import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:720px;margin:auto;padding:24px">
<h2 style="color:#0b3d6e;margin:0 0 4px">Revisjonsrapport HMS &amp; KS Bygg</h2>
<p style="margin:0 0 16px;color:#555"><strong>Noddeland Bygg</strong> &middot; Org.nr. 984 607 245 &middot; L&oslash;vjom&aring;sheia 215, 4820 Froland</p>
<p>Hei Finn Arne,</p>
<p>Vi har gjennomg&aring;tt den innsendte HMS-h&aring;ndboken for Noddeland Bygg og satt opp Total-IK med <strong>IK HMS</strong> og <strong>KS Bygg</strong> tilpasset t&oslash;mrervirksomhet. H&aring;ndboken har en grei innholdsfortegnelse med b&aring;de IK/HMS-, IK/Bygg- og ks-hmsproffen-seksjoner, men de fleste kapitlene er tomme eller mangler konkret innhold, frister og signaturer.</p>

<div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:12px 16px;margin:16px 0">
Bedriften har <strong>3 ansatte</strong> (2 heltid + 1 deltid). Avtale om ikke &aring; ha verneombud er i utgangspunktet i orden iht. AML &sect; 6-1 (under 10 ansatte), men avtalen p&aring; s. 6 m&aring; signeres og dateres av samtlige ansatte og ledelsen.
</div>

<h3 style="color:#0b3d6e">Hovedfunn</h3>
<ol>
<li><strong>Avtale om ikke &aring; ha verneombud</strong> (s. 6) er ikke signert eller datert &ndash; m&aring; signeres digitalt av alle ansatte og daglig leder.</li>
<li><strong>Egenerkl&aelig;ring</strong> (s. 7) er ikke signert. M&aring; signeres digitalt av Finn Arne Noddeland og representant for de ansatte.</li>
<li><strong>Pliktig HMS-kurs for daglig leder</strong> Finn Arne Noddeland etter AML &sect; 3-5 (6&ndash;7 timer) &ndash; ingen dokumentasjon. Tilbys av oss.</li>
<li><strong>Lover og forskrifter</strong> (s. 11) er kun plassholder. M&aring; listes konkret: AML, IK-forskriften, byggherreforskriften, forskrift om utf&oslash;relse av arbeid, plan- og bygningsloven, SAK10, byggekortforskriften, forurensningsloven, avfallsforskriften.</li>
<li><strong>Avtaleoversikt</strong> (s. 10) inneholder kun &eacute;n leverand&oslash;r (Edmond konsulent). M&aring; suppleres med regnskap, forsikring, yrkesskadeforsikring, elektriker, brannvern, materialleverand&oslash;rer.</li>
<li><strong>Oppl&aelig;ring</strong> (s. 12) og <strong>system-gjennomgang</strong> (s. 13) er tomme overskrifter uten dokumentert innhold.</li>
<li><strong>Avviksregister</strong> (s. 14) er tomt. Skal brukes aktivt &ndash; ogs&aring; n&aelig;rulykker og materiellskader.</li>
<li><strong>Risikoanalyse IK/HMS</strong> (s. 15), <strong>IK/Bygg</strong> (s. 18) og <strong>ks-hmsproffen</strong> (s. 23) er stort sett tomme. For t&oslash;mrer mangler vurdering av fallrisiko, l&oslash;ftekader, st&oslash;v fra sliping/saging, st&oslash;y, vibrerende verkt&oslash;y, ergonomi, transport og psykososialt.</li>
<li><strong>Handlingsplan</strong> for IK/HMS (s. 16), IK/Bygg (s. 19) og ks-hmsproffen (s. 24) mangler tiltak, ansvarlige og frister.</li>
<li><strong>M&aring;lsetting for ks-hmsproffen</strong> (s. 21) er generell &ndash; mangler konkrete, m&aring;lbare m&aring;l.</li>
<li><strong>Organisasjonskart</strong> (s. 22) viser kun arbeidsgiver Finn Arne Noddeland. M&aring; merkes med HMS-ansvarlig, brannvernleder og f&oslash;rstehjelpsansvarlig, samt navn p&aring; de to &oslash;vrige ansatte.</li>
<li><strong>Fysiske arbeidsforhold</strong> (kap. 1.2) har tomme vurderingsskjema &ndash; m&aring; fylles ut for hvert byggeprosjekt.</li>
<li><strong>Brann og beredskap</strong> (kap. 2) har bare overskrifter. M&aring; ha rutine for varme arbeider (sertifikat p&aring;krevd), brannslukker i bil og p&aring; byggeplass, samt selvantenning av filler.</li>
<li><strong>Ulykker og skader</strong> (kap. 2.2) mangler innhold &ndash; m&aring; ha rutine for varsling av Arbeidstilsynet og NAV ved alvorlig personskade.</li>
<li><strong>Anskaffelse, bruk og vedlikehold av maskiner</strong> (kap. 3.1): CE-dokumentasjon, &aring;rlig sakkyndig kontroll og bruksanvisninger p&aring; sirkels&aring;g, kapps&aring;g, h&oslash;velbenk, spikerpistol, elektriske h&aring;ndverkt&oslash;y mangler.</li>
<li><strong>Arbeid i h&oslash;yden</strong> (kap. 4.1): stillaskurs (2-, 5- eller 9-meter), fallsikringsutstyr med &aring;rlig kontroll, stigeoppl&aelig;ring og rutine ved arbeid over 2 m mangler.</li>
<li><strong>Stoffkartotek</strong> mangler. M&aring; inneholde sikkerhetsdatablad for lim, fugemasse, byggskum, impregneringsmidler, beis, lakk, l&oslash;semidler, rengj&oslash;ringsmidler, drivstoff.</li>
<li><strong>St&oslash;v og sliping</strong>: rutine for st&oslash;vavsug, P3-maske og rengj&oslash;ring av arbeidssted (tre-/kvartsst&oslash;v) mangler.</li>
<li><strong>Vibrerende verkt&oslash;y</strong>: ingen vurdering av h&aring;nd-arm-vibrasjoner (forskrift om utf&oslash;relse av arbeid kap. 14).</li>
<li><strong>St&oslash;y</strong>: ingen dokumentasjon p&aring; st&oslash;ym&aring;ling/h&oslash;rselsvern fra sirkels&aring;g, spikerpistol og slagverkt&oslash;y.</li>
<li><strong>Personlig verneutstyr</strong>: oversikt og utdeling av vernehjelm, vernebriller, h&oslash;rselsvern, hansker, st&oslash;vmaske, fallsele og vernesko mangler.</li>
<li><strong>ID-kort/HMS-kort</strong> for byggebransjen: dokumentasjon p&aring; gyldige kort for alle 3 ansatte m&aring; legges inn.</li>
<li><strong>F&oslash;rstehjelp</strong>: f&oslash;rstehjelpsutstyr i bil og p&aring; byggeplass, kontroll og oppl&aelig;ring mangler.</li>
<li><strong>Yrkesskadeforsikring</strong> (lovp&aring;lagt) &ndash; selskap og polise m&aring; dokumenteres.</li>
<li><strong>Avfallsh&aring;ndtering</strong> (kap. 5): rutine for sortering, levering av farlig avfall (impregnert tre, asbestmistanke, kjemikalier) og avfallsplan per byggeprosjekt mangler.</li>
<li><strong>Byggherreforskriften</strong>: dokumentasjon p&aring; rolle som hovedbedrift/underentrepren&oslash;r, SJA og HMS-plan per prosjekt mangler.</li>
<li><strong>El-sikkerhet</strong> (kap. 1.1): rutine for kontroll av elektriske anlegg p&aring; byggeplass og bruk av jordfeilbryter mangler.</li>
</ol>

<div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:12px 16px;margin:16px 0">
<strong>Konklusjon:</strong> H&aring;ndboken har en grei oppbygging med b&aring;de IK/HMS-, IK/Bygg- og ks-hmsproffen-seksjoner, men de fleste seksjonene er tomme eller mangler konkret innhold, frister og signaturer. De viktigste manglene for en t&oslash;mrerbedrift er manglende stoffkartotek, risikovurdering av fall/h&oslash;yde, CE-dokumentasjon p&aring; maskiner og pliktig HMS-kurs for daglig leder. Systemet i Total-IK er n&aring; aktivert med IK HMS og KS Bygg slik at rutiner, sjekklister og prosjekter kan settes opp strukturert.
</div>

<h3 style="color:#0b3d6e">Hva er gjort i systemet</h3>
<ul>
<li>Modulen <strong>IK HMS</strong> er aktivert med bransje bygg/t&oslash;mrer</li>
<li>Modulen <strong>KS Bygg</strong> er aktivert</li>
<li>Antall ansatte registrert (3)</li>
<li>Maler for rutiner, sjekklister, SJA og risikoanalyse er tilgjengelige</li>
</ul>

<h3 style="color:#0b3d6e">Neste steg</h3>
<ol>
<li>Logg inn p&aring; <a href="https://totalik.no">totalik.no</a> og fullf&oslash;r oppsettsveiviseren</li>
<li>Signer egenerkl&aelig;ring og avtale om ikke &aring; ha verneombud digitalt</li>
<li>Legg inn de &oslash;vrige 2 ansatte med stilling og kontaktinfo</li>
<li>Oppdater risikoanalyse og handlingsplan med nye, aktuelle frister</li>
<li>Registrer kjemikalier (lim, fugemasse, beis m.m.) i stoffkartoteket</li>
<li>Last opp stillas-/h&oslash;ydekurs, HMS-kort og yrkesskadeforsikring</li>
<li>Opprett aktive byggeprosjekter i KS Bygg med SJA, sjekklister og daglige rapporter</li>
<li>Bestill pliktig HMS-kurs for daglig leder Finn Arne Noddeland</li>
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
      to: ["mr.noddeland@gmail.com"],
      cc: ["gard@athenahms.no"],
      bcc: ["ben@athenahms.no"],
      reply_to: "gard@athenahms.no",
      subject: "Revisjonsrapport HMS & KS Bygg – Noddeland Bygg",
      html,
    }),
  });
  const body = await r.text();
  return new Response(body, { status: r.status, headers: { "Content-Type": "application/json" } });
});
