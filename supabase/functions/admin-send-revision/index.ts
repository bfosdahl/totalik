import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:720px;margin:auto;padding:24px">
<h2 style="color:#0b3d6e;margin:0 0 4px">Revisjonsrapport HMS &ndash; Erlend Fasseland AS</h2>
<p style="margin:0 0 16px;color:#555"><strong>Erlend Fasseland AS</strong> &middot; Org.nr. 929 285 352 &middot; Lakkering / sandbl&aring;sing av b&aring;ter</p>
<p>Hei Erlend,</p>
<p>Vi har gjennomg&aring;tt den innsendte HMS-h&aring;ndboken og satt opp Total-IK med modulen <strong>IK HMS</strong> tilpasset lakkering/overflatebehandling. H&aring;ndboken inneholder firmaopplysninger, en p&aring;begynt risikoanalyse og noen rutiner, men de aller fleste kapitlene mangler signaturer, datoer og konkret innhold. Dette m&aring; bygges opp for &aring; tilfredsstille kravene i internkontrollforskriften og bransjespesifikke krav for overflatebehandling.</p>

<div style="background:#fde8e8;border-left:4px solid #dc2626;padding:12px 16px;margin:16px 0">
<strong>STATUS:</strong> Bedriften er registrert med <strong>1 ansatt</strong> (deg som daglig leder). Avtalen p&aring; s. 6 om &aring; ikke ha verneombud er <em>gyldig</em> s&aring;lenge dere er under 10 ansatte (AML &sect; 6-1), men m&aring; faktisk dateres og signeres. Bransjen deres er en av de mest kjemikalieeksponerte i Norge &ndash; <strong>diisocyanater og sandbl&aring;sest&oslash;v</strong> krever s&aelig;rskilte tiltak.
</div>

