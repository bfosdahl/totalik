import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:720px;margin:auto;padding:24px">
<h2 style="color:#0b3d6e;margin:0 0 4px">Revisjonsrapport HMS &ndash; Wrap-Lab AS</h2>
<p style="margin:0 0 16px;color:#555"><strong>Wrap-Lab AS</strong> &middot; Org.nr. 933 569 454</p>
<p>Hei Konrad,</p>
<p>Vi har gjennomg&aring;tt den innsendte HMS-h&aring;ndboken og satt opp Total-IK med <strong>IK HMS</strong> tilpasset bilfoliering/wrapping. H&aring;ndboken har f&aring;tt en grei struktur p&aring; handlingsplandelen (rengj&oslash;ringsmidler, skarpe verkt&oslash;y, tungt arbeid, tungt utstyr, l&oslash;semidler), men kjernekapitlene er fortsatt tomme eller mangler dokumentasjon for &aring; tilfredsstille kravene i internkontrollforskriften.</p>

<div style="background:#fde8e8;border-left:4px solid #dc2626;padding:12px 16px;margin:16px 0">
<strong>STATUS:</strong> Bedriften er registrert med <strong>1 ansatt</strong> (deg selv som daglig leder). Avtalen p&aring; s. 7 om &aring; ikke ha verneombud er <em>gyldig</em> s&aring;lenge dere er under 10 ansatte (AML &sect; 6-1), men m&aring; faktisk dateres og signeres. Skulle dere ansette flere foliemontører, m&aring; verneombud velges og 40-timers verneombudskurs tas.
</div>

