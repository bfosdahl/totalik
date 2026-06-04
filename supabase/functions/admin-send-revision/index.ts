import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:720px;margin:auto;padding:24px">
<h2 style="color:#0b3d6e;margin:0 0 4px">Revisjonsrapport HMS</h2>
<p style="margin:0 0 16px;color:#555"><strong>Vinje Ullvarefabrikk AS</strong> &middot; Org.nr. 913 797 418 &middot; Eide, 6493 Lyngstad</p>
<p>Hei Gunn Anne,</p>
<p>Vi har gjennomg&aring;tt den innsendte HMS-h&aring;ndboken for Vinje Ullvarefabrikk AS og satt opp Total-IK med <strong>IK HMS</strong>-modulen for bransjen tekstil/produksjon. H&aring;ndboken har grunnstrukturen p&aring; plass, men de fleste seksjonene mangler innhold, signaturer og oppdaterte tiltak. I tillegg er det noen kritiske avvik som m&aring; rettes umiddelbart.</p>

<div style="background:#fee2e2;border-left:4px solid #dc2626;padding:12px 16px;margin:16px 0">
<strong>Kritisk avvik:</strong> H&aring;ndboken inneholder en &laquo;Avtale om &aring; ikke ha verneombudsordning&raquo; (s. 6) med henvisning til AML &sect; 6-1 om bedrifter med mindre enn 10 medarbeidere. <strong>Iflg. Br&oslash;nn&oslash;ysundregistrene har Vinje Ullvarefabrikk AS 40 ansatte</strong>. Bedriften har dermed PLIKT til &aring; ha verneombud (AML &sect; 6-1) OG plikt til &aring; opprette arbeidsmilj&oslash;utvalg (AMU) (AML &sect; 7-1, gjelder ved 30+ ansatte). Avtalen p&aring; s. 6 er ugyldig og m&aring; fjernes.
</div>

<h3 style="color:#0b3d6e">Hovedfunn</h3>
<ol>
<li><strong>Manglende verneombud</strong> (AML &sect; 6-1) &ndash; m&aring; velges umiddelbart. Verneombud skal ha 40-timers HMS-kurs.</li>
<li><strong>Manglende arbeidsmilj&oslash;utvalg (AMU)</strong> (AML &sect; 7-1) &ndash; bedrifter med 30+ ansatte er pliktig. Medlemmer fra AMU skal ha 40-timers HMS-kurs.</li>
<li><strong>Pliktig HMS-kurs for daglig leder</strong> Gunn Anne Vinje Lyngstad (AML &sect; 3-5, 6&ndash;7 timer) &ndash; ingen dokumentasjon. Tilbys av oss.</li>
<li><strong>Egenerkl&aelig;ring er ikke signert</strong> (s. 7). M&aring; signeres digitalt av daglig leder og representant for de ansatte.</li>
<li><strong>Bedriftshelsetjeneste (BHT)</strong>: tekstilproduksjon er i bransjegruppe som er pliktig BHT-tilknyttet (forskrift om organisering, ledelse og medvirkning &sect; 13-1). Ikke dokumentert.</li>
<li><strong>Lover og forskrifter</strong> (s. 11): kun henvisning til lovdata.no, ingen konkret oversikt. M&aring; listes opp (AML, IK-forskriften, forskrift om utf&oslash;relse av arbeid, kjemikalieforskriften, st&oslash;yforskriften, produktkontrolloven).</li>
<li><strong>Avtaleoversikt</strong> (s. 10) er nesten tom &ndash; kun Mimircon.no oppf&oslash;rt. Skal inneholde regnskap, BHT, forsikring, elektriker, brannvern, renovasjon, leverand&oslash;rer av kjemikalier/farger m.m.</li>
<li><strong>Oppl&aelig;ring</strong> (s. 12) og <strong>system-gjennomgang</strong> (s. 13) er tomme overskrifter uten dokumentert innhold.</li>
<li><strong>Avviksregister</strong> (s. 14) er tomt. Skal brukes aktivt &ndash; ogs&aring; sm&aring; saker.</li>
<li><strong>M&aring;lsetting for IK/HMS</strong> (s. 15) mangler konkrete, m&aring;lbare m&aring;l.</li>
<li><strong>Organisasjonskart</strong> (s. 16): viser kun &laquo;Arbeidsgiver: Svein Skjelland&raquo; &ndash; daglig leder iflg. ansattlisten er Gunn Anne Vinje Lyngstad. Roller (HMS-ansvarlig, verneombud, brannvernleder, AMU, f&oslash;rstehjelpsansvarlig) mangler.</li>
<li><strong>Risikoanalyse</strong> (s. 17) er kun et tomt skjema. M&aring; fylles ut med typiske risikoer for ullvarefabrikk: maskinarbeid (kard-, spinn-, vev-, strikk-, sy- og pressemaskiner), st&oslash;y, st&oslash;v/fiberst&oslash;v, kjemikalier (farger, vaskemidler, impregnering), klemskader, l&oslash;ft, varme/damp, brann.</li>
<li><strong>Handlingsplan</strong> (s. 18) er tom. Skal vise konkrete tiltak, ansvarlig og frist for hver risiko.</li>
<li><strong>Stoffkartotek</strong> mangler. Som ullvarefabrikk m&aring; farger, beis, vaskemidler, impregneringsmidler, l&oslash;semidler og rengj&oslash;ringsmidler registreres med sikkerhetsdatablad (forskrift om utf&oslash;relse av arbeid kap. 2).</li>
<li><strong>St&oslash;ym&aring;ling og h&oslash;rselsvern</strong>: vev- og kardemaskiner gir h&oslash;ye st&oslash;yniv&aring;er. Dokumentert st&oslash;ym&aring;ling, h&oslash;rselskontroll og bruk av h&oslash;rselsvern mangler.</li>
<li><strong>Maskinvern og CE-dokumentasjon</strong>: alle tekstilmaskiner skal ha CE-merking, bruksanvisning p&aring; norsk, dokumentert oppl&aelig;ring og periodisk kontroll.</li>
<li><strong>Ergonomi</strong>: sittende sy-arbeid, st&aring;ende vev-arbeid, repetitive bevegelser &ndash; risikovurdering og tiltak (justerbare arbeidsbenker, pauser, rotasjon) mangler.</li>
<li><strong>Brann og beredskap</strong> (rutinekap. 2): rutinene er stikkordsmessige. Dokumentasjon p&aring; brann&oslash;velse, r&oslash;mningsplan, kontroll av sl&oslash;kkemidler og brannalarmanlegg mangler &ndash; spesielt viktig pga. brennbart materiale (ull, tekstiler, kjemikalier).</li>
<li><strong>Elektro</strong> (rutinekap. 3): kun generelle r&aring;d. Internkontroll av elektriske anlegg (NEK 405-10) og periodisk kontroll av maskiner b&oslash;r dokumenteres.</li>
<li><strong>Ytre milj&oslash;</strong> (rutinekap. 5.1): avfallsh&aring;ndtering n&oslash;dvendig, men utslippstillatelse, kjemikalieh&aring;ndtering, sortering og leveringsavtaler m&aring; dokumenteres konkret.</li>
<li><strong>P&aring;r&oslash;rendelister</strong>: kun 2 av 10 ansatte har registrert n&aelig;rmeste p&aring;r&oslash;rende. Skal v&aelig;re komplett for alle.</li>
<li><strong>HMS-runder/vernerunder</strong>: ingen dokumenterte runder. Skal gjennomf&oslash;res 1&ndash;2 ganger i &aring;ret med sjekkliste, sammen med verneombud.</li>
<li><strong>F&oslash;rstehjelp</strong>: sjekklister for kontroll av f&oslash;rstehjelpsutstyr og dokumentert oppl&aelig;ring mangler.</li>
</ol>

