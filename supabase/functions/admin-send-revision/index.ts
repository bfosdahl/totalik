import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:720px;margin:auto;padding:24px">
<h2 style="color:#0b3d6e;margin:0 0 4px">Revisjonsrapport HMS &ndash; Madam Maud AS</h2>
<p style="margin:0 0 16px;color:#555"><strong>Madam Maud AS</strong> &middot; Org.nr. 931 468 154 &middot; Jerikovegen 4, 2848 Skreia</p>
<p>Hei Inger Lise,</p>
<p>Vi har gjennomg&aring;tt den innsendte HMS-h&aring;ndboken for Madam Maud AS og satt opp Total-IK med <strong>IK HMS</strong> tilpasset butikkhandel/kl&aelig;r. H&aring;ndboken som er sendt inn er en standardmal som <strong>i hovedsak ikke er fylt ut</strong>, og en rekke vesentlige punkter m&aring; p&aring; plass for &aring; tilfredsstille kravene i internkontrollforskriften.</p>

<div style="background:#fde8e8;border-left:4px solid #dc2626;padding:12px 16px;margin:16px 0">
<strong>STATUS:</strong> Bedriften er registrert med <strong>1 ansatt</strong> (deg selv som daglig leder/eier). Avtalen p&aring; s. 6 om &aring; ikke ha verneombud er <em>gyldig</em> s&aring;lenge dere er under 10 ansatte (AML &sect; 6-1), men m&aring; faktisk dateres og signeres. Skulle dere ansette flere, m&aring; verneombud velges.
</div>

