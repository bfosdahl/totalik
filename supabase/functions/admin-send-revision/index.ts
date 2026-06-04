import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:720px;margin:auto;padding:24px">
<h2 style="color:#0b3d6e;margin:0 0 4px">Revisjonsrapport HMS &ndash; Byggmester H. Clausen AS</h2>
<p style="margin:0 0 16px;color:#555"><strong>Byggmester H. Clausen AS</strong> &middot; Org.nr. 931 536 397 &middot; Persaunvegen 17, 7045 Trondheim</p>
<p>Hei H&aring;kon,</p>
<p>Vi har gjennomg&aring;tt den innsendte HMS-h&aring;ndboken og satt opp Total-IK med <strong>IK HMS</strong> og <strong>KS Bygg</strong> tilpasset byggmester/snekker. H&aring;ndboken har f&aring;tt p&aring; plass standardrutiner, men en rekke vesentlige punkter er fortsatt tomme eller mangler dokumentasjon for &aring; tilfredsstille kravene i internkontrollforskriften og byggherreforskriften.</p>

<div style="background:#fde8e8;border-left:4px solid #dc2626;padding:12px 16px;margin:16px 0">
<strong>STATUS:</strong> Bedriften er registrert med <strong>1 ansatt</strong> (deg selv som daglig leder). Avtalen p&aring; s. 6 om &aring; ikke ha verneombud er <em>gyldig</em> s&aring;lenge dere er under 10 ansatte (AML &sect; 6-1), men m&aring; faktisk dateres og signeres. Skulle dere ansette flere, m&aring; verneombud velges og 40-timers verneombudskurs tas.
</div>