<div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:12px 16px;margin:16px 0">
<strong>Konklusjon:</strong> H&aring;ndboken er en mal med grunnstrukturen p&aring; plass, men er ikke tilpasset bedriftens st&oslash;rrelse (40 ansatte) eller bransje (tekstilproduksjon). Den m&aring; oppdateres p&aring; alle de tomme punktene, og avtalen om &aring; ikke ha verneombud m&aring; fjernes umiddelbart. Systemet i Total-IK er n&aring; aktivert og rutinene kan flyttes over.
</div>

<h3 style="color:#0b3d6e">Hva er gjort i systemet</h3>
<ul>
<li>Modulen IK HMS er aktivert</li>
<li>Bransje satt til tekstil/produksjon</li>
<li>Antall ansatte registrert (40 iflg. Br&oslash;nn&oslash;ysundregisteret)</li>
<li>Maler for rutiner, sjekklister og risikoanalyse er tilgjengelige</li>
</ul>

<h3 style="color:#0b3d6e">Neste steg</h3>
<ol>
<li>Velg verneombud og meld inn til oss for 40-timers HMS-kurs</li>
<li>Etabler AMU og meld medlemmer til 40-timers HMS-kurs</li>
<li>Bestill pliktig HMS-kurs for daglig leder (6&ndash;7 timer)</li>
<li>Inng&aring; avtale med bedriftshelsetjeneste</li>
<li>Logg inn p&aring; <a href="https://totalik.no">totalik.no</a> og fullf&oslash;r oppsettsveiviseren</li>
<li>Signer egenerkl&aelig;ring digitalt</li>
<li>Fyll ut risikoanalyse og handlingsplan tilpasset tekstilproduksjon</li>
<li>Registrer kjemikalier i stoffkartoteket</li>
<li>Gjennomf&oslash;r st&oslash;ym&aring;ling og dokumenter h&oslash;rselskontroll</li>
</ol>

<p>Ta kontakt med din kontaktperson <strong>Gard Fosdahl</strong> om dere &oslash;nsker hjelp til oppsett, HMS-kurs eller bedriftshelsetjeneste.</p>
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
      to: ["gunnanne@lanullva.no"],
      bcc: ["gard@athenahms.no"],
      reply_to: "gard@athenahms.no",
      subject: "Revisjonsrapport HMS – Vinje Ullvarefabrikk AS",
      html,
    }),
  });
  const j = await r.json();
  console.log("resend", r.status, JSON.stringify(j));
  return new Response(JSON.stringify(j), { status: r.status, headers: { "Content-Type": "application/json" } });
});
