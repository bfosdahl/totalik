import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:720px;margin:auto;padding:24px">
<h2 style="color:#0b3d6e;margin:0 0 4px">Revisjonsrapport HMS &amp; KS Bygg</h2>
<p style="margin:0 0 16px;color:#555"><strong>Larsson Bygg Og Maskin AS</strong> &middot; Org.nr. 913 601 939 &middot; Flesberg Sentrum, 3620 Flesberg</p>
<p>Hei Nicklas,</p>
<p>Vi har gjennomg&aring;tt den innsendte HMS-h&aring;ndboken for Larsson Bygg Og Maskin AS og satt opp Total-IK med <strong>IK HMS</strong> og <strong>KS Bygg</strong> for bygg, graving og anlegg. H&aring;ndboken har en grei struktur med b&aring;de IK/HMS- og IK/Bygg-seksjoner, men flere kapitler mangler konkret innhold, oppdaterte frister og signaturer. I tillegg er det noen viktige avvik knyttet til verneombud og pliktig dokumentasjon.</p>

<div style="background:#fee2e2;border-left:4px solid #dc2626;padding:12px 16px;margin:16px 0">
<strong>Kritisk:</strong> Bedriften har <strong>8 ansatte</strong> registrert i Br&oslash;nn&oslash;ysund. Etter endringen i arbeidsmilj&oslash;loven &sect; 6-1 m&aring; alle virksomheter med 5 eller flere ansatte ha valgt verneombud. <strong>Avtalen om &aring; ikke ha verneombudsordning (s. 6) er derfor ikke gyldig</strong> og m&aring; erstattes med valg av verneombud, samt 40-timers HMS-kurs for verneombudet.
</div>

<h3 style="color:#0b3d6e">Hovedfunn</h3>
<ol>
<li><strong>Verneombud mangler</strong> &ndash; m&aring; velges og dokumenteres. Verneombudet skal ha 40-timers HMS-kurs.</li>
<li><strong>Egenerkl&aelig;ring</strong> (s. 7) er ikke signert. M&aring; signeres digitalt av daglig leder Nicklas Larsson og representant for de ansatte.</li>
<li><strong>Pliktig HMS-kurs for daglig leder</strong> Nicklas Larsson etter AML &sect; 3-5 (6&ndash;7 timer) &ndash; ingen dokumentasjon. Tilbys av oss.</li>
<li><strong>Lover og forskrifter</strong> (s. 11) er kun plassholder. M&aring; listes konkret: AML, IK-forskriften, byggherreforskriften, forskrift om utf&oslash;relse av arbeid, plan- og bygningsloven, SAK10, byggekortforskriften, forurensningsloven, st&oslash;yforskriften, kjemikalieforskriften.</li>
<li><strong>Avtaleoversikt</strong> (s. 10) mangler. Skal inneholde regnskap, forsikring, yrkesskadeforsikring, elektriker, brannvern, maskinleverand&oslash;rer, drivstoffleverand&oslash;r m.m.</li>
<li><strong>Oppl&aelig;ring</strong> (s. 12) og <strong>system-gjennomgang</strong> (s. 13) er tomme overskrifter uten dokumentert innhold.</li>
<li><strong>Avviksregister</strong> (s. 14) er tomt. Skal brukes aktivt &ndash; ogs&aring; n&aelig;rulykker og materiellskader.</li>
<li><strong>M&aring;lsetting for IK/HMS</strong> (s. 15) og IK/Bygg (s. 27) mangler konkrete, m&aring;lbare m&aring;l.</li>
<li><strong>Organisasjonskart</strong> (s. 16 og 28) viser arbeidsgiver Nicklas Larsson og utf&oslash;rende Hans Thiesen. Mangler verneombud, HMS-ansvarlig, brannvernleder og f&oslash;rstehjelpsansvarlig.</li>
<li><strong>Risikoanalyse IK/HMS</strong> (s. 17) er kun delvis utfylt. <strong>Risikoanalyse IK/Bygg</strong> (s. 29) er tom.</li>
<li><strong>Handlingsplan</strong> (s. 18&ndash;19) har enkelte tiltak med ansvarlig Nicklas Larsson, men frister er fra <strong>januar 2020</strong> &ndash; ikke fulgt opp eller oppdatert. Handlingsplan IK/Bygg (s. 30) er tom.</li>
<li><strong>Maskinf&oslash;rerbevis</strong> for gravemaskin, hjullaster og dumper &ndash; dokumentasjon mangler (forskrift om utf&oslash;relse av arbeid kap. 10).</li>
<li><strong>ADK-bevis</strong> for arbeid med vann- og avl&oslash;psanlegg &ndash; m&aring; dokumenteres dersom dette utf&oslash;res.</li>
<li><strong>Graving og sikring av gr&oslash;fter</strong> (rutinekap. 3.1) har god tekst, men mangler dokumentasjon p&aring; kabelp&aring;visning (Geomatikk/gravemelding), spunting/avstivning ved gr&oslash;fter dypere enn 2 m og varslingsplan/trafikkdirigent ved arbeid n&aelig;r vei.</li>
<li><strong>Rystelser</strong> (rutinekap. 3.2) er nevnt &ndash; rystelsesm&aring;linger og naboinformasjon m&aring; dokumenteres per prosjekt.</li>
<li><strong>Stoffkartotek</strong> mangler. M&aring; inneholde sikkerhetsdatablad for diesel, hydraulikkolje, smurning, byggskum, lim, fugemasse, impregneringsmidler, l&oslash;semidler, rengj&oslash;ringsmidler m.m.</li>
<li><strong>CE-dokumentasjon og &aring;rlig sakkyndig kontroll</strong> p&aring; gravemaskin, hjullaster, sirkels&aring;g, h&oslash;velbenk og elektriske verkt&oslash;y &ndash; mangler.</li>
<li><strong>Vibrerende verkt&oslash;y og maskiner</strong>: ingen vurdering av h&aring;nd-arm-vibrasjoner og helkroppsvibrasjoner (forskrift om utf&oslash;relse av arbeid kap. 14).</li>
<li><strong>Fallsikring og arbeid i h&oslash;yden</strong> (rutinekap. 6.1) har tekst, men sertifisert fallsikringsutstyr, &aring;rlig kontroll, oppl&aelig;ring og stillaskompetanse m&aring; dokumenteres.</li>
<li><strong>H&oslash;rselsvern og st&oslash;ym&aring;ling</strong>: ingen dokumentasjon p&aring; st&oslash;yeksponering fra gravemaskin, sirkels&aring;g og slagverkt&oslash;y.</li>
<li><strong>St&oslash;v</strong> (tre-/kvartsst&oslash;v): mangler vurdering og rutine for st&oslash;vmaske/avsug.</li>
<li><strong>Vernerunder</strong> (rutinekap. 2.2) er nevnt, men sjekklister og dokumentert gjennomf&oslash;ring p&aring; byggeplass mangler.</li>
<li><strong>Brann og beredskap</strong> (rutinekap. 7) har generelle rutiner, men kontroll av sl&oslash;kkemidler p&aring; byggeplass og varme arbeider-sertifikat mangler.</li>
<li><strong>ID-kort/HMS-kort</strong> (rutinekap. 6.5) er nevnt &ndash; kopi/dokumentasjon p&aring; gyldige kort for alle 8 ansatte m&aring; legges inn.</li>
<li><strong>F&oslash;rstehjelp</strong>: sjekklister for kontroll av f&oslash;rstehjelpsutstyr og dokumentert oppl&aelig;ring mangler.</li>
<li><strong>Yrkesskadeforsikring</strong> (lovp&aring;lagt) &ndash; polise m&aring; dokumenteres.</li>
<li><strong>Milj&oslash;risiko utslipp</strong> (s. 18) og <strong>drivstoff/energiforbruk</strong> (s. 19) er identifisert, men mangler konkrete tiltak: oppsamlingskar, absorbenter, beredskap ved s&oslash;l, rutine for tanking.</li>
<li><strong>Branntetting av gjennomf&oslash;ringer</strong> (rutinekap. 1.2 IK/Bygg) &ndash; mangler dokumentert kompetansebevis og sjekkliste.</li>
<li><strong>Ansvarlig s&oslash;ker/prosjekterende/kontrollerende</strong> (rutinekap. 1.3&ndash;1.6) &ndash; sentrale godkjenninger og lokale godkjenninger m&aring; dokumenteres.</li>
</ol>

