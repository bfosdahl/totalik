import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:720px;margin:auto;padding:24px">
<h2 style="color:#0b3d6e;margin:0 0 4px">Revisjonsrapport HMS &ndash; Innbohub AS</h2>
<p style="margin:0 0 16px;color:#555"><strong>Innbohub AS</strong> &middot; Org.nr. 935 617 545</p>
<p>Hei Kristaps,</p>
<p>Vi har gjennomg&aring;tt den innsendte HMS-h&aring;ndboken og satt opp Total-IK med modulen <strong>IK HMS</strong>. H&aring;ndboken er foreløpig en tom mal &ndash; kun firmanavn og navnet ditt er fylt inn. Alt &oslash;vrig innhold m&aring; bygges opp for &aring; tilfredsstille kravene i internkontrollforskriften.</p>

<div style="background:#fde8e8;border-left:4px solid #dc2626;padding:12px 16px;margin:16px 0">
<strong>STATUS:</strong> Bedriften er registrert med <strong>1 ansatt</strong> (deg selv som daglig leder). Avtalen p&aring; s. 6 om &aring; ikke ha verneombud er <em>gyldig</em> s&aring;lenge dere er under 10 ansatte (AML &sect; 6-1), men m&aring; faktisk dateres og signeres. Skulle dere ansette flere, m&aring; verneombud velges og 40-timers verneombudskurs tas.
</div>

<h3 style="color:#0b3d6e">Hovedfunn</h3>
<ol>
<li><strong>Avtale om ikke &aring; ha verneombud</strong> (s. 6) er udatert og usignert. M&aring; signeres av deg som daglig leder. Gyldighet 2 &aring;r.</li>
<li><strong>Egenerkl&aelig;ring</strong> (s. 7) er ikke signert. M&aring; signeres digitalt av daglig leder Kristaps Bitenieks.</li>
<li><strong>Fakta om bedriften</strong> (s. 8): organisasjonsnummer, adresse, postnr/sted, hjemmeside, antall ansatte (heltid/deltid) m&aring; fylles inn.</li>
<li><strong>Forretningsid&eacute;</strong> (s. 8) mangler tekst &ndash; m&aring; beskrive hva bedriften driver med (handel/innbo/m&oslash;bler/bruktsalg eller annet).</li>
<li><strong>Pliktig HMS-kurs for daglig leder</strong> etter AML &sect; 3-5 (6&ndash;7 timer) &ndash; ingen dokumentasjon. Lovp&aring;lagt for alle som driver virksomhet med ansatte. Tilbys av oss.</li>
<li><strong>Avtaleoversikt</strong> (s. 10) er tom. M&aring; suppleres med: regnskapsf&oslash;rer, forsikring (yrkesskade, ansvar, innbo/verkt&oslash;y), bank, leverand&oslash;rer, utleier av lokale/lager, renhold, brannvernkontroll, el-kontroll, avfallsmottak, evt. transport&oslash;r.</li>
<li><strong>Lover og forskrifter</strong> (s. 11) er kun plassholder. M&aring; listes konkret: Arbeidsmilj&oslash;loven, Internkontrollforskriften, Forskrift om utf&oslash;relse av arbeid, Arbeidsplassforskriften, Brann- og eksplosjonsvernloven, El-tilsynsloven, Avfallsforskriften, Produktkontrolloven, Kj&oslash;psloven, Forbrukerkj&oslash;psloven, GDPR.</li>
<li><strong>Oppl&aelig;ring</strong> (kap. 5) er tom. M&aring; dokumentere: pliktig HMS-kurs for daglig leder, brannvernoppl&aelig;ring, f&oslash;rstehjelp, sikker l&oslash;fting/h&aring;ndtering av varer/m&oslash;bler, bruk av eventuelle hjelpemidler (sekketralle, palleløfter, varebil).</li>
<li><strong>Gjennomgang av system</strong> (kap. 6) er tom. &Aring;rlig revisjon m&aring; planlegges og dokumenteres &ndash; settes opp i &aring;rshjul i Total-IK.</li>
<li><strong>Avviksregister</strong> (kap. 7) er tomt. M&aring; brukes aktivt for: skader, l&oslash;fteskader, fall, transportskader, kundeklager, reklamasjoner, n&aelig;runlykker.</li>
<li><strong>M&aring;lsetting for IK/HMS</strong> mangler. M&aring; oppdateres med m&aring;lbare 2026-m&aring;l (null skader, 100 % bruk av PVU, &lt;3 % sykefrav&aelig;r).</li>
<li><strong>Organisasjonskart</strong> m&aring; fylles ut med roller (daglig leder, HMS-ansvarlig).</li>
<li><strong>Risikoanalyse</strong> mangler. M&aring; kartlegge: tunge l&oslash;ft, ergonomi (b&aelig;ring av m&oslash;bler), fall, klemskader, transport/bilkj&oslash;ring, alenearbeid, kundekontakt, brann i lager, st&oslash;v, eventuell bruk av rengj&oslash;ringskjemikalier.</li>
<li><strong>Handlingsplan</strong> mangler &ndash; m&aring; settes opp med konkrete tiltak, frister og ansvarlige.</li>
<li><strong>Stoffkartotek</strong> er ikke etablert. M&aring; opprettes med sikkerhetsdatablad for alle kjemikalier som brukes (rengj&oslash;ringsmidler, m&oslash;belpleie, h&aring;ndsprit).</li>
<li><strong>Personlig verneutstyr (PVU)</strong>: arbeidshansker, vernesko, ryggst&oslash;tte ved tunge l&oslash;ft &ndash; utlevering og oppl&aelig;ring m&aring; dokumenteres.</li>
<li><strong>Brann og beredskap</strong>: brannslukker, r&oslash;ykvarsler, evakueringsplan, &aring;rlig brann&oslash;velse, kontroll av brannslukker m&aring; dokumenteres. Lager med innbo har h&oslash;y brannbelastning.</li>
<li><strong>El-kontroll</strong>: n&aelig;ringsbygg skal ha el-kontroll iht. NEK 405-3 minst hvert 5. &aring;r. M&aring; avtales og dokumenteres.</li>
<li><strong>F&oslash;rstehjelp</strong>: f&oslash;rstehjelpsskrin og &aring;rlig HLR-kurs &ndash; m&aring; dokumenteres.</li>
<li><strong>Yrkesskadeforsikring</strong> (lovp&aring;lagt): selskap og polisenummer m&aring; dokumenteres.</li>
<li><strong>Ergonomi</strong>: handel/innbo inneb&aelig;rer mye tunge l&oslash;ft og b&aelig;ring &ndash; rutine for l&oslash;fteteknikk, bruk av hjelpemidler og to-personers l&oslash;ft m&aring; p&aring; plass.</li>
<li><strong>Bil/transport</strong> (hvis dere kj&oslash;rer varer/m&oslash;bler ut til kunder): sjekkliste for varebil, lastesikring, f&oslash;rerkortklasse (BE for tilhenger), kj&oslash;re- og hviletid hvis aktuelt.</li>
<li><strong>Sykefrav&aelig;rsoppf&oslash;lging</strong>: rutine med faste oppf&oslash;lgingstidspunkter (4/7/17/26 uker) iht. NAV.</li>
<li><strong>Avfallsh&aring;ndtering</strong>: kildesortering (papp, plast, EE-avfall, m&oslash;bler) og levering til godkjent mottak m&aring; dokumenteres.</li>
<li><strong>Alenearbeid</strong>: rutine for innsjekk/utsjekk hvis du jobber alene p&aring; lager/i butikk.</li>
<li><strong>GDPR</strong>: rutine for kundedata, fakturering, evt. kameraovervaking p&aring; lager.</li>
<li><strong>Internkontrollh&aring;ndboken b&oslash;r oppdateres &aring;rlig</strong> &ndash; planlegges som fast aktivitet i &aring;rshjulet.</li>
</ol>

