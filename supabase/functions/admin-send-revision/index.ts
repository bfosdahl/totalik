import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:720px;margin:auto;padding:24px">
<h2 style="color:#0b3d6e;margin:0 0 4px">Revisjonsrapport HMS &amp; KS Bygg</h2>
<p style="margin:0 0 16px;color:#555"><strong>Graving Transport &amp; Budbiltjeneste Preljevic AS</strong> &middot; Org.nr. 925 597 163</p>
<p>Hei Esad,</p>
<p>Vi har gjennomg&aring;tt den innsendte HMS-h&aring;ndboken for Graving Transport &amp; Budbiltjeneste Preljevic AS og satt opp Total-IK med <strong>IK HMS</strong> og <strong>KS Bygg</strong>. H&aring;ndboken er prosjektorientert med 7 ulike anlegg/byggeplasser, men de fleste seksjonene mangler konkret innhold og signaturer.</p>

<h3 style="color:#0b3d6e">Hovedfunn</h3>
<ol>
<li><strong>Egenerkl&aelig;ring</strong> (s. 7&ndash;8) er ikke signert. M&aring; signeres digitalt av daglig leder Esad Preljevic.</li>
<li><strong>Avtale om &aring; ikke ha verneombud</strong> (s. 7) er ikke signert. Bedriften har 1 ansatt og kan inng&aring; slik avtale (AML &sect; 6-1), men den m&aring; signeres og fornyes hvert 2. &aring;r.</li>
<li><strong>Pliktig HMS-kurs for daglig leder</strong> Esad Preljevic etter AML &sect; 3-5 (6&ndash;7 timer) &ndash; ingen dokumentasjon. Tilbys av oss.</li>
<li><strong>Lover og forskrifter</strong> (s. 12) er kun plassholder. M&aring; listes konkret: AML, IK-forskriften, byggherreforskriften, forskrift om utf&oslash;relse av arbeid, vegtrafikkloven, ADR (transport av farlig gods om relevant), forskrift om arbeid med graving og avstivning av grunn (NS 8141), forskrift om bruk av arbeidsutstyr.</li>
<li><strong>Avtaleoversikt</strong> (s. 10&ndash;11): kun Gard Fosdahl er n&aelig;rmest oppf&oslash;rt. Skal inneholde regnskap, forsikring, yrkesskadeforsikring, bilforsikring, elektriker, brannvern, leasingavtaler maskiner, leverand&oslash;rer m.m.</li>
<li><strong>Oppl&aelig;ring</strong> (s. 12&ndash;13) og <strong>system-gjennomgang</strong> (s. 14) er tomme overskrifter uten dokumentert innhold. Maskinf&oslash;rerbevis (gravemaskin, hjullaster), bilf&oslash;rerbevis YSK, ADK-bevis (Arbeid p&aring; eksisterende VA-anlegg) m&aring; dokumenteres.</li>
<li><strong>Avviksregister</strong> (s. 14&ndash;15) er tomt. Skal brukes aktivt &ndash; ogs&aring; sm&aring; saker (n&aelig;rulykker, materiellskader, kabel-/r&oslash;rbrudd).</li>
<li><strong>M&aring;lsetting for IK/HMS</strong> (s. 16, 21, 29 m.fl.) er korte setninger ("Unng&aring; skader", "Ferdigstille uten skader") &ndash; mangler konkrete, m&aring;lbare KPI-er.</li>
<li><strong>Organisasjonskart</strong> for prosjektene viser kun daglig leder + arbeidsleder (Armin Jasarevic / Dzevad Mujkanovic). Mangler HMS-ansvarlig, brannvernleder, f&oslash;rstehjelpsansvarlig og rolle som ansvarlig for grave-/gjenfyllingsarbeid.</li>
<li><strong>Risikoanalyser</strong> for de 7 prosjektene (Hjersingsvei 24, Belegningsten Ra, Egon, Nordahl Griegsgt, Enggata 8, Mossinsgte 7, Hjersingsvei 22) er stort sett tomme eller mangler vurdering. M&aring; suppleres med typiske risikoer for graving og anlegg: kabel-/r&oslash;rp&aring;visning (Gravemelding), grunnforhold/ras, trafikk ved/p&aring; vei, p&aring;k&oslash;rsel av personell, klem-/fallskader i gr&oslash;ft, st&oslash;v og st&oslash;y fra maskiner, vibrasjon, eksos i tette omr&aring;der.</li>
<li><strong>Handlingsplaner</strong> har enkelte tiltak med frister fra 2020&ndash;2022, men ingen oppdatering eller dokumentert lukking.</li>
<li><strong>Avstivning av gr&oslash;fter</strong> over 2 m dybde (forskrift om utf&oslash;relse av arbeid kap. 21) &ndash; rutine og sjekkliste mangler.</li>
<li><strong>Gravemelding/kabelp&aring;visning</strong> hos Geomatikk/Telenor/nettselskap &ndash; rutine mangler dokumentert.</li>
<li><strong>Trafikkavviklingsplan / arbeidsvarsling</strong> ved arbeid p&aring; eller n&aelig;r offentlig vei (Statens vegvesen kurs 1/2) &ndash; ingen dokumentasjon.</li>
<li><strong>Stoffkartotek</strong> mangler. Typisk for graving/anlegg: diesel, hydraulikkolje, smurning, propan, asfaltprimer, betongtilsetning, l&oslash;semidler.</li>
<li><strong>CE-dokumentasjon og kontroll</strong> for gravemaskin, hjullaster, vibroplate, stamper, kompressor, hyd. hammer &ndash; mangler.</li>
<li><strong>Sakkyndig kontroll</strong> (&aring;rlig) av gravemaskin og l&oslash;fteutstyr &ndash; dokumentasjon mangler.</li>
<li><strong>Vibrerende verkt&oslash;y</strong>: ingen vurdering av eksponering (vibroplate, stamper, hyd. hammer).</li>
<li><strong>H&oslash;rselsvern og st&oslash;ym&aring;ling</strong>: ingen dokumentasjon p&aring; eksponering eller utstyrsbruk.</li>
<li><strong>St&oslash;v</strong> (kvarts/asfalt): mangler vurdering og rutine for st&oslash;vmaske/vanning.</li>
<li><strong>Bilpark/budbiltjeneste</strong>: kj&oslash;ret&oslash;ydokumentasjon, kontroll, EU-kontroll, lastsikring, ADR (ved farlig gods) &ndash; mangler i h&aring;ndboken.</li>
<li><strong>Vernerunder</strong> p&aring; byggeplass mangler &ndash; rutine og sjekklister m&aring; opprettes (egenkontroll siden bedriften ikke har verneombud).</li>
<li><strong>Brann og beredskap</strong>: generelle rutiner, men kontroll av sl&oslash;kkemidler i maskiner/biler og varme arbeider-sertifikat mangler dokumentert.</li>
<li><strong>ID-kort/HMS-kort</strong> for byggebransjen er pliktig (byggekortforskriften) &ndash; m&aring; dokumenteres for alle ansatte.</li>
<li><strong>F&oslash;rstehjelp</strong>: sjekklister for kontroll av f&oslash;rstehjelpsutstyr i bil/maskin og dokumentert oppl&aelig;ring mangler.</li>
<li><strong>Yrkesskadeforsikring</strong> (lovp&aring;lagt) &ndash; polise m&aring; dokumenteres.</li>
</ol>

