import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:720px;margin:auto;padding:24px">
<h2 style="color:#0b3d6e;margin:0 0 4px">Revisjonsrapport HMS &amp; IK MAT &ndash; Lakselv Grill AS</h2>
<p style="margin:0 0 16px;color:#555"><strong>Lakselv Grill AS</strong> &middot; Org.nr. 933 579 689</p>
<p>Hei Mohamad,</p>
<p>Vi har gjennomg&aring;tt den innsendte h&aring;ndboken (47 sider) og satt opp Total-IK med modulene <strong>IK HMS</strong> og <strong>IK MAT</strong> tilpasset restaurant/grill/kebab/pizza. H&aring;ndboken har en god struktur med b&aring;de HMS-rutiner og IK MAT-rutiner (renhold, hygiene, allergener, varemottak, tining/nedkj&oslash;ling, tilberedning av kebab p&aring; grillspyd), men flere kjernekapitler er fortsatt tomme eller har 2025-frister som m&aring; oppdateres.</p>

<div style="background:#fde8e8;border-left:4px solid #dc2626;padding:12px 16px;margin:16px 0">
<strong>STATUS:</strong> Bedriften er registrert med <strong>2 ansatte</strong> (Mohamad Rabih Mahmoud Jaqmara som daglig leder/styreleder og Izet som servicemedarbeider/kj&oslash;kkenassistent). Avtalen p&aring; s. 7 om &aring; ikke ha verneombud er <em>gyldig</em> s&aring;lenge dere er under 10 ansatte (AML &sect; 6-1), men m&aring; faktisk dateres og signeres av begge. Skulle dere ansette flere, m&aring; verneombud velges og 40-timers verneombudskurs tas.
</div>

<h3 style="color:#0b3d6e">Hovedfunn &ndash; HMS</h3>
<ol>
<li><strong>Avtale om ikke &aring; ha verneombud</strong> (s. 7) er udatert og usignert. M&aring; signeres av Mohamad og Izet. Gyldighet 2 &aring;r.</li>
<li><strong>Egenerkl&aelig;ring</strong> (s. 8) er ikke signert. M&aring; signeres digitalt av daglig leder Mohamad Rabih Mahmoud Jaqmara.</li>
<li><strong>Fakta om bedriften</strong> (s. 9): organisasjonsnummer, adresse, postnr/sted, hjemmeside, antall ansatte (heltid/deltid) m&aring; fylles inn.</li>
<li><strong>Pliktig HMS-kurs for daglig leder</strong> etter AML &sect; 3-5 (6&ndash;7 timer) &ndash; ingen dokumentasjon. Lovp&aring;lagt for alle som driver virksomhet med ansatte. Tilbys av oss.</li>
<li><strong>Avtaleoversikt</strong> (s. 11) er tom. M&aring; suppleres med: regnskapsf&oslash;rer, forsikring (yrkesskade, ansvar, innbo/inventar), bank, mat- og drikkeleverand&oslash;rer, kj&oslash;tt-/sj&oslash;matleverand&oslash;rer, kjemikalie-/rengj&oslash;ringsleverand&oslash;rer, utleier av lokale, renhold, brannvernkontroll, el-kontroll, ventilasjons-/avtrekkservice, fettutskillerservice, sk&aring;dedyrkontroll, avfallsmottak, kassasystem.</li>
<li><strong>Lover og forskrifter</strong> (s. 12) er kun plassholder. M&aring; listes konkret: Arbeidsmilj&oslash;loven, Internkontrollforskriften, Matloven, IK-mat-forskriften, Hygieneforskriften, Forskrift om allergener, Forskrift om utf&oslash;relse av arbeid, Brann- og eksplosjonsvernloven, El-tilsynsloven, Avfallsforskriften, Alkoholloven (hvis aktuelt), GDPR.</li>
<li><strong>Oppl&aelig;ring</strong> (kap. 5) er tom. M&aring; dokumentere: pliktig HMS-kurs for daglig leder, brannvernoppl&aelig;ring, f&oslash;rstehjelp, oppl&aelig;ring i sikker bruk av grill/frityr/pizzaovn/kniv, h&aring;ndtering av varme overflater og varm olje.</li>
<li><strong>Gjennomgang av system</strong> (kap. 6) er tom. &Aring;rlig revisjon m&aring; planlegges og dokumenteres &ndash; settes opp i &aring;rshjul i Total-IK.</li>
<li><strong>Avviksregister</strong> (kap. 7) er tomt. M&aring; brukes aktivt for: brannskader, kuttskader, fall, kundeklager, temperaturavvik, hygienesvikt, n&aelig;runlykker.</li>
<li><strong>M&aring;lsetting for IK/HMS</strong> har 2025-overskrift &ndash; m&aring; oppdateres til 2026 med m&aring;lbare m&aring;l (null skader, 100 % bruk av PVU, &lt;3 % sykefrav&aelig;r, 0 brannhendelser).</li>
<li><strong>Risikoanalyse HMS</strong> (kap. 10) er tom tabell. M&aring; fylles ut med konkrete farer: brann (grill, frityr, pizzaovn, fettbrann), brannskader fra varm olje/overflater, kutt fra kniv/kj&oslash;ttkvern, fall p&aring; v&aring;te gulv, l&oslash;ft, ergonomi (st&aring;ende arbeid), kjemikaliebruk (rengj&oslash;ring), st&oslash;y, kundekonflikt, rans-/trusselsituasjoner, alenearbeid p&aring; kveld.</li>
<li><strong>Handlingsplan HMS</strong> (kap. 11) har 2025-frister og m&aring; oppdateres til 2026 med konkrete ansvarlige og dokumentert gjennomf&oslash;ring.</li>
<li><strong>Stoffkartotek</strong> er ikke etablert. M&aring; opprettes med oppdaterte sikkerhetsdatablad for: oppvaskmiddel, avfetting (grill/frityr), avkalkning, gulvvask, desinfeksjon, h&aring;ndsprit, ovnsrens. Lovp&aring;lagt etter forskrift om utf&oslash;relse av arbeid kap. 3.</li>
<li><strong>Brann og beredskap</strong>: <strong>brannteppe ved frityr/grill</strong>, ABC-pulver, CO&sub2; ved el-utstyr, r&oslash;ykvarsler/automatisk slukkeanlegg over grill (Ansul), evakueringsplan, &aring;rlig brann&oslash;velse, kontroll av brannslukker m&aring; dokumenteres. Fettavtrekk m&aring; rengj&oslash;res regelmessig (brannfare).</li>
<li><strong>El-kontroll</strong>: n&aelig;ringsbygg skal ha el-kontroll iht. NEK 405-3 minst hvert 5. &aring;r. M&aring; avtales og dokumenteres.</li>
<li><strong>F&oslash;rstehjelp</strong>: f&oslash;rstehjelpsskrin med brannskadebehandling (Burnshield), &oslash;yeskyll, &aring;rlig HLR-kurs &ndash; m&aring; dokumenteres.</li>
<li><strong>Yrkesskadeforsikring</strong> (lovp&aring;lagt): selskap og polisenummer m&aring; dokumenteres.</li>
<li><strong>Ergonomi og inneklima</strong>: varmebelastning ved grill/ovn, ventilasjon/avtrekk &ndash; m&aring; vurderes.</li>
<li><strong>Sykefrav&aelig;rsoppf&oslash;lging</strong>: rutine med faste oppf&oslash;lgingstidspunkter (4/7/17/26 uker) iht. NAV.</li>
<li><strong>Rans-/trusselforebygging</strong>: rutine ved kontanth&aring;ndtering og alenearbeid p&aring; kveld.</li>
<li><strong>GDPR</strong>: rutine for kundedata, kameraovervaking, ansattdata.</li>
</ol>

