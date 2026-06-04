import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:720px;margin:auto;padding:24px">
<h2 style="color:#0b3d6e;margin:0 0 4px">Revisjonsrapport HMS &ndash; Selfors Glass &amp; H&aring;ndverkstjenester AS</h2>
<p style="margin:0 0 16px;color:#555"><strong>Selfors Glass &amp; H&aring;ndverkstjenester AS</strong> &middot; Org.nr. 831 132 612 &middot; Kroksundveien 973, 1970 Hemnes</p>
<p>Hei Audun,</p>
<p>Vi har gjennomg&aring;tt den innsendte HMS-h&aring;ndboken og satt opp Total-IK med <strong>IK HMS</strong> tilpasset glass/blikkenslager/h&aring;ndverk. H&aring;ndboken er en standardmal som <strong>i hovedsak ikke er fylt ut</strong>, og en rekke vesentlige punkter m&aring; p&aring; plass for &aring; tilfredsstille kravene i internkontrollforskriften.</p>

<div style="background:#fde8e8;border-left:4px solid #dc2626;padding:12px 16px;margin:16px 0">
<strong>STATUS:</strong> Bedriften er registrert med <strong>1 ansatt</strong> (deg selv som daglig leder). Avtalen p&aring; s. 6 om &aring; ikke ha verneombud er <em>gyldig</em> s&aring;lenge dere er under 10 ansatte (AML &sect; 6-1), men m&aring; faktisk dateres og signeres. Skulle dere ansette flere, m&aring; verneombud velges og 40-timers verneombudskurs tas.
</div>

