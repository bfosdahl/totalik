// Shared terms content for email templates
export const termsContent = `
AVTALEVILKÅR

DEFINISJONER

Alle skriftlige henvendelser fra leverandøren til kunden foretas normalt via e-post. Dette inkluderer informasjon om prisendringer, produktendringer, fakturaer, samt eventuelle purringer og inkassovarsler. Inkassovarsler sendes i tillegg per post.

Kunden har ansvar for å oppgi korrekt e-postadresse og holde denne oppdatert. Dersom kunden ikke mottar produktet, må kunden gi beskjed slik at leverandøren kan rette opp eventuelle feil.

Kunden har ansvar for å gi leverandøren de til enhver tid korrekte opplysninger som trengs for at tjenester skal kunne utføres tilfredsstillende.

Kunden plikter å levere nødvendig informasjon som leverandøren trenger for å fullføre sitt arbeid. Dersom signaturer til bedriftshelsetjeneste-kontrakter eller informasjon til andre produkter uteblir, vil leverandøren kunne fakturere ordren etter 60 dager med et bruddgebyr som fratar kunden retten til å bruke produktet. Gebyret er på 40 % av totalsummen.

INNGÅELSE AV AVTALEN

Avtalen anses som inngått når kunden bekrefter sin avtale ved godkjenning via SMS, e-post eller taleopptak.

Ved inngåelse av avtalen bekrefter kunden å ha den nødvendige retten til å inngå avtalen på virksomhetens vegne.

Leveransen anses som gjennomført og ordren som fakturerbar når kunden har mottatt brukernavn/passord til tjenesten, eller mottatt informasjonsmateriale om søknadsprosesser, ID-kort eller lignende.

OPPSIGELSE AV AVTALEN

Alle IK-systemer og kurslisenser krever skriftlig oppsigelse. Kunden må sende en e-post til post@athenahms.no eller til post@kurskontoret.no for å varsle oppsigelsen innen fristen. Dersom oppsigelse ikke skjer innen fristen, fornyes avtalen automatisk for samme periode som avtalt ved inngåelsen.

Oppsigelsesfrister:
• IK-system: 6 måneder.
• Kurslisenser: 3 måneder.

Kunden kan årlig endre navn/ansatt tilknyttet kurslisensen. Nye kurs inkluderes i lisensen.

KUNDENS RETTIGHETER OG PLIKTER

Kunden får tilgang til produkter via internett ved avtaleinngåelse.

Kunden må selv administrere, vedlikeholde og nyttiggjøre seg av produktene.

Kunden eier og kan fritt disponere data i produktene.

Abonnementet fornyes automatisk dersom kunden ikke sier opp skriftlig minst 6 måneder før avtaleperiodens utløp.

Nettsiden kan være utilgjengelig i korte perioder grunnet oppdateringer, teknisk vedlikehold eller feil.

Leverandøren forbeholder seg retten til å forbedre produkter uten å informere kunden på forhånd.

Prisendringer meddeles kunden minst en måned før endringene trer i kraft, unntatt ved prisreduksjoner.

Leverandøren skal sikre at internettjenester betjenes via en egen webtjener eller samarbeidspartnere.

LEVERANDØRENS PLIKTER

Leverandøren forplikter seg til å ikke gi uvedkommende opplysninger om kunden som mottas i forbindelse med avtalen.

Leverandørens erstatningsansvar overfor kunden følger til enhver tid gjeldende regler.

Leverandøren fraskriver seg ansvar for direkte og indirekte tap (som tap av inntekter) som skyldes feil på webtjenesten eller nedetid.

FORCE MAJEURE

Leverandøren kan ikke holdes ansvarlig for endringer forårsaket av forhold utenfor deres kontroll, som streik, lockout, krig, politiske eller offentlige bestemmelser.

BETALINGSBETINGELSER

Kunden betaler gjeldende priser for tjenester levert av leverandøren. Forfall på faktura er 10 dager dersom annet ikke er avtalt.

Avtalen gjelder for perioden som er avtalt mellom kunden og leverandøren. Dersom skriftlig oppsigelse ikke er sendt til leverandøren minst 6 måneder før periodens utløp, fornyes avtalen automatisk for like lang periode.

TVISTER

Ved tvist mellom kunden og leverandøren kan saken bringes inn for Halden Forliksråd.

Eventuelt erstatningsansvar er begrenset oppad til kontraktsverdien.

Klager må fremmes senest to måneder etter at forholdet ble kjent for partene, eller senest en måned etter at uenigheten ble påvist gjennom korrespondanse eller møter.

ÅRLIG PRISØKNING

Prisene økes årlig med 5 %. Andre prisjusteringer kan forekomme, men dersom kunden ikke informeres om annet, gjelder en årlig prisøkning på 5 %. Dette gjelder alle avtaler med leverandøren (org.nr. 934606450) for produktene Total-IK og Kurskontoret, unntatt bedriftshelsetjeneste som styres av Vitamedica eller BHT bergen eller andre samarbeidspartnere.
`.trim();

