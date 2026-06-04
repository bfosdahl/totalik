import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:720px;margin:auto;padding:24px">
<h2 style="color:#0b3d6e;margin:0 0 4px">Revisjonsrapport HMS &ndash; Stavenes Transport AS</h2>
<p style="margin:0 0 16px;color:#555"><strong>Stavenes Transport AS</strong> &middot; Org.nr. 933 414 345 &middot; Vefjell 15, 5957 Myking</p>
<p>Hei Adrian,</p>
<p>Vi har gjennomg&aring;tt den innsendte HMS-h&aring;ndboken og satt opp Total-IK med <strong>IK HMS</strong> tilpasset lastebiltransport. H&aring;ndboken har f&aring;tt p&aring; plass standardrutiner, men en rekke vesentlige punkter er fortsatt tomme eller mangler dokumentasjon for &aring; tilfredsstille kravene i internkontrollforskriften, yrkestransportloven og k&oslash;re-/hviletidsbestemmelsene.</p>

<div style="background:#fde8e8;border-left:4px solid #dc2626;padding:12px 16px;margin:16px 0">
<strong>STATUS:</strong> Bedriften er registrert med <strong>1 ansatt</strong> (deg selv som daglig leder). Avtalen p&aring; s. 6 om &aring; ikke ha verneombud er <em>gyldig</em> s&aring;lenge dere er under 10 ansatte (AML &sect; 6-1), men m&aring; faktisk dateres og signeres. Skulle dere ansette flere sj&aring;f&oslash;rer, m&aring; verneombud velges og 40-timers verneombudskurs tas.
</div>