<h3 style="color:#0b3d6e">Hovedfunn &ndash; IK MAT</h3>
<ol>
<li><strong>M&aring;lsetting IK/MAT 2025</strong> &ndash; oppdater til 2026.</li>
<li><strong>Organisasjonskart IK/MAT</strong> er p&aring; plass (Mohamad som styreleder/daglig leder, Izet som servicemedarbeider) &ndash; bra. M&aring; suppleres med rollen <strong>matansvarlig/HACCP-ansvarlig</strong>.</li>
<li><strong>Risikoanalyse IK/MAT</strong> (kap. 15) m&aring; utvides med fareanalyse for hele prosessen fra varemottak til servering (varemottak, lagring, tining, tilberedning, varmebehandling, nedkj&oslash;ling, servering).</li>
<li><strong>Handlingsplan IK/MAT</strong> dekker temperatur i kj&oslash;lere/frysere/oppvaskmaskin og renhold &ndash; bra start. M&aring; utvides med kebab-grillspyd (kjernetemperatur 75&deg;C), pizzadeig-h&aring;ndtering, kj&oslash;tt/kylling, allergener, sk&aring;dedyrkontroll.</li>
<li><strong>HACCP/grunnforutsetninger</strong>: rutinen finnes (2.5) men kritiske styringspunkter (CCP) m&aring; konkretiseres med m&aring;leverdier og frekvens.</li>
<li><strong>Daglige temperaturlogger</strong> mangler systematikk: kj&oslash;l (&lt;4&deg;C), frys (&minus;18&deg;C), varmh&oslash;ld (&gt;60&deg;C), kjernetemperatur kj&oslash;tt/kylling/kebab (&ge;75&deg;C), oppvaskmaskin (skyll &ge;82&deg;C). M&aring; loggf&oslash;res daglig.</li>
<li><strong>Allergenh&aring;ndtering</strong>: rutinen (2.12) er p&aring; plass, men <strong>allergenmatrise</strong> for hver rett p&aring; menyen (14 allergener iht. matinformasjonsforordningen) m&aring; utarbeides og v&aelig;re tilgjengelig for personalet og kunder.</li>
<li><strong>Kebab p&aring; grillspyd</strong> (rutine 3.1): god start. M&aring; suppleres med tidsbegrensning for hvor lenge ferdig kebab kan st&aring; p&aring; spydet f&oslash;r kassasjon, og maks oppvarmingstid for restebiter.</li>
<li><strong>Sk&aring;dedyrkontroll</strong>: avtale med profesjonell sk&aring;dedyrbek&aelig;mper (Anticimex/Rentokil/Pelias) og dokumentert kontroll mangler.</li>
<li><strong>Fettutskiller</strong>: avtale om regelmessig t&oslash;mming og kontroll m&aring; dokumenteres.</li>
<li><strong>Sporbarhet</strong>: rutine for &aring; spore alle r&aring;varer ett ledd tilbake og ett ledd frem (matloven) mangler.</li>
<li><strong>Renholdsplan</strong>: rutinen (1.2) er p&aring; plass, men detaljert renholdsplan med frekvens (daglig/ukentlig/m&aring;nedlig) per omr&aring;de (grill, frityr, pizzaovn, kj&oslash;l, gulv, ventilasjon) og signeringsfelt m&aring; utarbeides.</li>
<li><strong>Personlig hygiene</strong>: rutinen (1.1) er p&aring; plass, men dokumentert oppl&aelig;ring i h&aring;ndvask, arbeidstøy, h&aring;rnett og sykdomsmelding (48-timersregelen) mangler.</li>
<li><strong>Mattilsynet</strong>: forberedelse til tilsyn &ndash; alle rutiner og logger m&aring; v&aelig;re tilgjengelige p&aring; norsk og oppdaterte.</li>
</ol>