<h3 style="color:#0b3d6e">Hovedfunn</h3>
<ol>
<li><strong>Avtale om ikke &aring; ha verneombud</strong> (s. 7) er udatert og usignert. M&aring; signeres av deg som daglig leder. Gyldighet 2 &aring;r.</li>
<li><strong>Egenerkl&aelig;ring</strong> (s. 8) er ikke signert. M&aring; signeres digitalt av daglig leder Konrad Nowak.</li>
<li><strong>Fakta om bedriften</strong> (s. 9): adresse, hjemmeside, antall ansatte (heltid/deltid) m&aring; fylles inn.</li>
<li><strong>Forretningsid&eacute;</strong> (s. 9) mangler tekst.</li>
<li><strong>Pliktig HMS-kurs for daglig leder</strong> etter AML &sect; 3-5 (6&ndash;7 timer) &ndash; ingen dokumentasjon. Lovp&aring;lagt for alle som driver virksomhet med ansatte. Tilbys av oss.</li>
<li><strong>Avtaleoversikt</strong> (s. 11) er tom. M&aring; suppleres med: regnskapsf&oslash;rer, forsikring (yrkesskade, ansvar, innbo/verkt&oslash;y, bil), bank, leverand&oslash;rer av folie (3M, Avery, Hexis, KPMF, Oracal), PPF-leverand&oslash;rer, kjemikalie-/rensemiddelleverand&oslash;rer, utleier av lokale, renhold, brannvernkontroll, el-kontroll, ventilasjons-service, avfallsmottak.</li>
<li><strong>Lover og forskrifter</strong> (s. 12) er kun plassholder. M&aring; listes konkret: Arbeidsmilj&oslash;loven, Internkontrollforskriften, Forskrift om utf&oslash;relse av arbeid (kap. 3 kjemikalier, kap. 14 st&oslash;y, kap. 23 arbeid med kjemikalier), Arbeidsplassforskriften, Forskrift om kjemikaliedeklarasjon, Brann- og eksplosjonsvernloven, El-tilsynsloven, Avfallsforskriften, Produktkontrolloven, Kj&oslash;psloven, Forbrukerkj&oslash;psloven, GDPR.</li>
<li><strong>Oppl&aelig;ring</strong> (kap. 5) er tom. M&aring; dokumentere: pliktig HMS-kurs for daglig leder, oppl&aelig;ring i bruk av l&oslash;semidler/IPA/rensemidler, sikker bruk av varmluftspistol og strømkniv, h&aring;ndtering av skarpe verkt&oslash;y, l&oslash;fteteknikk (panel/d&oslash;rer), bruk av personl&oslash;fter/stige hvis aktuelt, brannvernoppl&aelig;ring, f&oslash;rstehjelp.</li>
<li><strong>Gjennomgang av system</strong> (kap. 6) er tom. &Aring;rlig revisjon m&aring; planlegges og dokumenteres &ndash; settes opp i &aring;rshjul i Total-IK.</li>
<li><strong>Avviksregister</strong> (kap. 7) er tomt. M&aring; brukes aktivt for: kuttskader, brannskader fra varmluftspistol, kjemikalies&oslash;l, mistrivsel/eksponering, skader p&aring; kundens bil, kundeklager, reklamasjoner p&aring; folie/montasje, brannhendelser, n&aelig;runlykker.</li>
<li><strong>M&aring;lsetting for IK/HMS</strong> (kap. 8) er kun overskrift. M&aring; oppdateres med m&aring;lbare 2026-m&aring;l (null skader, 100 % bruk av PVU, &lt;3 % sykefrav&aelig;r, 0 brannhendelser).</li>
<li><strong>Organisasjonskart</strong> (kap. 9) m&aring; fylles ut med roller (daglig leder, HMS-ansvarlig, evt. fremtidig verneombud).</li>
<li><strong>Risikoanalyse</strong> (kap. 10) er overflatisk. M&aring; utvides med konkret kartlegging av: l&oslash;semiddeleksponering (IPA, rensemidler, primer), inhalering av damp/spray, brann (varmluftspistol p&aring; folie), kutt fra skalpell/strømkniv, klem-/fallskader ved demontering, ergonomi (st&aring;ende arbeid, krevende stillinger ved foliering av bil), l&oslash;ft av panel/d&oslash;rer/hjul, st&oslash;v ved sliping/forberedelse, st&oslash;y, brann i lokalet, alenearbeid, kundekontakt.</li>
<li><strong>Handlingsplan</strong> (kap. 11): har gode tematiske kapitler (rengj&oslash;ringsmidler, skarpe verkt&oslash;y, tungt arbeid, tungt utstyr, l&oslash;semidler), men frister er 31.12.2025 og m&aring; oppdateres til 2026 med konkrete ansvarlige og dokumentert gjennomf&oslash;ring.</li>
<li><strong>Stoffkartotek</strong> er ikke etablert. M&aring; opprettes med oppdaterte sikkerhetsdatablad for: <strong>isopropanol (IPA)</strong>, glassrens, primer/lim-aktivator, silikonfjerner, rensev&aelig;ske for folie, l&oslash;semiddelbasert rens, h&aring;ndsprit, evt. white-spirit. Lovp&aring;lagt etter forskrift om utf&oslash;relse av arbeid kap. 3.</li>
<li><strong>Kjemisk risikovurdering</strong> og substitusjonsvurdering m&aring; gj&oslash;res for alle helsefarlige kjemikalier &ndash; spesielt IPA og l&oslash;semidler.</li>
<li><strong>Ventilasjon</strong>: tilstrekkelig avtrekk/ventilasjon ved foliering og bruk av l&oslash;semidler m&aring; dokumenteres. &Aring;rlig kontroll av ventilasjonsanlegg.</li>
<li><strong>Personlig verneutstyr (PVU)</strong>: nitril-/kjemikaliebestandige hansker, &oslash;yevern, &aring;ndedrettsvern (organisk damp ved spr&oslash;yting), arbeidstøy, vernesko, h&oslash;reselsvern ved st&oslash;y &ndash; utlevering, oppl&aelig;ring og &aring;rlig kontroll m&aring; dokumenteres.</li>
<li><strong>Skarpe verkt&oslash;y</strong>: rutine for trygg bruk og oppbevaring av skalpell/folieknivblader, sikker avhending av brukte blader (gult skarpsavfall-spann).</li>
<li><strong>Varmluftspistol</strong>: brannfare ved foliering. Rutine for trygg bruk, plassering og oppbevaring (avkj&oslash;ling f&oslash;r lagring), kontroll av strømledning.</li>
<li><strong>Brann og beredskap</strong>: brannslukker (CO&sub2; ved siden av elektrisk utstyr + ABC-pulver), r&oslash;ykvarsler, evakueringsplan, &aring;rlig brann&oslash;velse, kontroll av brannslukker m&aring; dokumenteres.</li>
<li><strong>El-kontroll</strong>: n&aelig;ringsbygg skal ha el-kontroll iht. NEK 405-3 minst hvert 5. &aring;r. M&aring; avtales og dokumenteres.</li>
<li><strong>F&oslash;rstehjelp</strong>: f&oslash;rstehjelpsskrin med brannskadebehandling, &oslash;yeskyll i n&aelig;rheten av l&oslash;semiddelarbeid, &aring;rlig HLR-kurs &ndash; m&aring; dokumenteres.</li>
<li><strong>St&oslash;y- og vibrasjonsm&aring;ling</strong>: ved bruk av varmluftspistol, kompressor, slipemaskin &ndash; m&aring; vurderes iht. forskrift om utf&oslash;relse av arbeid kap. 14.</li>
<li><strong>Yrkesskadeforsikring</strong> (lovp&aring;lagt): selskap og polisenummer m&aring; dokumenteres.</li>
<li><strong>Ergonomi</strong>: bilfoliering inneb&aelig;rer mye st&aring;ende arbeid, krevende kroppsstillinger og fingerbelastning. Rutine for pauser, variasjon og ergonomisk tilrettelegging m&aring; p&aring; plass.</li>
<li><strong>Avfallsh&aring;ndtering</strong>: brukt folie (avskj&aelig;r), tomme kjemikaliebeholdere, klut med l&oslash;semiddelrester (selvantenningsfare &ndash; metallspann med lokk) &ndash; rutine for kildesortering og levering til godkjent mottak mangler.</li>
<li><strong>Alenearbeid</strong>: rutine for innsjekk/utsjekk ved alenearbeid p&aring; kveld/helg (spesielt ved bruk av l&oslash;semidler/varmluftspistol).</li>
<li><strong>Forsikring/garanti p&aring; kundens bil</strong>: rutine for fotodokumentasjon f&oslash;r/etter, skadeh&aring;ndtering, garantiansvar p&aring; folie og montasje.</li>
<li><strong>Sykefrav&aelig;rsoppf&oslash;lging</strong>: rutine med faste oppf&oslash;lgingstidspunkter (4/7/17/26 uker) iht. NAV.</li>
<li><strong>Medarbeidersamtaler</strong>: rutine mangler (viktig n&aring;r dere ansetter flere).</li>
<li><strong>GDPR</strong>: rutine for kundedata, registreringsnummer, fotos av kundebiler, fakturering mangler.</li>
<li><strong>Internkontrollh&aring;ndboken b&oslash;r oppdateres &aring;rlig</strong> &ndash; planlegges som fast aktivitet i &aring;rshjulet.</li>
</ol>

