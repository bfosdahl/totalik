import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:720px;margin:auto;padding:24px">
<h2 style="color:#0b3d6e;margin:0 0 4px">Revisjonsrapport HMS &ndash; Emt Drift AS</h2>
<p style="margin:0 0 16px;color:#555"><strong>Emt Drift AS</strong> &middot; Org.nr. 931 164 937 &middot; Frisør / skj&oslash;nnhetspleie</p>
<p>Hei Elise,</p>
<p>Vi har gjennomg&aring;tt den innsendte HMS-h&aring;ndboken og satt opp Total-IK med modulen <strong>IK HMS</strong> tilpasset frisør/skj&oslash;nnhetsbransjen. H&aring;ndboken er foreløpig en tom mal &ndash; kun firmaopplysninger, organisasjonsnummer, adresse og navnene p&aring; dere to ansatte er fylt inn. Alt &oslash;vrig innhold m&aring; bygges opp for &aring; tilfredsstille kravene i internkontrollforskriften og kravene som gjelder spesifikt for frisørbransjen.</p>

<div style="background:#fde8e8;border-left:4px solid #dc2626;padding:12px 16px;margin:16px 0">
<strong>STATUS:</strong> Bedriften er registrert med <strong>2 ansatte</strong> (Elise Margrethe Trondsen, daglig leder, og Line-Aleksandra Dalsveen). Avtalen p&aring; s. 6 om &aring; ikke ha verneombud er <em>gyldig</em> s&aring;lenge dere er under 10 ansatte (AML &sect; 6-1), men m&aring; faktisk dateres og signeres av begge. Skulle dere bli flere, m&aring; verneombud velges og 40-timers verneombudskurs tas.
</div>