<h3 style="color:#0b3d6e">Hovedfunn</h3>
<ol>
<li><strong>Avtale om ikke &aring; ha verneombud</strong> er udatert og usignert. M&aring; signeres av deg som daglig leder. Gyldighet 2 &aring;r.</li>
<li><strong>Egenerkl&aelig;ring</strong> er ikke signert. M&aring; signeres digitalt av daglig leder Audun Selfors.</li>
<li><strong>Pliktig HMS-kurs for daglig leder</strong> etter AML &sect; 3-5 (6&ndash;7 timer) &ndash; ingen dokumentasjon. Lovp&aring;lagt for alle som driver virksomhet med ansatte. Tilbys av oss.</li>
<li><strong>Avtaleoversikt</strong> inneholder kun Athena HMS. M&aring; suppleres med: regnskapsf&oslash;rer, forsikring (yrkesskade, ansvar, verkt&oslash;y/maskin, bil), bank, leverand&oslash;rer av glass og blikk, stillas-/lifteleverand&oslash;r, avfallsh&aring;ndtering (glass og metall), el-kontroll og brannvernkontroll.</li>
<li><strong>Lover og forskrifter</strong> er kun plassholder. M&aring; listes konkret: Arbeidsmilj&oslash;loven, Internkontrollforskriften, Byggherreforskriften, Forskrift om utf&oslash;relse av arbeid (kap. 17 arbeid i h&oslash;yden, kap. 3 kjemikalier, kap. 30 diisocyanater), Stillasforskriften, Arbeidsplassforskriften, Plan- og bygningsloven/SAK10, El-tilsynsloven og Brann- og eksplosjonsvernloven.</li>
<li><strong>Oppl&aelig;ring</strong> er tom. M&aring; dokumentere: pliktig HMS-kurs for daglig leder, fagbrev/sertifikat glassh&aring;ndverker/blikkenslager, dokumentert oppl&aelig;ring stillas (under/over 5 m), personl&oslash;fter/lift, fallsikring, varme arbeider, oppl&aelig;ring diisocyanater (lovp&aring;lagt fra 24.08.2023 ved bruk av PUR-skum, lim, fugemasse) og f&oslash;rstehjelp.</li>
<li><strong>Bruk av diisocyanater</strong> (s. 20): EU-krav til <strong>obligatorisk oppl&aelig;ring</strong> for alle som bruker produkter med &gt; 0,1 % diisocyanater (PUR-skum, lim, fugemasse, maling). Sertifikat m&aring; fornyes hvert 5. &aring;r. Helt sentralt for glass/h&aring;ndverk &ndash; m&aring; p&aring; plass.</li>
<li><strong>Gjennomgang av system</strong> &ndash; &aring;rlig revisjon m&aring; planlegges og dokumenteres. Total-IK setter dette opp i &aring;rshjul.</li>
<li><strong>Avviksregister</strong> er tomt. M&aring; brukes aktivt for: skader/n&aelig;runlykker, glassbrudd, fall, kuttskader, kjemikalies&oslash;l, kundeklager, mangler p&aring; stillas/verkt&oslash;y, brann.</li>
<li><strong>M&aring;lsetting for IK/HMS</strong> mangler konkrete m&aring;l. M&aring; oppdateres med m&aring;lbare 2026-m&aring;l (null skader, 100 % bruk av fallsikring, 100 % diisocyanat-sertifisering).</li>
<li><strong>Risikoanalyse</strong> er kun overskrift. M&aring; utf&oslash;res grundig med: arbeid i h&oslash;yden (vinduspuss/montasje), stillas/stigebruk, fall fra tak, kutt- og knuseskader p&aring; glass, l&oslash;ft av tunge glassruter (ergonomi/skuldre/rygg), bruk av sugekopp/glassmonter, diisocyanater (PUR), st&oslash;v og st&oslash;y (vinkelsliper), varme arbeider, elektrisk h&aring;ndverkt&oslash;y, bilkj&oslash;ring til oppdrag, alenearbeid.</li>
<li><strong>Handlingsplan</strong> er kun overskrifter. M&aring; fylles ut med tiltak, ansvarlig og frist for hver identifisert risiko.</li>
<li><strong>Stoffkartotek</strong> er ikke etablert. M&aring; opprettes med oppdaterte sikkerhetsdatablad for alt av silikon, fugemasse, PUR-skum, lim, rengj&oslash;ringsmidler, white-spirit, sprayfarger m.m. Lovp&aring;lagt etter forskrift om utf&oslash;relse av arbeid kap. 3.</li>
<li><strong>Kjemisk risikovurdering</strong> (substitusjonsvurdering): m&aring; gj&oslash;res for alle helsefarlige kjemikalier &ndash; vurder mindre skadelige alternativer.</li>
<li><strong>Belastningsskader</strong> (s. 20): tunge glassruter krever sugekopp, l&oslash;ftehjelpemidler og rutine for to-mannsl&oslash;ft. M&aring; konkretiseres.</li>
<li><strong>Personlig verneutstyr</strong> (PVU): rutine for utdeling, oppl&aelig;ring og kontroll av hansker (kuttbestandige), vernebriller, h&oslash;reselsvern, st&oslash;vmaske/halvmaske med filter, fallsikring, hjelm og vernesko. Lovp&aring;lagt iht. forskrift om organisering kap. 15.</li>
<li><strong>Stillas og fallsikring</strong>: dokumentert oppl&aelig;ring (2/8/36 timer avhengig av h&oslash;yde), kontroll f&oslash;r bruk, montasjeplan, fallsele med sertifikat og &aring;rlig kontroll mangler.</li>
<li><strong>Arbeid i h&oslash;yden</strong>: rutine for risikovurdering f&oslash;r hvert oppdrag, valg av riktig utstyr (stige/stillas/lift), forbud mot stige som arbeidsplattform over 5 m.</li>
<li><strong>Varme arbeider</strong>: sertifikat for varme arbeider (FG-sertifikat) er krav fra forsikringsselskap ved sveising/l&oslash;dding/skj&aelig;ring. M&aring; dokumenteres.</li>
<li><strong>Brann og beredskap</strong>: brannslukker i bil og verksted, r&oslash;ykvarsler, evakueringsplan og &aring;rlig brann&oslash;velse mangler.</li>
<li><strong>F&oslash;rstehjelp</strong>: f&oslash;rstehjelpsskrin i bil og verksted, oppl&aelig;ring og &aring;rlig kontroll mangler. Spesielt viktig pga. kuttskader p&aring; glass.</li>
<li><strong>Elektrisk kontroll</strong>: &aring;rlig egenkontroll og periodisk kontroll av verksted og elektrisk h&aring;ndverkt&oslash;y mangler.</li>
<li><strong>Yrkesskadeforsikring</strong> (lovp&aring;lagt): selskap og polisenummer m&aring; dokumenteres.</li>
<li><strong>Kj&oslash;ret&oslash;y/firmabil</strong>: rutine for daglig sjekk, vedlikehold, sikring av last (glass!), kj&oslash;rebok og forsikring mangler.</li>
<li><strong>Alenearbeid</strong>: rutine for innsjekk/utsjekk ved arbeid alene p&aring; kunde mangler (s&aelig;rlig ved h&oslash;ydearbeid).</li>
<li><strong>St&oslash;y- og vibrasjonsm&aring;ling</strong>: vinkelsliper, drill, sag &ndash; m&aring; vurderes og dokumenteres iht. forskrift om utf&oslash;relse av arbeid kap. 14.</li>
<li><strong>Avfallsh&aring;ndtering</strong>: rutine for knust glass, metallavfall, silikonpatroner, sprayflasker og farlig avfall mangler. Levering til godkjent mottak.</li>
<li><strong>Sykefrav&aelig;rsoppf&oslash;lging</strong> og <strong>medarbeidersamtaler</strong>: rutine mangler (s&aelig;rlig viktig n&aring;r dere ansetter flere).</li>
<li><strong>Innleie og underleverand&oslash;rer</strong>: rutine for kontroll av at innleide har lovp&aring;lagt HMS-dokumentasjon mangler.</li>
<li><strong>GDPR</strong>: rutine for kundedata, fakturering og bilder mangler.</li>
<li><strong>Internkontrollh&aring;ndboken b&oslash;r oppdateres &aring;rlig</strong> &ndash; planlegges som fast aktivitet i &aring;rshjulet.</li>
</ol>