<div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:12px 16px;margin:16px 0">
<strong>Konklusjon:</strong> H&aring;ndboken har en god ramme med b&aring;de HMS- og IK MAT-rutiner, men mange tabeller er tomme, 2025-frister m&aring; oppdateres, og kritiske elementer som <strong>daglige temperaturlogger, allergenmatrise, stoffkartotek, sk&aring;dedyrkontroll, brannvern over grill/frityr, og pliktig HMS-kurs for daglig leder</strong> m&aring; p&aring; plass f&oslash;r systemet er Mattilsyns- og Arbeidstilsynsklart. Systemet i Total-IK er n&aring; aktivert med b&aring;de IK HMS og IK MAT slik at dette kan bygges opp strukturert via veiviseren.
</div>

<h3 style="color:#0b3d6e">Hva er gjort i systemet</h3>
<ul>
<li>Modulen <strong>IK HMS</strong> er aktivert med bransje restaurant/grill</li>
<li>Modulen <strong>IK MAT</strong> er aktivert med bransje restaurant/grill/kebab/pizza</li>
<li>Antall ansatte registrert (2)</li>
<li>Maler for rutiner, sjekklister, SJA, stoffkartotek, risikoanalyse, HACCP, temperaturlogger og allergenmatrise er tilgjengelige</li>
</ul>

<h3 style="color:#0b3d6e">Neste steg</h3>
<ol>
<li>Logg inn p&aring; <a href="https://totalik.no">totalik.no</a> og fullf&oslash;r oppsettsveiviseren</li>
<li>Fyll inn fakta om bedriften, signer egenerkl&aelig;ring og verneombudsavtale digitalt</li>
<li>Oppdater handlingsplan/m&aring;lsetting til 2026</li>
<li>Bygg opp stoffkartotek med sikkerhetsdatablad for alle rengj&oslash;ringsmidler</li>
<li>Etabler daglige temperaturlogger og allergenmatrise i IK MAT</li>
<li>Bestill <strong>pliktig HMS-kurs for daglig leder</strong> hos oss</li>
<li>Avtal &aring;rlig brannvernkontroll, el-kontroll, ventilasjons-/avtrekkservice, fettutskillert&oslash;mming og sk&aring;dedyrkontroll</li>
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
      to: ["mahmood1382010@gmail.com"],
      cc: ["martin@athenahms.no"],
      bcc: ["ben@athenahms.no"],
      reply_to: "martin@athenahms.no",
      subject: "Revisjonsrapport HMS & IK MAT – Lakselv Grill AS",
      html,
    }),
  });
  const body = await r.text();
  return new Response(body, { status: r.status, headers: { "Content-Type": "application/json" } });
});