<h3 style="color:#0b3d6e">Hovedfunn</h3>
<ol>
<li><strong>Avtale om ikke &aring; ha verneombud</strong> (s. 6) er udatert og usignert. M&aring; signeres av deg som daglig leder og Line-Aleksandra. Gyldighet 2 &aring;r.</li>
<li><strong>Egenerkl&aelig;ring</strong> (s. 7) er ikke signert. M&aring; signeres digitalt av daglig leder Elise Margrethe Trondsen og representant for de ansatte.</li>
<li><strong>Pliktig HMS-kurs for daglig leder</strong> etter AML &sect; 3-5 (6&ndash;7 timer) &ndash; ingen dokumentasjon. Lovp&aring;lagt for alle som driver virksomhet med ansatte. Tilbys av oss.</li>
<li><strong>Avtaleoversikt</strong> (s. 10) er nesten tom. M&aring; suppleres med: regnskapsf&oslash;rer, forsikring (yrkesskade, ansvar, innbo/utstyr), bank, leverand&oslash;rer av frisørprodukter (farger, sjampo, h&aring;rpleie), utleier av lokale, renhold, brannvernkontroll, el-kontroll, avfallsmottak (s&aelig;rlig for kjemikalierester), kassesystem.</li>
<li><strong>Lover og forskrifter</strong> (s. 11) er kun plassholder. M&aring; listes konkret: Arbeidsmilj&oslash;loven, Internkontrollforskriften, Forskrift om utf&oslash;relse av arbeid (s&aelig;rlig kap. om kjemikalier og v&aring;tt arbeid), Arbeidsplassforskriften, Forskrift om h&aring;ndtering av farlig stoff, Brann- og eksplosjonsvernloven, El-tilsynsloven, Avfallsforskriften, Produktkontrolloven, Kosmetikkforskriften, Folkehelseloven, GDPR.</li>
<li><strong>Oppl&aelig;ring</strong> (kap. 5) er tom. M&aring; dokumentere: pliktig HMS-kurs for daglig leder, brannvernoppl&aelig;ring, f&oslash;rstehjelp, oppl&aelig;ring i sikker bruk av frisørkjemikalier (farger, blekemiddel, permanentvæske), oppl&aelig;ring i hygiene og desinfeksjon, oppl&aelig;ring i v&aring;tt arbeid og hudvern.</li>
<li><strong>Gjennomgang av system</strong> (kap. 6) er tom. &Aring;rlig revisjon m&aring; planlegges og dokumenteres &ndash; settes opp i &aring;rshjul i Total-IK.</li>
<li><strong>Avviksregister</strong> (kap. 7) er tomt. M&aring; brukes aktivt for: allergiske reaksjoner hos kunder, hudplager hos ansatte (eksem, kontaktallergi), kjemikalieskvett, kuttskader fra sakser/kniver, brannfarlige situasjoner, kundeklager.</li>
<li><strong>M&aring;lsetting for IK/HMS</strong> mangler. M&aring; oppdateres med m&aring;lbare 2026-m&aring;l (null hudplager, 100 % bruk av hansker ved fargebehandling, &lt;3 % sykefrav&aelig;r, null reklamasjoner p&aring; hygiene).</li>
<li><strong>Organisasjonskart</strong> er kun delvis utfylt. M&aring; fylles ut med roller (daglig leder, ansatt, HMS-ansvarlig).</li>
<li><strong>Risikoanalyse</strong> mangler konkret innhold. M&aring; kartlegge frisørspesifikke farer: kjemikalieeksponering (farger, blekemiddel, ammoniakk, persulfater), v&aring;tt arbeid, h&aring;ndeksem, ergonomi (st&aring;ende arbeid, repetitive bevegelser i skuldre/h&aring;ndledd), kuttskader, smitte, brann (h&aring;rspray/aerosoler), kundekontakt, alenearbeid, st&oslash;v fra h&aring;rfargepulver.</li>
<li><strong>Handlingsplan</strong> har overskrifter, men mangler konkrete tiltak. M&aring; settes opp med tiltak, frister og ansvarlige for hver risiko.</li>
<li><strong>Stoffkartotek</strong> er ikke etablert. <strong>Spesielt kritisk for frisør</strong> &ndash; m&aring; opprettes med sikkerhetsdatablad for ALLE produkter: h&aring;rfarger, blekemiddel, permanentvæske, sjampo, balsam, stylingprodukter, desinfeksjonsmidler, rengj&oslash;ringsmidler, h&aring;ndsprit. Mange av disse er m&aelig;rket med faresymboler.</li>
<li><strong>Kjemikalierisikovurdering</strong>: l&oslash;vp&aring;lagt egen vurdering for hvert farlig kjemikalie etter Forskrift om utf&oslash;relse av arbeid kap. 3. Total-IK har egen modul for dette.</li>
<li><strong>V&aring;tt arbeid og hudvern</strong>: frisører er en h&oslash;yrisikogruppe for h&aring;ndeksem. Rutine for hanskebruk (nitril, IKKE latex), hudpleie f&oslash;r/etter arbeid, valg av hudvennlige produkter, oppl&aelig;ring i tegn p&aring; begynnende eksem.</li>
<li><strong>Personlig verneutstyr (PVU)</strong>: nitrilhansker, forkle ved fargebehandling, eventuelt vernebriller ved blanding av blekemiddel/oksidant &ndash; utlevering og oppl&aelig;ring m&aring; dokumenteres.</li>
<li><strong>Ventilasjon</strong>: salongen m&aring; ha tilstrekkelig ventilasjon for &aring; fjerne damp fra kjemikalier. Dokumenter type ventilasjon og evt. m&aring;linger.</li>
<li><strong>Brann og beredskap</strong>: brannslukker, r&oslash;ykvarsler, evakueringsplan, &aring;rlig brann&oslash;velse, kontroll av brannslukker m&aring; dokumenteres. Aerosoler (h&aring;rspray) er brannfarlige.</li>
<li><strong>El-kontroll</strong>: n&aelig;ringsbygg skal ha el-kontroll iht. NEK 405-3 minst hvert 5. &aring;r. Mye elektrisk utstyr (f&oslash;naper, krølltenger, plater) gir h&oslash;y belastning.</li>
<li><strong>F&oslash;rstehjelp</strong>: f&oslash;rstehjelpsskrin med &oslash;yenskyllevæske (viktig ved kjemikaliesprut), &aring;rlig HLR-kurs &ndash; m&aring; dokumenteres.</li>
<li><strong>Yrkesskadeforsikring</strong> (lovp&aring;lagt): selskap og polisenummer m&aring; dokumenteres.</li>
<li><strong>Ergonomi</strong>: rutine for h&oslash;ydejusterbar stol (allerede nevnt), variasjon mellom st&aring;ende/sittende arbeid, paustrening for skuldre/n&aelig;kke, jevne pauser.</li>
<li><strong>Sykefrav&aelig;rsoppf&oslash;lging</strong>: rutine med faste oppf&oslash;lgingstidspunkter (4/7/17/26 uker) iht. NAV. Hudplager m&aring; meldes som mulig yrkessykdom.</li>
<li><strong>Hygiene og desinfeksjon</strong> (rutine 3.2 i h&aring;ndboken): m&aring; konkretiseres &ndash; hvilke midler, hvor ofte, dokumentasjon av rengj&oslash;ring av sakser, kammer, b&oslash;rster, vasker.</li>
<li><strong>Avfallsh&aring;ndtering</strong>: kjemikalierester (farger, blekemiddel) er farlig avfall og m&aring; leveres til godkjent mottak. Dokumenter avtale og leveranser.</li>
<li><strong>Konflikth&aring;ndtering / psykososialt</strong> (kap. 4.1): rutine m&aring; konkretiseres &ndash; medarbeidersamtaler, &aring;pen dialog, varslingsrutine.</li>
<li><strong>Alenearbeid</strong>: rutine hvis &eacute;n av dere jobber alene &ndash; innsjekk/utsjekk, n&oslash;dnummer tilgjengelig.</li>
<li><strong>Kundeskjema / allergitest</strong>: rutine for patch-test/allergivarsel f&oslash;r fargebehandling for &aring; unng&aring; reaksjoner og reklamasjoner.</li>
<li><strong>GDPR</strong>: rutine for kundedata, kundekartotek, bookingsystem, fakturering.</li>
<li><strong>Internkontrollh&aring;ndboken b&oslash;r oppdateres &aring;rlig</strong> &ndash; planlegges som fast aktivitet i &aring;rshjulet.</li>
</ol>