<div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:12px 16px;margin:16px 0">
<strong>Konklusjon:</strong> H&aring;ndboken har f&aring;tt en grei tematisk handlingsplan, men kjernekapitlene (lover, oppl&aelig;ring, avvik, m&aring;l, organisasjon, risikoanalyse) er tomme eller utg&aring;tt (2025-frister). For bilfoliering er <strong>l&oslash;semiddeleksponering (IPA), stoffkartotek, varmluftspistol/brannfare, skarpe verkt&oslash;y, ventilasjon og pliktig HMS-kurs for daglig leder</strong> de viktigste manglene. Systemet i Total-IK er n&aring; aktivert med IK HMS for bilfoliering/wrapping slik at dette kan bygges opp strukturert.
</div>

<h3 style="color:#0b3d6e">Hva er gjort i systemet</h3>
<ul>
<li>Modulen <strong>IK HMS</strong> er aktivert med bransje bilfoliering/wrapping</li>
<li>Antall ansatte registrert (1)</li>
<li>Maler for rutiner, sjekklister, SJA, stoffkartotek og risikoanalyse er tilgjengelige</li>
</ul>

<h3 style="color:#0b3d6e">Neste steg</h3>
<ol>
<li>Logg inn p&aring; <a href="https://totalik.no">totalik.no</a> og fullf&oslash;r oppsettsveiviseren</li>
<li>Fyll inn fakta om bedriften, signer egenerkl&aelig;ring og verneombudsavtale digitalt</li>
<li>Oppdater handlingsplanen med 2026-frister</li>
<li>Bygg opp stoffkartotek med sikkerhetsdatablad for IPA, primer, silikonfjerner og andre kjemikalier</li>
<li>Bestill <strong>pliktig HMS-kurs for daglig leder</strong> hos oss</li>
<li>Avtal &aring;rlig brannvernkontroll, el-kontroll og ventilasjonskontroll</li>
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
      to: ["konrad@wrap-lab.no"],
      cc: ["martin@athenahms.no"],
      bcc: ["ben@athenahms.no"],
      reply_to: "martin@athenahms.no",
      subject: "Revisjonsrapport HMS – Wrap-Lab AS",
      html,
    }),
  });
  const body = await r.text();
  return new Response(body, { status: r.status, headers: { "Content-Type": "application/json" } });
});