<h3 style="color:#0b3d6e">Hovedfunn</h3>
<ol>
<li><strong>Avtale om ikke &aring; ha verneombud</strong> er udatert og usignert. M&aring; signeres av deg som daglig leder. Gyldighet 2 &aring;r.</li>
<li><strong>Egenerkl&aelig;ring</strong> er ikke signert. M&aring; signeres digitalt av daglig leder H&aring;kon Clausen.</li>
<li><strong>Pliktig HMS-kurs for daglig leder</strong> etter AML &sect; 3-5 (6&ndash;7 timer) &ndash; ingen dokumentasjon. Lovp&aring;lagt for alle som driver virksomhet med ansatte. Tilbys av oss.</li>
<li><strong>Sentral godkjenning / ansvarsrett</strong> etter SAK10: m&aring; dokumenteres hvilke tiltaksklasser og funksjoner (PRO/UTF) bedriften skal ha. Hvis dere bare jobber som UE under andre, m&aring; dette ogs&aring; fremg&aring;.</li>
<li><strong>Avtaleoversikt</strong> inneholder kun Athena HMS. M&aring; suppleres med: regnskapsf&oslash;rer, forsikring (yrkesskade, ansvar, verkt&oslash;y/maskin, bil, prosjektforsikring/CAR), bank, leverand&oslash;rer av byggevarer, stillas-/lifteleverand&oslash;r, avfallsmottak, el-kontroll og brannvernkontroll, eventuelt sentral godkjenning/StartBANK/UE-register.</li>
<li><strong>Lover og forskrifter</strong> er kun plassholder. M&aring; listes konkret: Arbeidsmilj&oslash;loven, Internkontrollforskriften, <strong>Byggherreforskriften</strong>, Forskrift om utf&oslash;relse av arbeid (kap. 17 arbeid i h&oslash;yden, kap. 3 kjemikalier, kap. 30 diisocyanater, kap. 14 st&oslash;y), Stillasforskriften, Arbeidsplassforskriften, Plan- og bygningsloven/SAK10, TEK17, El-tilsynsloven, Brann- og eksplosjonsvernloven, Allmenngj&oslash;ringsloven (l&oslash;nn i byggebransjen), Avfallsforskriften.</li>
<li><strong>Oppl&aelig;ring</strong> (kap. 5) er tom. M&aring; dokumentere: pliktig HMS-kurs for daglig leder, fagbrev/svennebrev t&oslash;mrer, HMS-kort byggebransjen (lovp&aring;lagt), dokumentert oppl&aelig;ring stillas (2/8/36 timer avhengig av h&oslash;yde), personl&oslash;fter/lift, fallsikring, varme arbeider (FG-sertifikat), motorsag/kappsag, diisocyanater (PUR-skum/lim &ndash; lovp&aring;lagt fra 24.08.2023), og f&oslash;rstehjelp.</li>
<li><strong>Gjennomgang av system</strong> (kap. 6) er tom. &Aring;rlig revisjon m&aring; planlegges og dokumenteres &ndash; settes opp i &aring;rshjul i Total-IK.</li>
<li><strong>Avviksregister</strong> (kap. 7) er tomt. M&aring; brukes aktivt for: skader/n&aelig;runlykker, fall, kuttskader, mangler p&aring; stillas/verkt&oslash;y, kundeklager, byggfeil, materialmangler, kjemikalies&oslash;l, brann.</li>
<li><strong>M&aring;lsetting for IK/HMS</strong> (kap. 8) er kun overskrift. M&aring; oppdateres med m&aring;lbare 2026-m&aring;l (null skader, 100 % HMS-kort, 100 % fallsikring, &lt;3 % sykefrav&aelig;r).</li>
<li><strong>Organisasjonskart</strong> (kap. 9) m&aring; fylles ut med roller (daglig leder, HMS-ansvarlig, evt. fremtidig verneombud).</li>
<li><strong>Risikoanalyse</strong> (kap. 10) er overflatisk. M&aring; utvides med konkret kartlegging av: arbeid i h&oslash;yden (tak, stillas, stige), fall p&aring; samme niv&aring;, kutt-/klemskader, l&oslash;ft av tunge byggevarer (ergonomi/rygg), bruk av h&aring;ndverkt&oslash;y og maskiner (sirkels&aring;g, sp&aelig;rfres, kappsag), st&oslash;v (kvarts, treverk &ndash; krever &aring;ndedrettsvern P3), st&oslash;y/vibrasjoner, kjemikalier (PUR-skum, lim, maling, l&oslash;semidler), elektrisk h&aring;ndverkt&oslash;y, varme arbeider, bilkj&oslash;ring til oppdrag, alenearbeid, kundekontakt/privatbolig.</li>
<li><strong>Handlingsplan</strong> (kap. 11): har noen punkter (oppl&aelig;ring, el-kontroll, arbeid i h&oslash;yden, brann) med 2025-frister som n&aring; er utg&aring;tt. M&aring; oppdateres med konkrete tiltak, ansvarlig og 2026-frister, og kobles til risikoanalysen.</li>
<li><strong>Stoffkartotek</strong> er ikke etablert. M&aring; opprettes med oppdaterte sikkerhetsdatablad for PUR-skum, lim, fugemasse, maling, beis, white-spirit, rensemidler m.m. Lovp&aring;lagt etter forskrift om utf&oslash;relse av arbeid kap. 3.</li>
<li><strong>Kjemisk risikovurdering</strong> og substitusjonsvurdering m&aring; gj&oslash;res for alle helsefarlige kjemikalier.</li>
<li><strong>Diisocyanater (PUR-skum/lim)</strong>: EU-krav til obligatorisk oppl&aelig;ring (kurs + sertifikat hvert 5. &aring;r) for alle som bruker produkter med &gt; 0,1 % diisocyanater. Helt sentralt for byggmester &ndash; m&aring; p&aring; plass.</li>
<li><strong>Personlig verneutstyr</strong> (PVU): rutinen finnes, men utlevering, oppl&aelig;ring og &aring;rlig kontroll m&aring; dokumenteres per ansatt (hjelm, vernesko, &oslash;yevern, h&oslash;reselsvern, P3-maske, hansker, fallsele).</li>
<li><strong>Stillas og fallsikring</strong>: dokumentert oppl&aelig;ring, kontroll f&oslash;r bruk, montasjeplan, fallsele med sertifikat og &aring;rlig kontroll mangler.</li>
<li><strong>Arbeid i h&oslash;yden</strong>: rutine for risikovurdering f&oslash;r hvert oppdrag (SJA), valg av riktig utstyr (stige/stillas/lift), forbud mot stige som arbeidsplattform over 5 m.</li>
<li><strong>Varme arbeider</strong>: FG-sertifikat er krav fra forsikringsselskap. M&aring; dokumenteres.</li>
<li><strong>Brann og beredskap</strong>: brannslukker i bil og verksted, r&oslash;ykvarsler, evakueringsplan og &aring;rlig brann&oslash;velse m&aring; dokumenteres.</li>
<li><strong>F&oslash;rstehjelp</strong>: f&oslash;rstehjelpsskrin i bil og p&aring; byggeplass, oppl&aelig;ring (HLR) og &aring;rlig kontroll mangler.</li>
<li><strong>St&oslash;y- og vibrasjonsm&aring;ling</strong>: vinkelsliper, kappsag, slagdrill, spikerpistol &ndash; m&aring; vurderes iht. forskrift om utf&oslash;relse av arbeid kap. 14.</li>
<li><strong>St&oslash;v</strong> (kvarts, treverk): krever P3-maske, st&oslash;vsuger med H/M-filter og rutine for boring/saging.</li>
<li><strong>HMS-kort byggebransjen</strong>: lovp&aring;lagt for alle som arbeider p&aring; bygge- og anleggsplass. M&aring; dokumenteres for deg og fremtidige ansatte/UE.</li>
<li><strong>Byggherreforskriften / SHA-plan</strong>: ved oppdrag der dere er hovedbedrift/koordinator, m&aring; SHA-plan utarbeides. M&aring; ha rutine.</li>
<li><strong>SJA</strong> (sikker jobbanalyse): m&aring; gj&oslash;res f&oslash;r risikofylte oppgaver (tak, riving, h&oslash;ydearbeid, varme arbeider).</li>
<li><strong>Yrkesskadeforsikring</strong> (lovp&aring;lagt): selskap og polisenummer m&aring; dokumenteres.</li>
<li><strong>Kj&oslash;ret&oslash;y/firmabil</strong>: rutine for daglig sjekk, sikring av last, kj&oslash;rebok og forsikring.</li>
<li><strong>Alenearbeid</strong>: rutine for innsjekk/utsjekk ved arbeid alene hos kunde (s&aelig;rlig ved h&oslash;ydearbeid og varme arbeider).</li>
<li><strong>Avfallsh&aring;ndtering p&aring; byggeplass</strong>: avfallsplan og sluttrapport iht. byggteknisk forskrift TEK17 kap. 9 mangler. Kildesortering og farlig avfall m&aring; dokumenteres.</li>
<li><strong>Innleie og underleverand&oslash;rer</strong>: rutine for kontroll av at UE har lovp&aring;lagt HMS-dokumentasjon, HMS-kort, ID-kort og yrkesskadeforsikring mangler.</li>
<li><strong>Sykefrav&aelig;rsoppf&oslash;lging</strong>: rutine finnes, men m&aring; utvides med faste oppf&oslash;lgingstidspunkter (4/7/17/26 uker) iht. NAV.</li>
<li><strong>Medarbeidersamtaler</strong>: rutine mangler (viktig n&aring;r dere ansetter flere).</li>
<li><strong>GDPR</strong>: rutine for kundedata, fakturering og bilder fra byggeplass mangler.</li>
<li><strong>Internkontrollh&aring;ndboken b&oslash;r oppdateres &aring;rlig</strong> &ndash; planlegges som fast aktivitet i &aring;rshjulet.</li>
</ol>