<div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:12px 16px;margin:16px 0">
<strong>Konklusjon:</strong> H&aring;ndboken har god prosjektstruktur med 7 anlegg, men de fleste kapitlene mangler konkret innhold og signaturer. Systemet i Total-IK er n&aring; aktivert med IK HMS og KS Bygg, og de 7 prosjektene er importert som ferdigstilte prosjekter i KS Bygg-modulen.
</div>

<h3 style="color:#0b3d6e">Hva er gjort i systemet</h3>
<ul>
<li>Modulen <strong>IK HMS</strong> er aktivert med bransje graving/anlegg/VA</li>
<li>Modulen <strong>KS Bygg</strong> er aktivert</li>
<li>Antall ansatte registrert (1)</li>
<li>De 7 historiske prosjektene fra h&aring;ndboken er lagt inn i KS Bygg som ferdigstilte prosjekter: Hjersingsvei 24, Belegningsten Ra, Egon, Nordahl Griegsgt, Enggata 8, Mossinsgte 7, Hjersingsvei 22</li>
<li>Maler for rutiner, sjekklister, SJA og risikoanalyse er tilgjengelige</li>
</ul>

<h3 style="color:#0b3d6e">Neste steg</h3>
<ol>
<li>Logg inn p&aring; <a href="https://totalik.no">totalik.no</a> og fullf&oslash;r oppsettsveiviseren</li>
<li>Signer egenerkl&aelig;ring og verneombud-avtale digitalt</li>
<li>Fyll ut risikoanalyse og handlingsplan tilpasset graving/anlegg</li>
<li>Registrer kjemikalier (diesel, hydraulikkolje m.m.) og CE-/sakkyndig kontroll p&aring; maskiner</li>
<li>Opprette nye prosjekter i KS Bygg etter hvert som arbeid starter &ndash; med SJA, sjekklister og daglige rapporter</li>
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
      to: ["post@graving-viken.no"],
      cc: ["gard@athenahms.no"],
      bcc: ["ben@athenahms.no"],
      reply_to: "gard@athenahms.no",
      subject: "Revisjonsrapport HMS & KS Bygg – Graving Transport & Budbiltjeneste Preljevic AS",
      html,
    }),
  });
  const body = await r.text();
  return new Response(body, { status: r.status, headers: { "Content-Type": "application/json" } });
});