<div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:12px 16px;margin:16px 0">
<strong>Konklusjon:</strong> H&aring;ndboken er en standardmal med kun grunnleggende informasjon utfylt. <strong>Alle vesentlige kapitler er tomme</strong> &ndash; lover, oppl&aelig;ring, avvik, m&aring;l, risikoanalyse, handlingsplan, rutiner og stoffkartotek. For glass/h&aring;ndverk er <strong>arbeid i h&oslash;yden, diisocyanat-oppl&aelig;ring, stoffkartotek og pliktig HMS-kurs for daglig leder</strong> de viktigste manglene. Systemet i Total-IK er n&aring; aktivert med IK HMS for glass/blikkenslager/h&aring;ndverk slik at dette kan bygges opp strukturert.
</div>

<h3 style="color:#0b3d6e">Hva er gjort i systemet</h3>
<ul>
<li>Modulen <strong>IK HMS</strong> er aktivert med bransje glass/blikkenslager/h&aring;ndverk</li>
<li>Antall ansatte registrert (1)</li>
<li>Maler for rutiner, sjekklister, SJA, stoffkartotek og risikoanalyse er tilgjengelige</li>
</ul>

<h3 style="color:#0b3d6e">Neste steg</h3>
<ol>
<li>Logg inn p&aring; <a href="https://totalik.no">totalik.no</a> og fullf&oslash;r oppsettsveiviseren</li>
<li>Signer egenerkl&aelig;ring og verneombudsavtale digitalt</li>
<li>Gjennomf&oslash;r risikoanalyse og lag handlingsplan med 2026-frister</li>
<li>Bygg opp stoffkartotek med sikkerhetsdatablad for alle kjemikalier</li>
<li>Bestill <strong>pliktig HMS-kurs for daglig leder</strong> og <strong>diisocyanat-oppl&aelig;ring</strong> hos oss</li>
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
      to: ["post@selforsglass.no"],
      cc: ["martin@athenahms.no"],
      bcc: ["ben@athenahms.no"],
      reply_to: "martin@athenahms.no",
      subject: "Revisjonsrapport HMS – Selfors Glass & Håndverkstjenester AS",
      html,
    }),
  });
  const body = await r.text();
  return new Response(body, { status: r.status, headers: { "Content-Type": "application/json" } });
});