<h3 style="color:#0b3d6e">Hovedfunn</h3>
<ol>
<li><strong>Avtale om ikke &aring; ha verneombud</strong> (s. 6) er udatert og usignert. M&aring; signeres av deg. Gyldighet 2 &aring;r.</li>
<li><strong>Egenerkl&aelig;ring</strong> (s. 7) er ikke signert. M&aring; signeres digitalt av daglig leder.</li>
<li><strong>Pliktig HMS-kurs for daglig leder</strong> etter AML &sect; 3-5 (6&ndash;7 timer) &ndash; ingen dokumentasjon. Lovp&aring;lagt for alle som driver virksomhet med ansatte. Tilbys av oss.</li>
<li><strong>Diisocyanat-oppl&aelig;ring (EU 2020/1149)</strong>: <strong>KRITISK</strong> &ndash; fra 24. august 2023 er det forbudt &aring; bruke produkter med diisocyanater (vanlig i 2-komp polyuretanlakk) uten dokumentert oppl&aelig;ring. Du m&aring; ha gjennomf&oslash;rt godkjent diisocyanat-kurs (niv&aring; 1, 2 eller 3 avhengig av eksponering). Dokumentasjon m&aring; foreligge.</li>
<li><strong>Avtaleoversikt</strong> (s. 10) har kun Athena HMS. M&aring; suppleres med: regnskapsf&oslash;rer, forsikring (yrkesskade, ansvar, bygning/innbo), bank, leverand&oslash;rer av maling/lakk/sandbl&aring;semiddel, utleier/eier av lokale, bedriftshelsetjeneste (lovp&aring;lagt for lakkering/sandbl&aring;sing), renhold, brannvernkontroll, el-kontroll, ventilasjons-/filterkontroll, avfallsmottak (farlig avfall), kompressor-/trykkluftservice.</li>
<li><strong>Bedriftshelsetjeneste (BHT)</strong>: <strong>Lovp&aring;lagt</strong> for lakkering og sandbl&aring;sing iht. Forskrift om organisering, ledelse og medvirkning &sect; 13-1. M&aring; v&aelig;re godkjent BHT, avtale m&aring; dokumenteres, og helseunders&oslash;kelse (lungefunksjon, audiometri) skal tilbys.</li>
<li><strong>Lover og forskrifter</strong> (s. 11) er plassholder. M&aring; listes konkret: Arbeidsmilj&oslash;loven, Internkontrollforskriften, Forskrift om utf&oslash;relse av arbeid (s&aelig;rlig kap. 3 kjemikalier og kap. 14 sandbl&aring;sing), Forskrift om tiltaks- og grenseverdier, Arbeidsplassforskriften, Forskrift om h&aring;ndtering av farlig stoff, REACH-forskriften (diisocyanater), Brann- og eksplosjonsvernloven, El-tilsynsloven, Avfallsforskriften (farlig avfall), Forurensningsloven, Produktkontrolloven, GDPR.</li>
<li><strong>Oppl&aelig;ring</strong> (kap. 5) er tom. M&aring; dokumentere: pliktig HMS-kurs daglig leder, diisocyanat-kurs, brannvernoppl&aelig;ring, f&oslash;rstehjelp, sandbl&aring;sersertifikat/oppl&aelig;ring, oppl&aelig;ring i bruk av friskluftsmaske/&aring;ndedrettsvern, stillas-/liftkurs, sertifisert truck/lift hvis aktuelt.</li>
<li><strong>Gjennomgang av system</strong> (kap. 6) er tom. &Aring;rlig revisjon m&aring; planlegges og dokumenteres.</li>
<li><strong>Avviksregister</strong> (kap. 7) er tomt. M&aring; brukes aktivt: kjemikalieskvett, brann/eksplosjonsfare, fall fra stillas/lift, kuttskader, st&oslash;veksponering, defekt verneutstyr, n&aelig;runlykker.</li>
<li><strong>M&aring;lsetting for IK/HMS</strong> mangler m&aring;lbare 2026-m&aring;l (null skader, null kjemikalieeksponering over grenseverdi, 100 % bruk av friskluftsmaske ved lakkering, &aring;rlig lungefunksjonstest).</li>
<li><strong>Organisasjonskart</strong> er ikke fylt ut. M&aring; ha roller (daglig leder, HMS-ansvarlig).</li>
<li><strong>Risikoanalyse</strong>: er p&aring;begynt med generelle kategorier, men mangler konkret skaring (sannsynlighet x konsekvens) og bransjespesifikke farer: <strong>diisocyanat-eksponering, isocyanat-asthma, sandbl&aring;sest&oslash;v (kvarts/silikose), kromat, l&oslash;semidler, brann/eksplosjon ved spr&oslash;ytelakkering, statisk elektrisitet, st&oslash;y &gt;85 dB, vibrasjon fra sandbl&aring;sepistol, fall fra stillas, ergonomi ved tunge l&oslash;ft (b&aring;tdeler).</strong></li>
<li><strong>Handlingsplan</strong> har overskrifter (diisocyanater, ergonomi, arbeidsmilj&oslash;, stillas/lift, arbeid i h&oslash;yden) men selve tiltakene er AI-genererte gjenerelle tekster &ndash; m&aring; konkretiseres med <em>n&aring;r, hvem, hvordan</em> og frister i 2026.</li>
<li><strong>Stoffkartotek</strong> er ikke etablert. <strong>Spesielt kritisk for lakkering/sandbl&aring;sing</strong> &ndash; m&aring; opprettes med sikkerhetsdatablad for ALLE produkter: lakk (1-komp og 2-komp polyuretan), herder (isocyanat), tynner, l&oslash;semidler, sandbl&aring;semiddel, primer, avfetting, rustfjerner, maskeringsmidler. M&aring; v&aelig;re tilgjengelig p&aring; arbeidsstedet.</li>
<li><strong>Kjemikalierisikovurdering</strong>: lovp&aring;lagt egen vurdering for hvert farlig kjemikalie etter Forskrift om utf&oslash;relse av arbeid kap. 3. S&aelig;rskilt vurdering for diisocyanater og l&oslash;semidler.</li>
<li><strong>M&aring;ling av luftkvalitet</strong>: l&oslash;semiddel-eksponering og st&oslash;v skal m&aring;les og sammenlignes med grenseverdier. Anbefales hvert 1-3 &aring;r ved kontinuerlig lakkering.</li>
<li><strong>Personlig verneutstyr (PVU)</strong>: friskluftsmaske ved spr&oslash;ytelakkering (filtermaske er IKKE tilstrekkelig ved isocyanater), &aring;ndedrettsvern med P3-filter ved sandbl&aring;sing, vernebriller, hansker (nitril/butyl, IKKE latex), kjeledress, h&oslash;rselvern, vernesko. Utlevering og oppl&aelig;ring m&aring; dokumenteres.</li>
<li><strong>Ventilasjon / spr&oslash;ytekabinett</strong>: lakkeringsarbeid skal foreg&aring; i godkjent spr&oslash;ytekabinett med tilstrekkelig avtrekk og friskluftstilf&oslash;rsel. Filter og avtrekk skal vedlikeholdes og dokumenteres. M&aring; v&aelig;re Ex-godkjent for brannfarlige l&oslash;semidler.</li>
<li><strong>Brann og eksplosjonsvern</strong>: l&oslash;semidler og maling er brannfarlige. Krav om brannslukker, branntepper, jording av utstyr (statisk elektrisitet), Ex-godkjent elektrisk utstyr i spr&oslash;yterom, &aring;rlig brann&oslash;velse, kontroll av brannslukker. Egen risikoanalyse for brann/eksplosjon iht. forskrift om h&aring;ndtering av farlig stoff.</li>
<li><strong>El-kontroll</strong>: n&aelig;ringsbygg med spr&oslash;ytekabinett/Ex-omr&aring;de skal ha el-kontroll iht. NEK 405-3 minst hvert 5. &aring;r, oftere ved Ex-omr&aring;de.</li>
<li><strong>F&oslash;rstehjelp</strong>: f&oslash;rstehjelpsskrin med &oslash;yenskyllevæske (kritisk ved kjemikaliesprut), &aring;rlig HLR-kurs.</li>
<li><strong>Yrkesskadeforsikring</strong> (lovp&aring;lagt): selskap og polisenummer m&aring; dokumenteres.</li>
<li><strong>Ergonomi</strong>: tunge l&oslash;ft av b&aring;tdeler, vedvarende statisk arbeidstilling ved lakkering, vibrasjon fra sandbl&aring;sepistol &ndash; m&aring; ha konkret rutine med hjelpemidler (l&oslash;fteutstyr, vridningsbord).</li>
<li><strong>Alenearbeid</strong>: viktig rutine &ndash; spr&oslash;ytelakkering med l&oslash;semidler skal IKKE skje alene uten innsjekk/utsjekk og n&oslash;dvarsling, pga. risiko for bevisstl&oslash;shet.</li>
<li><strong>Helseunders&oslash;kelse</strong>: ansatte som arbeider med isocyanater og sandbl&aring;sing har rett/plikt p&aring; helseunders&oslash;kelse (spirometri, audiometri) gjennom BHT. Dokumenter intervaller.</li>
<li><strong>Sykefrav&aelig;rsoppf&oslash;lging</strong>: rutine med faste oppf&oslash;lgingstidspunkter (4/7/17/26 uker) iht. NAV. Lungeplager m&aring; meldes som mulig yrkessykdom.</li>
<li><strong>Avfallsh&aring;ndtering</strong>: malingsrester, l&oslash;semidler, brukte filtre, brukt sandbl&aring;semiddel og kjemikalierester er <strong>farlig avfall</strong> og m&aring; leveres til godkjent mottak med deklarasjon (avfallsdeklarering.no). Dokumenter avtale og leveranser.</li>
<li><strong>Stillas / lift / arbeid i h&oslash;yden</strong> (kap. 11.4-11.5): konkrete rutiner mangler &ndash; m&aring; ha kontroll f&oslash;r bruk, sertifisert oppl&aelig;ring (32-timers stilaskurs / liftkurs G7), fallsikring.</li>
<li><strong>Trykkluftanlegg / kompressor</strong>: skal ha &aring;rlig kontroll. Dokumentasjon m&aring; foreligge.</li>
<li><strong>St&oslash;ymaling</strong>: sandbl&aring;sing gir st&oslash;y godt over 85 dB. M&aring;l og dokumenter, samt rutine for h&oslash;rselvern.</li>
<li><strong>GDPR</strong>: rutine for kundedata, fakturering, bilder av kundebåter.</li>
<li><strong>Forsikring innbo / driftsl&oslash;sere</strong>: kompressor, spr&oslash;yteutstyr og verkt&oslash;y skal v&aelig;re forsikret.</li>
<li><strong>Internkontrollh&aring;ndboken b&oslash;r oppdateres &aring;rlig</strong> &ndash; planlegges som fast aktivitet i &aring;rshjulet.</li>
</ol>