<div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:12px 16px;margin:16px 0">
<strong>Konklusjon:</strong> Den innsendte h&aring;ndboken er en tom mal med kun firmaopplysninger og medarbeidernavn. Alle kjernekapitler (lover, oppl&aelig;ring, avvik, m&aring;l, risikoanalyse, handlingsplan, stoffkartotek) m&aring; bygges opp. For frisørbransjen er <strong>stoffkartotek/kjemikalierisikovurdering, v&aring;tt arbeid/hudvern, ventilasjon, hygiene/desinfeksjon og pliktig HMS-kurs for daglig leder</strong> de viktigste fokusomr&aring;dene. Systemet i Total-IK er n&aring; aktivert med IK HMS slik at dette kan gj&oslash;res strukturert via veiviseren.
</div>

<h3 style="color:#0b3d6e">Hva er gjort i systemet</h3>
<ul>
<li>Modulen <strong>IK HMS</strong> er aktivert med bransjeprofil frisør/skj&oslash;nnhetspleie</li>
<li>Antall ansatte registrert (2)</li>
<li>Maler for rutiner, sjekklister, SJA, stoffkartotek og risikoanalyse er tilgjengelige</li>
</ul>

<h3 style="color:#0b3d6e">Neste steg</h3>
<ol>
<li>Logg inn p&aring; <a href="https://totalik.no">totalik.no</a> og fullf&oslash;r oppsettsveiviseren</li>
<li>Signer egenerkl&aelig;ring og verneombudsavtale digitalt</li>
<li>Bygg opp stoffkartotek med sikkerhetsdatablad for alle frisørprodukter og kjemikalier</li>
<li>Etabler kjemikalierisikovurdering og rutine for v&aring;tt arbeid/hudvern</li>
<li>Bygg opp risikoanalyse og handlingsplan med 2026-frister</li>
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
      to: ["elise_margrethe@hotmail.com"],
      cc: ["martin@athenahms.no"],
      bcc: ["ben@athenahms.no"],
      reply_to: "martin@athenahms.no",
      subject: "Revisjonsrapport HMS – Emt Drift AS",
      html,
    }),
  });
  const body = await r.text();
  return new Response(body, { status: r.status, headers: { "Content-Type": "application/json" } });
});