<div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:12px 16px;margin:16px 0">
<strong>Konklusjon:</strong> Den innsendte h&aring;ndboken er en tom mal. Alle kjernekapitler (bedriftsfakta, lover, oppl&aelig;ring, avvik, m&aring;l, organisasjon, risikoanalyse, handlingsplan, stoffkartotek) m&aring; bygges opp. For innbo/handel er <strong>ergonomi/tunge l&oslash;ft, brannvern p&aring; lager, transport/lastesikring og pliktig HMS-kurs for daglig leder</strong> de viktigste fokusomr&aring;dene. Systemet i Total-IK er n&aring; aktivert med IK HMS slik at dette kan gj&oslash;res strukturert via veiviseren.
</div>

<h3 style="color:#0b3d6e">Hva er gjort i systemet</h3>
<ul>
<li>Modulen <strong>IK HMS</strong> er aktivert</li>
<li>Antall ansatte registrert (1)</li>
<li>Maler for rutiner, sjekklister, SJA, stoffkartotek og risikoanalyse er tilgjengelige</li>
</ul>

<h3 style="color:#0b3d6e">Neste steg</h3>
<ol>
<li>Logg inn p&aring; <a href="https://totalik.no">totalik.no</a> og fullf&oslash;r oppsettsveiviseren</li>
<li>Fyll inn fakta om bedriften, signer egenerkl&aelig;ring og verneombudsavtale digitalt</li>
<li>Bygg opp risikoanalyse og handlingsplan med 2026-frister (fokus tunge l&oslash;ft, brann, transport)</li>
<li>Etabler stoffkartotek med sikkerhetsdatablad for rengj&oslash;rings-/pleiemidler</li>
<li>Bestill <strong>pliktig HMS-kurs for daglig leder</strong> hos oss</li>
<li>Avtal &aring;rlig brannvernkontroll og el-kontroll</li>
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
      to: ["innbohub@gmail.com"],
      cc: ["martin@athenahms.no"],
      bcc: ["ben@athenahms.no"],
      reply_to: "martin@athenahms.no",
      subject: "Revisjonsrapport HMS – Innbohub AS",
      html,
    }),
  });
  const body = await r.text();
  return new Response(body, { status: r.status, headers: { "Content-Type": "application/json" } });
});