<div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:12px 16px;margin:16px 0">
<strong>Konklusjon:</strong> Den innsendte h&aring;ndboken har et godt rammeverk, men de fleste kjernekapitler (signaturer, lover, oppl&aelig;ring, avvik, m&aring;l, stoffkartotek, kjemikalierisikovurdering) m&aring; bygges opp. For lakkering/sandbl&aring;sing er <strong>diisocyanat-oppl&aelig;ring (EU 2020/1149), stoffkartotek og kjemikalierisikovurdering, friskluftsmaske, spr&oslash;ytekabinett/ventilasjon, bedriftshelsetjeneste, brannvern og diiocyanat- og sandbl&aring;sersertifisering</strong> de viktigste fokusomr&aring;dene. Systemet i Total-IK er n&aring; aktivert med IK HMS slik at dette kan gj&oslash;res strukturert via veiviseren.
</div>

<h3 style="color:#0b3d6e">Hva er gjort i systemet</h3>
<ul>
<li>Modulen <strong>IK HMS</strong> er aktivert med bransjeprofil lakkering/overflatebehandling</li>
<li>Antall ansatte registrert (1)</li>
<li>Maler for rutiner, sjekklister, SJA, stoffkartotek og risikoanalyse er tilgjengelige</li>
</ul>

<h3 style="color:#0b3d6e">Neste steg</h3>
<ol>
<li>Logg inn p&aring; <a href="https://totalik.no">totalik.no</a> og fullf&oslash;r oppsettsveiviseren</li>
<li>Signer egenerkl&aelig;ring og verneombudsavtale digitalt</li>
<li>Bygg opp stoffkartotek med sikkerhetsdatablad for alle lakk-/sandbl&aring;sekjemikalier</li>
<li>Bestill/dokumenter <strong>diisocyanat-kurs (EU 2020/1149)</strong> &ndash; lovp&aring;lagt</li>
<li>Etabler avtale med <strong>godkjent bedriftshelsetjeneste</strong> &ndash; lovp&aring;lagt</li>
<li>Bygg opp kjemikalierisikovurdering og rutine for friskluftsmaske/spr&oslash;ytekabinett</li>
<li>Bestill <strong>pliktig HMS-kurs for daglig leder</strong> hos oss</li>
<li>Avtal &aring;rlig brannvernkontroll, el-kontroll og kontroll av spr&oslash;ytekabinett/kompressor</li>
</ol>

<p>Ta kontakt med meg om du &oslash;nsker hjelp til oppsett, diisocyanat-kurs eller HMS-kurs for daglig leder.</p>
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
      to: ["erlend@tor-fasseland.no"],
      cc: ["martin@athenahms.no"],
      bcc: ["ben@athenahms.no"],
      reply_to: "martin@athenahms.no",
      subject: "Revisjonsrapport HMS – Erlend Fasseland AS",
      html,
    }),
  });
  const body = await r.text();
  return new Response(body, { status: r.status, headers: { "Content-Type": "application/json" } });
});