<div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:12px 16px;margin:16px 0">
<strong>Konklusjon:</strong> H&aring;ndboken har f&aring;tt p&aring; plass standardrutiner, men kjernekapitlene (lover, oppl&aelig;ring, avvik, m&aring;l, organisasjon, risikoanalyse) er tomme eller utg&aring;tt. For byggmester er <strong>arbeid i h&oslash;yden, HMS-kort, pliktig HMS-kurs for daglig leder, stoffkartotek/diisocyanater og SHA/byggherreforskriften</strong> de viktigste manglene. Systemet i Total-IK er n&aring; aktivert med IK HMS og KS Bygg slik at dette kan bygges opp strukturert.
</div>

<h3 style="color:#0b3d6e">Hva er gjort i systemet</h3>
<ul>
<li>Modulen <strong>IK HMS</strong> er aktivert med bransje byggmester/snekker</li>
<li>Modulen <strong>KS Bygg</strong> er aktivert for prosjekt- og byggesaksoppf&oslash;lging</li>
<li>Antall ansatte registrert (1)</li>
<li>Maler for rutiner, sjekklister, SJA, stoffkartotek, SHA-plan og risikoanalyse er tilgjengelige</li>
</ul>

<h3 style="color:#0b3d6e">Neste steg</h3>
<ol>
<li>Logg inn p&aring; <a href="https://totalik.no">totalik.no</a> og fullf&oslash;r oppsettsveiviseren</li>
<li>Signer egenerkl&aelig;ring og verneombudsavtale digitalt</li>
<li>Oppdater handlingsplanen med 2026-frister</li>
<li>Bygg opp stoffkartotek med sikkerhetsdatablad for alle kjemikalier</li>
<li>Bestill <strong>pliktig HMS-kurs for daglig leder</strong> og <strong>diisocyanat-oppl&aelig;ring</strong> hos oss</li>
<li>S&oslash;rg for gyldig HMS-kort byggebransjen for alle p&aring; byggeplass</li>
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
      to: ["byggmesterhc@gmail.com"],
      cc: ["martin@athenahms.no"],
      bcc: ["ben@athenahms.no"],
      reply_to: "martin@athenahms.no",
      subject: "Revisjonsrapport HMS – Byggmester H. Clausen AS",
      html,
    }),
  });
  const body = await r.text();
  return new Response(body, { status: r.status, headers: { "Content-Type": "application/json" } });
});
