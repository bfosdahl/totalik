import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:720px;margin:auto;padding:24px">
<h2 style="color:#0b3d6e;margin:0 0 4px">Revisjonsrapport HMS &amp; KS Bygg</h2>
<p style="margin:0 0 16px;color:#555"><strong>Foras Bygg AS</strong> &middot; Org.nr. 916 876 726 &middot; Lerums vei 1, 5178 Loddefjord</p>
<p>Hei Timohins,</p>
<p>Vi har gjennomg&aring;tt den innsendte HMS-h&aring;ndboken for Foras Bygg AS og satt opp Total-IK med <strong>IK HMS</strong> og <strong>KS Bygg</strong> for bygg/rehabilitering/nybygging. H&aring;ndboken har god struktur med b&aring;de IK/HMS- og IK/Bygg-seksjoner, men flere kapitler mangler konkret innhold, oppdatering og signaturer.</p>

<h3 style="color:#0b3d6e">Hovedfunn</h3>
<ol>
<li><strong>Egenerkl&aelig;ring</strong> (s. 7) er ikke signert. M&aring; signeres digitalt av daglig leder Timohins Jevgenijs.</li>
<li><strong>Avtale om &aring; ikke ha verneombud</strong> (s. 6) er ikke signert. Bedriften har 1 ansatt og kan inng&aring; slik avtale (AML &sect; 6-1), men den m&aring; signeres og fornyes hvert 2. &aring;r.</li>
<li><strong>Pliktig HMS-kurs for daglig leder</strong> Timohins Jevgenijs etter AML &sect; 3-5 (6&ndash;7 timer) &ndash; ingen dokumentasjon. Tilbys av oss.</li>
<li><strong>Lover og forskrifter</strong> (s. 11) er kun plassholder. M&aring; listes konkret: AML, IK-forskriften, byggherreforskriften, forskrift om utf&oslash;relse av arbeid, plan- og bygningsloven, SAK10, byggekortforskriften, kjemikalieforskriften, st&oslash;yforskriften.</li>
<li><strong>Avtaleoversikt</strong> (s. 10) mangler de fleste avtaler. Skal inneholde regnskap (Accountor Bergen er nevnt), forsikring, yrkesskadeforsikring, elektriker, brannvern, leverand&oslash;rer av byggevarer m.m.</li>
<li><strong>Oppl&aelig;ring</strong> (s. 12) og <strong>system-gjennomgang</strong> (s. 13) er tomme overskrifter uten dokumentert innhold.</li>
<li><strong>Avviksregister</strong> (s. 14) er tomt. Skal brukes aktivt &ndash; ogs&aring; sm&aring; saker (n&aelig;rulykker, materiellskader).</li>
<li><strong>M&aring;lsetting for IK/HMS</strong> (s. 15) og IK/Bygg (s. 29) mangler konkrete, m&aring;lbare m&aring;l (KPI-er).</li>
<li><strong>Organisasjonskart</strong> (s. 16 og 30) viser kun arbeidsgiver Timohins Jevgenijs, arbeidsleder Victor Paulsen og prosjektleder Edgars Zvirgzd. Mangler HMS-ansvarlig, brannvernleder og f&oslash;rstehjelpsansvarlig.</li>
<li><strong>Risikoanalyse IK/HMS</strong> (s. 17) er kun delvis utfylt. <strong>Risikoanalyse IK/Bygg</strong> (s. 31) er tom.</li>
<li><strong>Handlingsplan</strong> (s. 18&ndash;21) har enkelte tiltak (arbeid i h&oslash;yden, ensformig arbeid, fallende gjenstander, spr&aring;kforvirring) med ansvarlig Victor Paulsen, men frister er fra <strong>mai 2018</strong> &ndash; ikke fulgt opp eller oppdatert. Handlingsplan IK/Bygg (s. 32) er tom.</li>
<li><strong>Stoffkartotek</strong> mangler. M&aring; inneholde sikkerhetsdatablad for byggskum, lim, fugemasse, impregneringsmidler, l&oslash;semidler, rengj&oslash;ringsmidler m.m.</li>
<li><strong>CE-dokumentasjon</strong> for tre-bearbeidingsmaskiner, sirkels&aring;g, h&oslash;velbenk, elektriske verkt&oslash;y &ndash; mangler.</li>
<li><strong>Vibrerende verkt&oslash;y</strong>: ingen vurdering av eksponering (forskrift om utf&oslash;relse av arbeid kap. 14) for slagbor, vinkelsliper, spikerpistol m.m.</li>
<li><strong>Fallsikring og arbeid i h&oslash;yden</strong> (rutinekap. 5.1) har tekst, men sertifisert fallsikringsutstyr, kontroll, oppl&aelig;ring og stillaskompetanse m&aring; dokumenteres.</li>
<li><strong>H&oslash;rselsvern og st&oslash;ym&aring;ling</strong>: ingen dokumentasjon p&aring; st&oslash;yeksponering fra maskiner.</li>
<li><strong>St&oslash;v</strong> (tre-/kvartsst&oslash;v): mangler vurdering og rutine for st&oslash;vmaske/avsug.</li>
<li><strong>Vernerunder</strong> (rutinekap. 2.2) er nevnt, men sjekklister og dokumentert gjennomf&oslash;ring p&aring; byggeplass mangler.</li>
<li><strong>Brann og beredskap</strong> (rutinekap. 6) har generelle rutiner, men kontroll av sl&oslash;kkemidler p&aring; byggeplass og varme arbeider-sertifikat mangler.</li>
<li><strong>ID-kort/HMS-kort</strong> (rutinekap. 5.4) er nevnt &ndash; kopi/dokumentasjon p&aring; gyldige kort for alle ansatte m&aring; legges inn.</li>
<li><strong>F&oslash;rstehjelp</strong>: sjekklister for kontroll av f&oslash;rstehjelpsutstyr og dokumentert oppl&aelig;ring mangler.</li>
<li><strong>Yrkesskadeforsikring</strong> (lovp&aring;lagt) &ndash; polise m&aring; dokumenteres.</li>
<li><strong>Spr&aring;kforvirring</strong> er identifisert som risiko (s. 20) med tiltak "alltid ha norsktalende person fra entrepren&oslash;r tilstede". Bra at risikoen er sett &ndash; m&aring; settes i system med rutiner for sikkerhetsinstruks p&aring; flere spr&aring;k og dokumentert oppl&aelig;ring.</li>
<li><strong>SJA (Sikker jobbanalyse)</strong> er nevnt (pkt. 5.1) &ndash; mal og dokumenterte SJA per prosjekt mangler.</li>
<li><strong>Framdriftsplan</strong> (IK/Bygg rutinekap. 2.6&ndash;2.7) er duplisert overskrift uten konkret innhold &ndash; m&aring; ryddes opp og fylles ut.</li>
</ol>