// Generate HTML formatted terms for emails
export function getTermsHtml(): string {
  return `
    <div style="background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0; max-height: 400px; overflow-y: auto;">
      <h2 style="color: #1a1a2e; margin: 0 0 16px 0; font-size: 18px; border-bottom: 2px solid #0066cc; padding-bottom: 8px;">AVTALEVILK&#197;R</h2>
      
      <div style="font-size: 13px; line-height: 1.6; color: #333;">
        <h3 style="color: #1a1a2e; margin: 16px 0 8px 0; font-size: 14px;">DEFINISJONER</h3>
        <p style="margin: 8px 0;">Alle skriftlige henvendelser fra leverandøren til kunden foretas normalt via e-post. Dette inkluderer informasjon om prisendringer, produktendringer, fakturaer, samt eventuelle purringer og inkassovarsler. Inkassovarsler sendes i tillegg per post.</p>
        <p style="margin: 8px 0;">Kunden har ansvar for å oppgi korrekt e-postadresse og holde denne oppdatert. Dersom kunden ikke mottar produktet, må kunden gi beskjed slik at leverandøren kan rette opp eventuelle feil.</p>
        <p style="margin: 8px 0;">Kunden har ansvar for å gi leverandøren de til enhver tid korrekte opplysninger som trengs for at tjenester skal kunne utføres tilfredsstillende.</p>
        <p style="margin: 8px 0;">Kunden plikter å levere nødvendig informasjon som leverandøren trenger for å fullføre sitt arbeid. Dersom signaturer til bedriftshelsetjeneste-kontrakter eller informasjon til andre produkter uteblir, vil leverandøren kunne fakturere ordren etter 60 dager med et bruddgebyr som fratar kunden retten til å bruke produktet. Gebyret er på 40 % av totalsummen.</p>
        
        <h3 style="color: #1a1a2e; margin: 16px 0 8px 0; font-size: 14px;">INNGÅELSE AV AVTALEN</h3>
        <p style="margin: 8px 0;">Avtalen anses som inngått når kunden bekrefter sin avtale ved godkjenning via SMS, e-post eller taleopptak.</p>
        <p style="margin: 8px 0;">Ved inngåelse av avtalen bekrefter kunden å ha den nødvendige retten til å inngå avtalen på virksomhetens vegne.</p>
        <p style="margin: 8px 0;">Leveransen anses som gjennomført og ordren som fakturerbar når kunden har mottatt brukernavn/passord til tjenesten, eller mottatt informasjonsmateriale om søknadsprosesser, ID-kort eller lignende.</p>
        
        <h3 style="color: #1a1a2e; margin: 16px 0 8px 0; font-size: 14px;">OPPSIGELSE AV AVTALEN</h3>
        <p style="margin: 8px 0;">Alle IK-systemer og kurslisenser krever skriftlig oppsigelse. Kunden må sende en e-post til post@athenahms.no eller til post@kurskontoret.no for å varsle oppsigelsen innen fristen. Dersom oppsigelse ikke skjer innen fristen, fornyes avtalen automatisk for samme periode som avtalt ved inngåelsen.</p>
        <p style="margin: 8px 0;"><strong>Oppsigelsesfrister:</strong></p>
        <ul style="margin: 8px 0; padding-left: 20px;">
          <li>IK-system: 6 måneder</li>
          <li>Kurslisenser: 3 måneder</li>
        </ul>
        <p style="margin: 8px 0;">Kunden kan årlig endre navn/ansatt tilknyttet kurslisensen. Nye kurs inkluderes i lisensen.</p>
        
        <h3 style="color: #1a1a2e; margin: 16px 0 8px 0; font-size: 14px;">KUNDENS RETTIGHETER OG PLIKTER</h3>
        <p style="margin: 8px 0;">Kunden får tilgang til produkter via internett ved avtaleinngåelse.</p>
        <p style="margin: 8px 0;">Kunden må selv administrere, vedlikeholde og nyttiggjøre seg av produktene.</p>
        <p style="margin: 8px 0;">Kunden eier og kan fritt disponere data i produktene.</p>
        <p style="margin: 8px 0;">Abonnementet fornyes automatisk dersom kunden ikke sier opp skriftlig minst 6 måneder før avtaleperiodens utløp.</p>
        <p style="margin: 8px 0;">Nettsiden kan være utilgjengelig i korte perioder grunnet oppdateringer, teknisk vedlikehold eller feil.</p>
        <p style="margin: 8px 0;">Leverandøren forbeholder seg retten til å forbedre produkter uten å informere kunden på forhånd.</p>
        <p style="margin: 8px 0;">Prisendringer meddeles kunden minst en måned før endringene trer i kraft, unntatt ved prisreduksjoner.</p>
        
        <h3 style="color: #1a1a2e; margin: 16px 0 8px 0; font-size: 14px;">LEVERANDØRENS PLIKTER</h3>
        <p style="margin: 8px 0;">Leverandøren forplikter seg til å ikke gi uvedkommende opplysninger om kunden som mottas i forbindelse med avtalen.</p>
        <p style="margin: 8px 0;">Leverandørens erstatningsansvar overfor kunden følger til enhver tid gjeldende regler.</p>
        <p style="margin: 8px 0;">Leverandøren fraskriver seg ansvar for direkte og indirekte tap (som tap av inntekter) som skyldes feil på webtjenesten eller nedetid.</p>
        
        <h3 style="color: #1a1a2e; margin: 16px 0 8px 0; font-size: 14px;">FORCE MAJEURE</h3>
        <p style="margin: 8px 0;">Leverandøren kan ikke holdes ansvarlig for endringer forårsaket av forhold utenfor deres kontroll, som streik, lockout, krig, politiske eller offentlige bestemmelser.</p>
        
        <h3 style="color: #1a1a2e; margin: 16px 0 8px 0; font-size: 14px;">BETALINGSBETINGELSER</h3>
        <p style="margin: 8px 0;">Kunden betaler gjeldende priser for tjenester levert av leverandøren. Forfall på faktura er 10 dager dersom annet ikke er avtalt.</p>
        <p style="margin: 8px 0;">Avtalen gjelder for perioden som er avtalt mellom kunden og leverandøren. Dersom skriftlig oppsigelse ikke er sendt til leverandøren minst 6 måneder før periodens utløp, fornyes avtalen automatisk for like lang periode.</p>
        
        <h3 style="color: #1a1a2e; margin: 16px 0 8px 0; font-size: 14px;">TVISTER</h3>
        <p style="margin: 8px 0;">Ved tvist mellom kunden og leverandøren kan saken bringes inn for Halden Forliksråd.</p>
        <p style="margin: 8px 0;">Eventuelt erstatningsansvar er begrenset oppad til kontraktsverdien.</p>
        <p style="margin: 8px 0;">Klager må fremmes senest to måneder etter at forholdet ble kjent for partene, eller senest en måned etter at uenigheten ble påvist gjennom korrespondanse eller møter.</p>
        
        <h3 style="color: #1a1a2e; margin: 16px 0 8px 0; font-size: 14px;">ÅRLIG PRISØKNING</h3>
        <p style="margin: 8px 0;">Prisene økes årlig med 5 %. Andre prisjusteringer kan forekomme, men dersom kunden ikke informeres om annet, gjelder en årlig prisøkning på 5 %. Dette gjelder alle avtaler med leverandøren (org.nr. 934606450) for produktene Total-IK og Kurskontoret, unntatt bedriftshelsetjeneste som styres av Vitamedica eller BHT Bergen eller andre samarbeidspartnere.</p>
      </div>
    </div>
  `;
}

// Generate a warning box with terms notice
export function getTermsNoticeHtml(): string {
  return `
    <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0; color: #856404; font-weight: bold; font-size: 14px;">
        VIKTIG: Vennligst les avtalevilk&#229;rene nedenfor f&#248;r du logger inn.
      </p>
      <p style="margin: 8px 0 0 0; color: #856404; font-size: 13px;">
        Ved å logge inn bekrefter du at du har lest og godtar avtalevilkårene på vegne av din virksomhet.
      </p>
    </div>
  `;
}
