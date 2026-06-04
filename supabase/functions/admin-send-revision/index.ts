import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:720px;margin:auto;padding:24px">
<h2 style="color:#0b3d6e;margin:0 0 4px">Revisjonsrapport HMS &ndash; Rh Fris&oslash;r AS</h2>
<p style="margin:0 0 16px;color:#555"><strong>Rh Fris&oslash;r AS</strong> &middot; Org.nr. 931 324 284 &middot; Hauges gate 24, 3019 Drammen</p>
<p>Hei Ragnhild,</p>
<p>Vi har gjennomg&aring;tt den innsendte HMS-h&aring;ndboken for Rh Fris&oslash;r AS og satt opp Total-IK med <strong>IK HMS</strong> tilpasset fris&oslash;r-/sk&joslash;nnhetsbransjen. H&aring;ndboken er en standardmal som <strong>i hovedsak ikke er fylt ut</strong>, og en rekke vesentlige punkter m&aring; p&aring; plass for &aring; tilfredsstille kravene i internkontrollforskriften.</p>

<div style="background:#fde8e8;border-left:4px solid #dc2626;padding:12px 16px;margin:16px 0">
<strong>STATUS:</strong> Bedriften har <strong>1 ansatt</strong> (deg selv som daglig leder/eier). Avtalen p&aring; s. 6 om &aring; ikke ha verneombud er <em>gyldig</em> s&aring;lenge dere er under 10 ansatte, men m&aring; faktisk dateres og signeres. Skulle dere ansette flere, m&aring; verneombud velges (AML &sect; 6-1).
</div>

