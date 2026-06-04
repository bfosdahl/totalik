import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:720px;margin:auto;padding:24px">
<h2 style="color:#0b3d6e;margin:0 0 4px">Revisjonsrapport HMS &ndash; Termoxpress AS</h2>
<p style="margin:0 0 16px;color:#555"><strong>Termoxpress AS</strong> &middot; Org.nr. 998 355 583 &middot; Prestebr&aring;tan 29, 3300 Hokksund</p>
<p>Hei Atle,</p>
<p>Vi har gjennomg&aring;tt den innsendte HMS-h&aring;ndboken for Termoxpress AS og satt opp Total-IK med <strong>IK HMS</strong> tilpasset transportbransjen (godstransport p&aring; vei, kj&oslash;l og frys). H&aring;ndboken har en god grunnstruktur, men en rekke kritiske mangler m&aring; lukkes for &aring; tilfredsstille kravene i internkontrollforskriften.</p>

<div style="background:#fde8e8;border-left:4px solid #dc2626;padding:12px 16px;margin:16px 0">
<strong>KRITISK:</strong> Bedriften har <strong>31 ansatte</strong> (iht. Br&oslash;nn&oslash;ysund), men h&aring;ndboken (s. 6) inneholder en avtale om &aring; <em>ikke ha verneombud</em>. Slik avtale er kun gyldig ved <strong>under 10 ansatte</strong> (AML &sect; 6-1). Avtalen er ugyldig og m&aring; fjernes. Anette Bj&oslash;rge Andersen er allerede oppf&oslash;rt som verneombud &ndash; valget m&aring; formaliseres med valgprotokoll og hun m&aring; gjennomf&oslash;re 40-timers verneombudskurs. Med 31 ansatte b&oslash;r dere ogs&aring; vurdere arbeidsmilj&oslash;utvalg (AMU er p&aring;lagt fra 50 ansatte, men anbefales).
</div>