<h3 style="color:#0b3d6e">Hovedfunn</h3>
<ol>
<li><strong>Avtale om ikke &aring; ha verneombud</strong> er udatert og usignert. M&aring; signeres av deg som daglig leder. Gyldighet 2 &aring;r.</li>
<li><strong>Egenerkl&aelig;ring</strong> er ikke signert. M&aring; signeres digitalt av daglig leder Inger Lise Henden.</li>
<li><strong>Pliktig HMS-kurs for daglig leder</strong> etter AML &sect; 3-5 (6&ndash;7 timer) &ndash; ingen dokumentasjon. Lovp&aring;lagt for alle som driver virksomhet med ansatte. Tilbys av oss.</li>
<li><strong>Forretningsid&eacute;</strong> er tom &ndash; m&aring; beskrives kort (butikkhandel med kl&aelig;r, m&aring;lgruppe, eventuelle tilleggstjenester).</li>
<li><strong>Avtaleoversikt</strong> er helt tom. M&aring; suppleres med: regnskapsf&oslash;rer, forsikring (yrkesskade, innbo/l&oslash;s&oslash;re og avbrudd), leverand&oslash;rer av kl&aelig;r/varer, kassasystem/betalingsterminal, vaktselskap/alarm, renhold, brannvern/slukkerservice, el-kontroll, avfallsh&aring;ndtering, husleieavtale.</li>
<li><strong>Lover og forskrifter</strong> er kun plassholder. M&aring; listes konkret: Arbeidsmilj&oslash;loven, Internkontrollforskriften, Arbeidsplassforskriften, Forskrift om utf&oslash;relse av arbeid, Kj&oslash;psloven og Forbrukerkj&oslash;psloven, Markedsf&oslash;ringsloven, Angrerettloven, Bokf&oslash;ringsloven, Kassasystemloven, Personopplysningsloven/GDPR, Brann- og eksplosjonsvernloven og Folkehelseloven.</li>
<li><strong>Oppl&aelig;ring</strong> er tom. M&aring; dokumentere: pliktig HMS-kurs for daglig leder, brannvernoppl&aelig;ring, kasse-/betalingsoppl&aelig;ring, kunderets-/reklamasjonsh&aring;ndtering, f&oslash;rstehjelp, r&aring;nsforebygging og h&aring;ndtering av truende kunder.</li>
<li><strong>Gjennomgang av system</strong> &ndash; &aring;rlig revisjon m&aring; planlegges og dokumenteres. Total-IK setter dette opp i &aring;rshjul.</li>
<li><strong>Avviksregister</strong> er tomt. M&aring; brukes aktivt for: kundeklager, reklamasjoner, sklilulykker i butikk, tyveri/svinn, brann, trusler/r&aring;n, IT-/kassesystemfeil, str&oslash;mbrudd.</li>
<li><strong>M&aring;lsetting for IK/HMS</strong> er generell tekst uten konkrete m&aring;l. M&aring; oppdateres med m&aring;lbare m&aring;l for 2026 (f.eks. null skader, 100% gjennomf&oslash;rt brannvernrunde, null avvik p&aring; el-kontroll).</li>
<li><strong>Risikoanalyse</strong> er helt tom. M&aring; utf&oslash;res med kartlegging av: ergonomi (statisk st&aring;ende arbeid, l&oslash;ft av varer/kasser), sklirisiko (v&aring;te gulv ved inngang, vinterf&oslash;re), brannrisiko (mye tekstil = h&oslash;y brannbelastning, lys/spotter, elektrisk utstyr), tyveri/svinn, r&aring;n og trusler, alenearbeid p&aring; kveld/helg, kasse- og kontanth&aring;ndtering, inneklima/ventilasjon, st&oslash;v fra tekstiler, vinduspuss/h&oslash;ydearbeid, prislapping med tagger og saks.</li>
<li><strong>Handlingsplan</strong> er tom. M&aring; fylles ut med tiltak, ansvarlig og frist for hver identifisert risiko (f.eks. installasjon av alarm/overv&aring;kning, sklisikre matter, sjekkliste alenearbeid).</li>
<li><strong>Rutiner for IK/HMS</strong> mangler. M&aring; opprettes for: &aring;pning og lukking av butikk, kasseoppgj&oslash;r og kontanth&aring;ndtering, h&aring;ndtering av reklamasjoner, brann og evakuering, f&oslash;rstehjelp, h&aring;ndtering av truende kunder/r&aring;n, alenearbeid, varemottak og l&oslash;ft, prising og merking, renhold, avfall.</li>
<li><strong>Brann og beredskap</strong>: tekstilbutikker har h&oslash;y brannbelastning. Mangler rutine for &aring;rlig kontroll av brannslukker, r&oslash;ykvarsler, brannvernleder, evakueringsplan, branninstruks p&aring; vegg og r&oslash;mningsveier som skal v&aelig;re frie.</li>
<li><strong>F&oslash;rstehjelp</strong>: f&oslash;rstehjelpsskrin, oppl&aelig;ring og &aring;rlig kontroll mangler.</li>
<li><strong>Elektrisk kontroll</strong> (NEK 400/El-tilsynsloven): &aring;rlig egenkontroll og periodisk kontroll av el-anlegg, belysning og varmeovner mangler. Spesielt viktig pga. brannrisiko i tekstil.</li>
<li><strong>Yrkesskadeforsikring</strong> (lovp&aring;lagt): selskap og polisenummer m&aring; dokumenteres.</li>
<li><strong>Innbruddsalarm og overv&aring;kning</strong>: rutine, dokumentasjon p&aring; godkjenning fra Datatilsynet for kameraoverv&aring;kning og personvernerkl&aelig;ring mangler.</li>
<li><strong>R&aring;ns- og trusselforebygging</strong>: rutine for h&aring;ndtering av kontanter (begrenset beholdning i kassa, dagsoppgj&oslash;r), alenearbeid, panikk-/overfallsalarm og oppf&oslash;lging etter hendelse.</li>
<li><strong>Ergonomi</strong>: kartlegging av st&aring;ende arbeid, sittemulighet i kassa, l&oslash;ftehjelpemidler ved varemottak, h&oslash;yder p&aring; hyller og stiger.</li>
<li><strong>Inneklima/ventilasjon</strong>: arbeidsplassforskriften krever tilstrekkelig luftutskifting og temperatur 19&ndash;26 &deg;C. M&aring; dokumenteres.</li>
<li><strong>Renhold</strong>: rutine for daglig og periodisk renhold, s&aelig;rlig inngangsparti pga. sklirisiko.</li>
<li><strong>Avfallsh&aring;ndtering</strong>: rutine for papp/papir, plast, restavfall og eventuelt farlig avfall (lyspaerer, batterier).</li>
<li><strong>Kassasystem og bokf&oslash;ring</strong>: dokumentasjon p&aring; godkjent kassasystem (kassasystemloven) og rutine for dagsoppgj&oslash;r.</li>
<li><strong>GDPR/personvern</strong>: kundeklubb, nyhetsbrev, bookingsystem og bilder p&aring; sosiale medier m&aring; ha personvernerkl&aelig;ring og samtykker. Kameraoverv&aring;kning krever skilting og databehandleravtale.</li>
<li><strong>Sykefrav&aelig;rsoppf&oslash;lging</strong> og <strong>medarbeidersamtaler</strong>: rutine mangler (s&aelig;rlig viktig n&aring;r dere ansetter flere).</li>
<li><strong>Internkontrollh&aring;ndboken b&oslash;r oppdateres &aring;rlig</strong> &ndash; planlegges som fast aktivitet i &aring;rshjulet.</li>
</ol>