<div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:12px 16px;margin:16px 0">
<strong>Konklusjon:</strong> H&aring;ndboken har en grei grunnstruktur med separate IK/HMS- og IK/Bygg-kapitler, men de fleste seksjonene mangler konkret innhold, oppdaterte frister og signaturer. Den st&oslash;rste mangelen er at bedriften med 8 ansatte ikke har valgt verneombud, samt manglende dokumentasjon p&aring; maskinf&oslash;rerbevis, stoffkartotek og CE-dokumentasjon. Systemet i Total-IK er n&aring; aktivert med IK HMS og KS Bygg slik at rutiner, sjekklister og prosjekter kan settes opp.
</div>

<h3 style="color:#0b3d6e">Hva er gjort i systemet</h3>
<ul>
<li>Modulen <strong>IK HMS</strong> er aktivert med bransje bygg/anlegg/graving</li>
<li>Modulen <strong>KS Bygg</strong> er aktivert</li>
<li>Antall ansatte registrert (8)</li>
<li>Maler for rutiner, sjekklister, SJA og risikoanalyse er tilgjengelige</li>
</ul>

<h3 style="color:#0b3d6e">Neste steg</h3>
<ol>
<li>Logg inn p&aring; <a href="https://totalik.no">totalik.no</a> og fullf&oslash;r oppsettsveiviseren</li>
<li>Velg verneombud og meld p&aring; 40-timers HMS-kurs</li>
<li>Signer egenerkl&aelig;ring digitalt</li>
<li>Oppdater risikoanalyse og handlingsplan med nye, aktuelle frister</li>
<li>Registrer kjemikalier (diesel, hydraulikkolje m.m.) og CE-dokumentasjon p&aring; maskiner</li>
<li>Last opp maskinf&oslash;rerbevis, ADK-bevis og HMS-kort for alle ansatte</li>
<li>Opprett aktive bygg- og graveprosjekter i KS Bygg med SJA, sjekklister og daglige rapporter</li>
<li>Bestill pliktig HMS-kurs for daglig leder Nicklas Larsson</li>
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
      to: ["larssonbyggogmaskin@gmail.com"],
      cc: ["gard@athenahms.no"],
      bcc: ["ben@athenahms.no"],
      reply_to: "gard@athenahms.no",
      subject: "Revisjonsrapport HMS & KS Bygg – Larsson Bygg Og Maskin AS",
      html,
    }),
  });
  const body = await r.text();
  return new Response(body, { status: r.status, headers: { "Content-Type": "application/json" } });
});