<h3 style="color:#0b3d6e">Hovedfunn</h3>
<ol>
<li><strong>Avtale om ikke &aring; ha verneombud</strong> (s. 6) er udatert og usignert. M&aring; signeres av deg som daglig leder. Gyldighet 2 &aring;r.</li>
<li><strong>Egenerkl&aelig;ring</strong> (s. 7) er ikke signert. M&aring; signeres digitalt av daglig leder Adrian Christoffer Stavenes Monsen.</li>
<li><strong>Pliktig HMS-kurs for daglig leder</strong> etter AML &sect; 3-5 (6&ndash;7 timer) &ndash; ingen dokumentasjon. Lovp&aring;lagt for alle som driver virksomhet med ansatte. Tilbys av oss.</li>
<li><strong>L&oslash;yve / fellesskapstillatelse for godstransport</strong> (yrkestransportloven): kopi av l&oslash;yve, &oslash;konomisk garanti og transportleders bevis m&aring; ligge i systemet.</li>
<li><strong>Avtaleoversikt</strong> inneholder kun Athena HMS. M&aring; suppleres med: regnskapsf&oslash;rer, forsikring (yrkesskade, bil/lastebil, ansvar, godsansvar/CMR), bank, drivstoffleverand&oslash;r, dekk-/verkstedavtale, bilberging, fartsskriver-/takografverksted, leverand&oslash;r av digital f&oslash;rerkort-nedlasting, ADR-r&aring;dgiver (hvis farlig gods), oppdragsgivere/speditt&oslash;rer.</li>
<li><strong>Lover og forskrifter</strong> (kap. 4) er kun plassholder. M&aring; listes konkret: Arbeidsmilj&oslash;loven, Internkontrollforskriften, <strong>Yrkestransportloven</strong>, <strong>Vegtrafikkloven</strong>, <strong>Forskrift om kj&oslash;re- og hviletid</strong> (561/2006), <strong>Forskrift om bruk av k&oslash;ret&oslash;y</strong>, <strong>Forskrift om sikring av last</strong>, Forskrift om utf&oslash;relse av arbeid, Arbeidsplassforskriften, <strong>ADR-forskriften</strong> (farlig gods), Brann- og eksplosjonsvernloven, Allmenngj&oslash;ringsloven (godstransport p&aring; vei), Avfallsforskriften.</li>
<li><strong>Oppl&aelig;ring</strong> (kap. 5) er tom. M&aring; dokumentere: pliktig HMS-kurs for daglig leder, <strong>YSK / yrkessj&aring;f&oslash;rkompetanse</strong> (35 timer hvert 5. &aring;r), f&oslash;rerkort klasse C/CE med gyldighetsdato, <strong>digitalt f&oslash;rerkort</strong> (takograf), <strong>ADR-bevis</strong> hvis farlig gods, truckf&oslash;rerbevis (T1&ndash;T4) ved lasting/lossing, kranf&oslash;rerbevis (lastebilkran) iht. forskrift om utf&oslash;relse av arbeid kap. 10, lastsikring, f&oslash;rstehjelp.</li>
<li><strong>Gjennomgang av system</strong> (kap. 6) er tom. &Aring;rlig revisjon m&aring; planlegges og dokumenteres &ndash; settes opp i &aring;rshjul i Total-IK.</li>
<li><strong>Avviksregister</strong> (kap. 7) er tomt. M&aring; brukes aktivt for: trafikkuhell/n&aelig;runlykker, brudd p&aring; kj&oslash;re-/hviletid, skader p&aring; gods, l&oslash;st last, tekniske feil p&aring; bil, kontroller fra Statens vegvesen/Arbeidstilsynet, kundeklager.</li>
<li><strong>M&aring;lsetting for IK/HMS</strong> (kap. 8) er kun overskrift. M&aring; oppdateres med m&aring;lbare 2026-m&aring;l (null trafikkuhell, 0 brudd p&aring; kj&oslash;re-/hviletid, 100 % lastsikring, &lt;3 % sykefrav&aelig;r).</li>
<li><strong>Organisasjonskart</strong> (kap. 9) m&aring; fylles ut med roller (daglig leder, transportleder, HMS-ansvarlig).</li>
<li><strong>Risikoanalyse</strong> (kap. 10) er overflatisk. M&aring; utvides med konkret kartlegging av: trafikkulykker, tretthet/lang kj&oslash;ring, glatt f&oslash;re/vinterkj&oslash;ring, lasting og lossing (klem-/fallskader), arbeid i h&oslash;yden p&aring; lasteplan/presenning, l&oslash;ft av tunge kolli (ergonomi/rygg), bruk av lastebilkran/lift, eksos og diesel (kreftfremkallende), st&oslash;y/vibrasjoner fra k&oslash;ret&oslash;y, alenearbeid p&aring; natt, ran/trusler ved verdifullt gods, brann i k&oslash;ret&oslash;y, kjemikalies&oslash;l (drivstoff, AdBlue, hydraulikkolje), psykososialt (tidspress fra oppdragsgiver).</li>
<li><strong>Handlingsplan</strong> (kap. 11): har noen punkter (farlig gods, trafikksikkerhet, mekanisk vedlikehold, ergonomi) med 2025-frister som n&aring; er utg&aring;tt. M&aring; oppdateres med konkrete tiltak, ansvarlig og 2026-frister, og kobles til risikoanalysen.</li>
<li><strong>Kj&oslash;re- og hviletid</strong>: rutine for daglig nedlasting av f&oslash;rerkort (28 dager) og takografdata (90 dager), oppbevaring i 1 &aring;r, og oppf&oslash;lging av brudd mangler. Lovp&aring;lagt.</li>
<li><strong>Periodisk kj&oslash;ret&oslash;ykontroll (EU-kontroll) og tilstandskontroll</strong>: rutine for fristoppf&oslash;lging mangler. Lastebil over 7,5 t skal ha EU-kontroll &aring;rlig.</li>
<li><strong>Daglig sjekk av k&oslash;ret&oslash;y</strong> (sjekkliste f&oslash;r tur): lys, bremser, dekk, speil, lastsikringsutstyr, brannslukker, f&oslash;rstehjelpsskrin, varseltrekant, refleksvest &ndash; rutine og dokumentasjon mangler.</li>
<li><strong>Lastsikring</strong>: rutine iht. Forskrift om sikring av last, dokumentert oppl&aelig;ring, kontroll av stropper/kjettinger/nett mangler.</li>
<li><strong>Stoffkartotek</strong> er ikke etablert. M&aring; opprettes med oppdaterte sikkerhetsdatablad for diesel, AdBlue, hydraulikkolje, motorolje, frostv&aelig;ske, sm&oslash;remidler, rensemidler m.m. Lovp&aring;lagt etter forskrift om utf&oslash;relse av arbeid kap. 3.</li>
<li><strong>Kjemisk risikovurdering</strong> og substitusjonsvurdering m&aring; gj&oslash;res for alle helsefarlige kjemikalier, herunder dieseleksos (kreftfremkallende).</li>
<li><strong>ADR-farlig gods</strong>: hvis transport av farlig gods, m&aring; ADR-bevis, ADR-utstyrspakke (verneutstyr, &oslash;yeskyll, absorbsjonsmiddel), skriftlige instrukser i bilen og evt. sikkerhetsr&aring;dgiver dokumenteres. Hvis dere ikke kj&oslash;rer ADR, m&aring; dette dokumenteres som unntak.</li>
<li><strong>Personlig verneutstyr</strong> (PVU): vernesko, refleksvest (lovp&aring;lagt utenfor bilen p&aring; veg), hjelm ved lasting/lossing, hansker, h&oslash;reselsvern, &oslash;yevern &ndash; utlevering og oppl&aelig;ring m&aring; dokumenteres.</li>
<li><strong>Arbeid i h&oslash;yden p&aring; lasteplan/presenning</strong>: stor fallrisiko. Krever risikovurdering, fallsikring eller plattform.</li>
<li><strong>Brann og beredskap</strong>: brannslukker (6 kg ABC) i bil, rutine ved brann i motor/last, evakueringsplan p&aring; verksted/kontor m&aring; dokumenteres.</li>
<li><strong>F&oslash;rstehjelp</strong>: f&oslash;rstehjelpsskrin i bil, HLR-oppl&aelig;ring, &aring;rlig kontroll mangler.</li>
<li><strong>St&oslash;y og helkroppsvibrasjoner</strong>: lastebilf&oslash;rer er utsatt for vibrasjoner over tid &ndash; m&aring; vurderes iht. forskrift om utf&oslash;relse av arbeid kap. 14.</li>
<li><strong>Eksos / dieselpartikler</strong>: klassifisert som kreftfremkallende av IARC. Rutine for &aring; unng&aring; tomgangskj&oslash;ring innend&oslash;rs og bruk av eksosavsug p&aring; verksted m&aring; p&aring; plass.</li>
<li><strong>Alenearbeid og lange turer</strong>: rutine for innsjekk/utsjekk, kommunikasjon med arbeidsgiver, h&aring;ndtering av tretthet og s&oslash;vn mangler.</li>
<li><strong>Ran og trusler</strong>: rutine for sikker oppbevaring av kontanter/verdifullt gods, GPS-sporing, panikknapp.</li>
<li><strong>Yrkesskadeforsikring</strong> (lovp&aring;lagt): selskap og polisenummer m&aring; dokumenteres.</li>
<li><strong>Rusmiddel- og medikamentpolicy</strong>: ekstra viktig for sj&aring;f&oslash;rer. Rutine for nulltoleranse, testing og oppf&oslash;lging mangler.</li>
<li><strong>Avfallsh&aring;ndtering</strong>: spillolje, oljefilter, batterier, dekk &ndash; rutine for levering til godkjent mottak mangler.</li>
<li><strong>Sykefrav&aelig;rsoppf&oslash;lging</strong>: rutine finnes, men m&aring; utvides med faste oppf&oslash;lgingstidspunkter (4/7/17/26 uker) iht. NAV.</li>
<li><strong>Medarbeidersamtaler</strong>: rutine mangler (viktig n&aring;r dere ansetter flere sj&aring;f&oslash;rer).</li>
<li><strong>GDPR</strong>: rutine for h&aring;ndtering av f&oslash;rerkortdata, GPS-data, kundedata og fakturering mangler.</li>
<li><strong>Internkontrollh&aring;ndboken b&oslash;r oppdateres &aring;rlig</strong> &ndash; planlegges som fast aktivitet i &aring;rshjulet.</li>
</ol>