<h3 style="color:#0b3d6e">Hovedfunn</h3>
<ol>
<li><strong>Avtale om ikke &aring; ha verneombud</strong> (s. 6) er udatert og usignert. M&aring; signeres av deg som daglig leder og av medarbeider (deg selv). Gyldighet 2 &aring;r.</li>
<li><strong>Egenerkl&aelig;ring</strong> (s. 7) er ikke signert. M&aring; signeres digitalt av daglig leder Ragnhild H&aring;vardsrud.</li>
<li><strong>Pliktig HMS-kurs for daglig leder</strong> etter AML &sect; 3-5 (6&ndash;7 timer) &ndash; ingen dokumentasjon. Lovp&aring;lagt for alle som driver virksomhet med ansatte, ogs&aring; enkeltmannsbedrifter med &eacute;n ansatt. Tilbys av oss.</li>
<li><strong>Forretningsid&eacute;</strong> (s. 8) er tom &ndash; m&aring; beskrives kort (fris&oslash;rsalong, tjenester, kundegruppe).</li>
<li><strong>Avtaleoversikt</strong> (s. 10) er helt tom. M&aring; suppleres med: regnskapsf&oslash;rer, forsikring (yrkesskade og innbo/l&oslash;s&oslash;re), bedriftshelsetjeneste, leverand&oslash;r av fris&oslash;rprodukter (f.eks. Wella, L'Or&eacute;al, Schwarzkopf), renhold, brannvern/slukkerservice, el-kontroll, avfallsh&aring;ndtering (s&aelig;rlig farlig avfall fra kjemikalier), kassasystem/betalingsterminal.</li>
<li><strong>Lover og forskrifter</strong> (s. 11) er kun plassholder. M&aring; listes konkret: Arbeidsmilj&oslash;loven, Internkontrollforskriften, Forskrift om utf&oslash;relse av arbeid (kjemikalier), Forskrift om tiltaks- og grenseverdier, Forskrift om gjenvinning og behandling av avfall, Folkehelseloven, Forskrift om milj&oslash;rettet helsevern, Forskrift om h&aring;ndtering av brannfarlig stoff, Personopplysningsloven/GDPR.</li>
<li><strong>Oppl&aelig;ring</strong> (s. 12) er tom. M&aring; dokumentere: pliktig HMS-kurs for daglig leder, fagbrev fris&oslash;r, kurs i kjemikalieh&aring;ndtering (h&aring;rfargestoff, blekemidler), brannvernoppl&aelig;ring, f&oslash;rstehjelp.</li>
<li><strong>Gjennomgang av system</strong> (s. 13) &ndash; &aring;rlig revisjon m&aring; planlegges og dokumenteres. Total-IK setter dette opp i &aring;rshjul.</li>
<li><strong>Avviksregister</strong> (s. 14) er tomt. M&aring; brukes aktivt for kundeklager, allergiske reaksjoner, kjemikaliesprut/-s&oslash;l, kuttskader, n&aelig;rulykker, brann.</li>
<li><strong>M&aring;lsetting for IK/HMS</strong> (s. 15) er generell tekst uten konkrete m&aring;l. M&aring; oppdateres med m&aring;lbare m&aring;l for 2026 (f.eks. null hudreaksjoner, null kuttskader, 100% bruk av hansker ved fargebehandling).</li>
<li><strong>Risikoanalyse</strong> (s. 16) er helt tom. M&aring; utf&oslash;res med kartlegging av: kjemikalieeksponering (PPD i h&aring;rfarge, ammoniakk, persulfater i bleking), allergi/kontakteksem (v&aring;tarbeid), ergonomi (statisk arbeid st&aring;ende, skuldre/nakke/rygg/h&aring;ndledd), kutt fra saks/barberkniv, brannrisiko (f&oslash;ner/krelltang/varmt vann), elektrisk utstyr, sklirisiko (v&aring;te gulv), bel&aring;ningsr&aring;n, alenearbeid, st&oslash;y fra f&oslash;ner over tid, inneklima/ventilasjon.</li>
<li><strong>Handlingsplan</strong> (s. 17) er tom. M&aring; fylles ut med tiltak, ansvarlig og frist for hver identifiserte risiko.</li>
<li><strong>Rutiner for IK/HMS</strong> (s. 18) er tom. M&aring; opprettes rutiner for: kjemikalieh&aring;ndtering, bruk av personlig verneutstyr, v&aring;tarbeid og hudpleie, rengj&oslash;ring og desinfeksjon, h&aring;ndtering av kunder med allergi, brann og evakuering, f&oslash;rstehjelp, h&aring;ndtering av kontanter og r&aring;nsforebygging, avfallsh&aring;ndtering, kasse-/regnskapsrutiner.</li>
<li><strong>Stoffkartotek</strong> mangler helt. Fris&oslash;rbransjen har omfattende krav her. M&aring; ha sikkerhetsdatablad for: h&aring;rfarge (alle nyanser/m&aring;rker), blekemidler (persulfater), oksidasjonsmidler (hydrogenperoksid), permanentv&aelig;ske, sjampo/balsam i bulk, desinfeksjonsmidler, rengj&oslash;ringsmidler, klorin/eddik.</li>
<li><strong>Kjemikalierisikovurdering</strong> (Forskrift om utf&oslash;relse av arbeid kap. 3): m&aring; gjennomf&oslash;res for alle helsefarlige produkter. S&aelig;rlig fokus p&aring; PPD-allergi, astma fra persulfater, kontakteksem.</li>
<li><strong>Personlig verneutstyr</strong>: nitril-/PVA-hansker (ikke latex), forkle, vernebriller ved bleking, eventuelt &aring;ndedrettsvern ved blandeprosess. Oversikt og utdeling m&aring; dokumenteres.</li>
<li><strong>Ventilasjon</strong>: arbeidsplassforskriften krever tilstrekkelig luftutskifting der det h&aring;ndteres kjemikalier. Ventilasjonsanlegget b&oslash;r kontrolleres &aring;rlig.</li>
<li><strong>Hygiene og smittevern</strong>: rutiner for desinfeksjon av sakser, kammer, b&oslash;rster, vask av h&aring;ndklær og kapper p&aring; minst 60 &deg;C, h&aring;ndhygiene.</li>
<li><strong>Brann og beredskap</strong>: mangler rutine for &aring;rlig kontroll av brannslukker, r&oslash;ykvarsler, brannvernleder, evakueringsplan og branninstruks p&aring; vegg.</li>
<li><strong>F&oslash;rstehjelp</strong>: f&oslash;rstehjelpsskrin (med &oslash;yeskyllv&aelig;ske, s&aelig;rlig viktig ved kjemikaliesprut), oppl&aelig;ring og kontrollrutine mangler.</li>
<li><strong>Elektrisk kontroll</strong> (NEK 400/El-tilsynsloven): &aring;rlig egenkontroll og periodisk kontroll av el-anlegg og fris&oslash;rutstyr (f&oslash;ner, krelltang, rettetang) mangler.</li>
<li><strong>Yrkesskadeforsikring</strong> (lovp&aring;lagt): selskap og polisenummer m&aring; dokumenteres.</li>
<li><strong>Bedriftshelsetjeneste</strong>: fris&oslash;rbransjen er en av bransjene med <strong>plikt til bedriftshelsetjeneste</strong> jf. forskrift om organisering, ledelse og medvirkning &sect; 13-1. Avtale med godkjent BHT m&aring; p&aring; plass og dokumenteres.</li>
<li><strong>Sykefrav&aelig;rsoppf&oslash;lging</strong> og <strong>medarbeidersamtaler</strong>: rutine mangler (gjelder ogs&aring; om man kun er &eacute;n ansatt, dersom det ansettes flere).</li>
<li><strong>Avfallsh&aring;ndtering</strong>: rutine for h&aring;ndtering av rester av h&aring;rfarge/blekemiddel som farlig avfall, leveringssted og deklarasjon mangler.</li>
<li><strong>GDPR/personvern</strong>: kundeliste, bookingsystem og bilder p&aring; sosiale medier m&aring; ha personvernerkl&aelig;ring og samtykker.</li>
<li><strong>Internkontrollh&aring;ndboken b&oslash;r oppdateres &aring;rlig</strong> &ndash; planlegges som fast aktivitet i &aring;rshjulet.</li>
</ol>

<div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:12px 16px;margin:16px 0">
<strong>Konklusjon:</strong> H&aring;ndboken er en standardmal med kun grunnleggende informasjon (firmanavn, adresse, ansatt) utfylt. <strong>Alle vesentlige kapitler er tomme</strong> &ndash; lover, avtaleoversikt, oppl&aelig;ring, avvik, m&aring;l, risikoanalyse, handlingsplan, rutiner og stoffkartotek. For fris&oslash;rbransjen er kjemikaliedelen, plikten til bedriftshelsetjeneste og pliktig HMS-kurs for daglig leder de viktigste manglene. Systemet i Total-IK er n&aring; aktivert med IK HMS for fris&oslash;r/sk&joslash;nnhet slik at dette kan bygges opp strukturert.
</div>

<h3 style="color:#0b3d6e">Hva er gjort i systemet</h3>
<ul>
<li>Modulen <strong>IK HMS</strong> er aktivert med bransje fris&oslash;r/sk&joslash;nnhet</li>
<li>Antall ansatte registrert (1)</li>
<li>Maler for rutiner, sjekklister, SJA og risikoanalyse for fris&oslash;rsalong er tilgjengelige</li>
</ul>

<h3 style="color:#0b3d6e">Neste steg</h3>
<ol>
<li>Logg inn p&aring; <a href="https://totalik.no">totalik.no</a> og fullf&oslash;r oppsettsveiviseren</li>
<li>Signer egenerkl&aelig;ring og verneombudsavtale digitalt</li>
<li>Registrer alle kjemikalier (h&aring;rfarge, blekemiddel, oksidant, permanentv&aelig;ske, vaskemidler) i stoffkartoteket</li>
<li>Gjennomf&oslash;r risikoanalyse og lag handlingsplan med 2026-frister</li>
<li>Inng&aring; avtale med godkjent bedriftshelsetjeneste (lovp&aring;lagt for fris&oslash;rbransjen)</li>
<li>Last opp yrkesskadeforsikring og &oslash;vrige avtaler</li>
<li>Bestill <strong>pliktig HMS-kurs for daglig leder</strong> hos oss</li>
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
      to: ["rhfrisor@gmail.com"],
      cc: ["martin@athenahms.no"],
      bcc: ["ben@athenahms.no"],
      reply_to: "martin@athenahms.no",
      subject: "Revisjonsrapport HMS – Rh Frisør AS",
      html,
    }),
  });
  const body = await r.text();
  return new Response(body, { status: r.status, headers: { "Content-Type": "application/json" } });
});