<div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:12px 16px;margin:16px 0">
<strong>Konklusjon:</strong> H&aring;ndboken har god grunnstruktur med separate IK/HMS- og IK/Bygg-kapitler, men de fleste seksjonene mangler konkret innhold, oppdatering og signaturer. Handlingsplaner er ikke oppdatert siden 2018. Systemet i Total-IK er n&aring; aktivert med IK HMS og KS Bygg slik at rutiner og prosjekter kan flyttes over.
</div>

<h3 style="color:#0b3d6e">Hva er gjort i systemet</h3>
<ul>
<li>Modulen <strong>IK HMS</strong> er aktivert med bransje bygg/rehabilitering/nybygging</li>
<li>Modulen <strong>KS Bygg</strong> er aktivert</li>
<li>Antall ansatte registrert (1)</li>
<li>Maler for rutiner, sjekklister, SJA og risikoanalyse er tilgjengelige</li>
</ul>

<h3 style="color:#0b3d6e">Neste steg</h3>
<ol>
<li>Logg inn p&aring; <a href="https://totalik.no">totalik.no</a> og fullf&oslash;r oppsettsveiviseren</li>
<li>Signer egenerkl&aelig;ring og verneombud-avtale digitalt</li>
<li>Oppdater risikoanalyse og handlingsplan med nye, aktuelle frister</li>
<li>Registrer kjemikalier og CE-dokumentasjon p&aring; maskiner</li>
<li>Opprette aktive byggeprosjekter i KS Bygg med SJA, sjekklister og daglige rapporter</li>
<li>Bestill pliktig HMS-kurs for daglig leder</li>
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
      to: ["post@forasbygg.no"],
      cc: ["gard@athenahms.no"],
      bcc: ["ben@athenahms.no"],
      reply_to: "gard@athenahms.no",
      subject: "Revisjonsrapport HMS & KS Bygg – Foras Bygg AS",
      html,
    }),
  });
  const body = await r.text();
  return new Response(body, { status: r.status, headers: { "Content-Type": "application/json" } });
});