<div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:12px 16px;margin:16px 0">
<strong>Konklusjon:</strong> H&aring;ndboken er en standardmal med kun grunnleggende informasjon utfylt. <strong>Alle vesentlige kapitler er tomme</strong> &ndash; lover, avtaleoversikt, oppl&aelig;ring, avvik, m&aring;l, risikoanalyse, handlingsplan og rutiner. For butikkbransjen er brannvern, r&aring;ns-/tyveriforebygging, ergonomi og pliktig HMS-kurs for daglig leder de viktigste manglene. Systemet i Total-IK er n&aring; aktivert med IK HMS for butikk/kl&aelig;r slik at dette kan bygges opp strukturert.
</div>

<h3 style="color:#0b3d6e">Hva er gjort i systemet</h3>
<ul>
<li>Modulen <strong>IK HMS</strong> er aktivert med bransje butikk/kl&aelig;r</li>
<li>Antall ansatte registrert (1)</li>
<li>Maler for rutiner, sjekklister, SJA og risikoanalyse for butikk er tilgjengelige</li>
</ul>

<h3 style="color:#0b3d6e">Neste steg</h3>
<ol>
<li>Logg inn p&aring; <a href="https://totalik.no">totalik.no</a> og fullf&oslash;r oppsettsveiviseren</li>
<li>Signer egenerkl&aelig;ring og verneombudsavtale digitalt</li>
<li>Gjennomf&oslash;r risikoanalyse og lag handlingsplan med 2026-frister</li>
<li>Last opp yrkesskadeforsikring og &oslash;vrige avtaler</li>
<li>Bestill <strong>pliktig HMS-kurs for daglig leder</strong> hos oss</li>
<li>Avtal &aring;rlig el-kontroll og brannvernkontroll</li>
</ol>

<p>Ta kontakt med meg om du &oslash;nsker hjelp til oppsett eller HMS-kurs.</p>
<p style="margin-top:24px">Vennlig hilsen,<br><strong>Martin Hovland</strong><br>Athena Kurs og Internkontroll AS / Total-IK<br><a href="mailto:martin@athenahms.no">martin@athenahms.no</a></p>
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
      from: "Total-IK <martin@athenahms.no>",
      to: ["ingerlise.henden@gmail.com"],
      cc: ["martin@athenahms.no"],
      bcc: ["ben@athenahms.no"],
      reply_to: "martin@athenahms.no",
      subject: "Revisjonsrapport HMS – Madam Maud AS",
      html,
    }),
  });
  const body = await r.text();
  return new Response(body, { status: r.status, headers: { "Content-Type": "application/json" } });
});