<h3 style="color:#0b3d6e">Hovedfunn</h3>
<ol>
<li><strong>Ugyldig verneombudsavtale</strong> (s. 6) &ndash; m&aring; slettes. Anette Bj&oslash;rge Andersen formaliseres som verneombud med valgprotokoll og 40-timers kurs (AML &sect; 6-5).</li>
<li><strong>Egenerkl&aelig;ring</strong> (s. 7) er ikke signert. M&aring; signeres digitalt av daglig leder Atle Wie Marthinsen og representant for de ansatte (verneombud).</li>
<li><strong>Pliktig HMS-kurs for daglig leder</strong> Atle Wie Marthinsen etter AML &sect; 3-5 (6&ndash;7 timer) &ndash; ingen dokumentasjon. Tilbys av oss.</li>
<li><strong>40-timers verneombudskurs</strong> for Anette Bj&oslash;rge Andersen mangler &ndash; lovp&aring;lagt etter AML &sect; 6-5.</li>
<li><strong>Lover og forskrifter</strong> (s. 11) er kun plassholder. M&aring; listes konkret: AML, IK-forskriften, yrkestransportloven, kj&oslash;re- og hviletidsforskriften, ADR-forskriften (ved farlig gods), forskrift om bruk av arbeidsutstyr, forskrift om utf&oslash;relse av arbeid, forurensningsloven, avfallsforskriften, kj&oslash;let&oslash;y-/temperaturreguleringsregler.</li>
<li><strong>Avtaleoversikt</strong> (s. 10) er svak &ndash; kun bedriftshelsetjeneste (Athena HMS) og n&oslash;dnummer. M&aring; suppleres med regnskap, forsikring, yrkesskadeforsikring, kj&oslash;ret&oslash;yforsikring, leasing, dekkleverand&oslash;r, verksted, drivstoff, fartsskriverleverand&oslash;r, vaskeavtale, k&oslash;leservice.</li>
<li><strong>Oppl&aelig;ring</strong> (s. 12) og <strong>system-gjennomgang</strong> (s. 13) er tomme overskrifter uten dokumentert innhold eller frekvens.</li>
<li><strong>Avviksregister</strong> (s. 14) er tomt &ndash; m&aring; brukes aktivt for n&aelig;rulykker, materiellskader, kj&oslash;ret&oslash;yskader og temperaturavvik i kj&oslash;l/frys.</li>
<li><strong>M&aring;lsetting for IK/HMS</strong> (s. 15) er fra 2023 og generell. M&aring; oppdateres med konkrete, m&aring;lbare m&aring;l for 2026 (sykefrav&aelig;r, n&aelig;rulykker, kj&oslash;ret&oslash;yskader).</li>
<li><strong>Organisasjonskart</strong> (s. 16) viser kun driftsleder, daglig leder og verneombud. M&aring; suppleres med HMS-ansvarlig, brannvernleder, f&oslash;rstehjelpsansvarlig, ADR-ansvarlig, flatestruktur over alle 31 ansatte.</li>
<li><strong>Risikoanalyse IK/HMS</strong> (s. 17) er svak og kun fokusert p&aring; sekketralle/jekketralle/l&oslash;ftelem/brann. M&aring; utvides med: trafikkulykker, l&oslash;fteskader, h&aring;nd-arm-vibrasjoner fra ratt/jekketralle, st&oslash;y i lasterom, kj&oslash;l/frys-eksponering (kuldeskader), tunge l&oslash;ft, ergonomi i f&oslash;rerhus, l&oslash;semidler fra rengj&oslash;ring, ran/vold, alenearbeid p&aring; natt, tretthet/s&oslash;vnmangel, kj&oslash;ring under p&aring;virkning av medisin.</li>
<li><strong>Handlingsplan</strong> (s. 18) har frister fra <strong>august 2019</strong> &ndash; ikke oppdatert p&aring; 6 &aring;r. M&aring; revideres med nye tiltak, ansvarlige og frister.</li>
<li><strong>Kj&oslash;re- og hviletid</strong> (kap. 1.5): rutine finnes, men mangler dokumentasjon p&aring; rutinemessig nedlasting og kontroll av fartsskriverdata (skal lagres i 1 &aring;r), oppl&aelig;ring av sj&aring;f&oslash;rkort, og rutine for korreksjon av brudd.</li>
<li><strong>Last som kan lekke, ryke eller virvles bort</strong> (kap. 1.4): nevnt, men mangler konkret rutine for sikring av last, presenningskontroll og rutine ved skadet emballasje.</li>
<li><strong>Brann og beredskap</strong> (kap. 2): bare overskrifter. M&aring; ha rutine for brannslukker i hver bil (&aring;rlig kontroll), brann i kj&oslash;ret&oslash;y, evakueringsplan p&aring; terminal/lager, brannvernleder.</li>
<li><strong>F&oslash;rstehjelpsutstyr</strong> (kap. 2.2): mangler oversikt over f&oslash;rstehjelpsskrin i hver bil og p&aring; terminal, kontrollrutine og oppl&aelig;ring.</li>
<li><strong>Ulykker og skader</strong> (kap. 2.3): mangler rutine for varsling av Arbeidstilsynet og NAV ved alvorlig personskade, samt politi/forsikring ved trafikkulykker.</li>
<li><strong>Anskaffelse av maskiner og utstyr</strong> (kap. 3.1): CE-dokumentasjon, sakkyndig kontroll og bruksanvisninger for jekketraller, sekketraller, palleliftere og l&oslash;ftelemmer mangler. L&oslash;ftelem skal ha &aring;rlig sakkyndig kontroll.</li>
<li><strong>F&oslash;rerkort og yrkessjåf&oslash;rbevis (YSK)</strong>: m&aring; dokumenteres for alle sj&aring;f&oslash;rer med utl&oslash;psdato (35 timer hvert 5. &aring;r).</li>
<li><strong>ADR-bevis</strong>: ved transport av farlig gods (drivstoff, batterier mv.) m&aring; ADR-bevis dokumenteres.</li>
<li><strong>Digitalt sj&aring;f&oslash;rkort</strong>: gyldighet for alle sj&aring;f&oslash;rer m&aring; legges inn med utl&oslash;psdato.</li>
<li><strong>Kj&oslash;ret&oslash;yliste og EU-kontroll</strong>: oversikt over alle biler, registreringsnummer, neste EU-kontroll og periodisk kontroll mangler.</li>
<li><strong>Temperaturkontroll kj&oslash;l/frys</strong>: kritisk for matvaretransport. Mangler logg over temperatur i lasterom, kalibrering av sensorer, rutine ved temperaturavvik.</li>
<li><strong>Stoffkartotek</strong>: mangler sikkerhetsdatablad for diesel, AdBlue, motorolje, frostv&aelig;ske, vindusspylerv&aelig;ske, rengj&oslash;ringsmidler for kj&oslash;lebil, desinfeksjonsmidler.</li>
<li><strong>St&oslash;y- og vibrasjonsm&aring;ling</strong>: ingen vurdering av st&oslash;y i f&oslash;rerhus, kj&oslash;leaggregat, og h&aring;nd-arm-vibrasjoner.</li>
<li><strong>Ergonomi i f&oslash;rerhus og l&oslash;ftearbeid</strong>: ingen vurdering eller oppl&aelig;ring i riktig l&oslash;fteteknikk.</li>
<li><strong>Personlig verneutstyr</strong>: refleksvest (lovp&aring;lagt), vernesko, hansker, k&oslash;leklær for kj&oslash;l/frys, h&oslash;rselsvern p&aring; terminal &ndash; oversikt og utdeling mangler.</li>
<li><strong>Rusmiddelpolitikk og AKAN</strong>: lovp&aring;lagt fokus i transport (0-promillegrense). Mangler skriftlig politikk og oppl&aelig;ring.</li>
<li><strong>Tretthet og fatigue management</strong>: rutine for h&aring;ndtering av tretthet, alenearbeid p&aring; natt og rapportering ved sykdom mangler.</li>
<li><strong>Yrkesskadeforsikring og kj&oslash;ret&oslash;yforsikring</strong>: selskap og polisenummer m&aring; dokumenteres.</li>
<li><strong>Vernerunder</strong>: rutine for vernerunde p&aring; terminal og i bil (minimum &aring;rlig) mangler.</li>
<li><strong>Sykefrav&aelig;rsoppf&oslash;lging</strong>: rutine for IA-oppf&oslash;lging, dialogm&oslash;ter og tilrettelegging mangler.</li>
<li><strong>Medarbeidersamtaler</strong>: rutine og frekvens (minimum &aring;rlig) mangler.</li>
<li><strong>Avfallsh&aring;ndtering</strong>: rutine for spillolje, batterier, dekk, emballasje fra kj&oslash;legods mangler.</li>
<li><strong>Personvern/GDPR</strong>: behandling av sj&aring;f&oslash;rkortdata, GPS-data og fartsskriverdata m&aring; ha databehandleravtale og personvernerkl&aelig;ring.</li>
</ol>