<div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:12px 16px;margin:16px 0">
<strong>Konklusjon:</strong> H&aring;ndboken har f&aring;tt p&aring; plass strukturen, men kjernekapitlene (lover, oppl&aelig;ring, avvik, m&aring;l, organisasjon, risikoanalyse) er tomme eller utg&aring;tt. For lastebiltransport er <strong>kj&oslash;re-/hviletid, YSK, lastsikring, pliktig HMS-kurs for daglig leder, daglig k&oslash;ret&oslash;ysjekk, ADR-status og stoffkartotek</strong> de viktigste manglene. Systemet i Total-IK er n&aring; aktivert med IK HMS for transport slik at dette kan bygges opp strukturert.
</div>

<h3 style="color:#0b3d6e">Hva er gjort i systemet</h3>
<ul>
<li>Modulen <strong>IK HMS</strong> er aktivert med bransje lastebiltransport</li>
<li>Antall ansatte registrert (1)</li>
<li>Maler for rutiner, sjekklister, SJA, stoffkartotek og risikoanalyse er tilgjengelige</li>
</ul>

<h3 style="color:#0b3d6e">Neste steg</h3>
<ol>
<li>Logg inn p&aring; <a href="https://totalik.no">totalik.no</a> og fullf&oslash;r oppsettsveiviseren</li>
<li>Signer egenerkl&aelig;ring og verneombudsavtale digitalt</li>
<li>Oppdater handlingsplanen med 2026-frister</li>
<li>Bygg opp stoffkartotek med sikkerhetsdatablad for drivstoff, oljer og kjemikalier</li>
<li>Bestill <strong>pliktig HMS-kurs for daglig leder</strong> hos oss, og sjekk at <strong>YSK</strong> er gyldig</li>
<li>Innf&oslash;r daglig sjekkliste for k&oslash;ret&oslash;y og rutine for nedlasting av takograf/f&oslash;rerkort</li>
<li>Avklar ADR-status og dokumenter</li>
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
      to: ["adrian@stavenes-transport.no"],
      cc: ["martin@athenahms.no"],
      bcc: ["ben@athenahms.no"],
      reply_to: "martin@athenahms.no",
      subject: "Revisjonsrapport HMS – Stavenes Transport AS",
      html,
    }),
  });
  const body = await r.text();
  return new Response(body, { status: r.status, headers: { "Content-Type": "application/json" } });
});