<div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:12px 16px;margin:16px 0">
<strong>Konklusjon:</strong> H&aring;ndboken har en grei oppbygging, men er ikke oppdatert siden 2019 og inneholder en <strong>ugyldig avtale om &aring; ikke ha verneombud</strong> (bedriften har 31 ansatte, ikke under 10). De mest kritiske manglene er: ugyldig verneombudsordning, manglende HMS-kurs for daglig leder, manglende 40-timers kurs for verneombud, utdatert handlingsplan, manglende dokumentasjon p&aring; sj&aring;f&oslash;rbevis/YSK/ADR, manglende kj&oslash;ret&oslash;yoversikt og manglende stoffkartotek. Systemet i Total-IK er n&aring; aktivert med IK HMS for transportbransjen slik at dette kan settes opp strukturert.
</div>

<h3 style="color:#0b3d6e">Hva er gjort i systemet</h3>
<ul>
<li>Modulen <strong>IK HMS</strong> er aktivert med bransje transport/godstransport</li>
<li>Antall ansatte registrert (31)</li>
<li>Maler for rutiner, sjekklister, SJA og risikoanalyse er tilgjengelige</li>
</ul>

<h3 style="color:#0b3d6e">Neste steg</h3>
<ol>
<li>Logg inn p&aring; <a href="https://totalik.no">totalik.no</a> og fullf&oslash;r oppsettsveiviseren</li>
<li><strong>Fjern den ugyldige verneombudsavtalen</strong> og formaliser Anette som verneombud</li>
<li>Signer egenerkl&aelig;ring digitalt</li>
<li>Legg inn alle 31 ansatte med stilling, f&oslash;rerkortkategori og YSK-/ADR-utl&oslash;p</li>
<li>Opprett kj&oslash;ret&oslash;yoversikt med EU-kontroll og fartsskriverservice</li>
<li>Oppdater risikoanalyse og handlingsplan med 2026-frister</li>
<li>Registrer kjemikalier (diesel, AdBlue, oljer, vaskemidler) i stoffkartoteket</li>
<li>Last opp HMS-kurs (Atle), 40-timers kurs (Anette), YSK, ADR og forsikringer</li>
<li>Bestill <strong>pliktig HMS-kurs for daglig leder</strong> og <strong>40-timers verneombudskurs</strong> hos oss</li>
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
      to: ["post@termoxpress.no"],
      cc: ["gard@athenahms.no"],
      bcc: ["ben@athenahms.no"],
      reply_to: "gard@athenahms.no",
      subject: "Revisjonsrapport HMS – Termoxpress AS",
      html,
    }),
  });
  const body = await r.text();
  return new Response(body, { status: r.status, headers: { "Content-Type": "application/json" } });
});
