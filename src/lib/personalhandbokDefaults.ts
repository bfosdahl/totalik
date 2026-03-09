export interface DefaultChapter {
  title: string;
  slug: string;
  icon: string;
  sort_order: number;
  content: string;
}

export const defaultPersonalhandbokChapters: DefaultChapter[] = [
  {
    title: "Innledning og formål",
    slug: "innledning",
    icon: "BookOpen",
    sort_order: 0,
    content: `<h2>Velkommen til vår personalhåndbok</h2>
<p>Denne personalhåndboken er bedriftens interne samling av retningslinjer, rutiner og praktisk informasjon. Den sikrer forutsigbarhet, rettferdig behandling og etterlevelse av lovverk for både ansatte og ledere.</p>
<h3>Formål</h3>
<ul>
<li>Gi alle ansatte et felles oppslagsverk for arbeidsforholdet</li>
<li>Sikre lik behandling og forutsigbarhet</li>
<li>Tydeliggjøre rettigheter og plikter</li>
<li>Støtte ledere i personaladministrasjon</li>
</ul>
<h3>Omfang</h3>
<p>Håndboken gjelder for alle ansatte i bedriften, uavhengig av stillingsprosent og ansettelsesform. Den supplerer, men erstatter ikke, gjeldende lover, tariffavtaler eller individuelle arbeidsavtaler.</p>`
  },
  {
    title: "Ansettelsesforhold",
    slug: "ansettelse",
    icon: "UserPlus",
    sort_order: 1,
    content: `<h2>Ansettelsesforhold</h2>
<h3>Rekruttering og ansettelse</h3>
<p>Alle stillinger lyses ut internt og/eller eksternt i henhold til bedriftens behov. Ansettelsesprosessen følger gjeldende lover og forskrifter, herunder arbeidsmiljøloven og likestillings- og diskrimineringsloven.</p>
<h3>Arbeidsavtale</h3>
<p>Alle ansatte skal ha en skriftlig arbeidsavtale som oppfyller kravene i arbeidsmiljøloven § 14-6. Avtalen skal foreligge senest én måned etter at arbeidsforholdet begynte.</p>
<h3>Prøvetid</h3>
<p>Det kan avtales prøvetid på inntil 6 måneder. I prøvetiden gjelder en gjensidig oppsigelsestid på 14 dager, med mindre annet er avtalt.</p>
<h3>Opplæring</h3>
<p>Alle nyansatte skal gjennomgå et opplæringsprogram som dekker:</p>
<ul>
<li>Presentasjon av bedriften og organisasjonen</li>
<li>Gjennomgang av personalhåndboken</li>
<li>HMS-opplæring</li>
<li>Stillingsspesifikk opplæring</li>
</ul>`
  },
  {
    title: "Arbeidstid",
    slug: "arbeidstid",
    icon: "Clock",
    sort_order: 2,
    content: `<h2>Arbeidstid</h2>
<h3>Ordinær arbeidstid</h3>
<p>Normal arbeidstid er 37,5 timer per uke eksklusiv lunsj, i henhold til arbeidsmiljøloven. Kjernetid og fleksitid kan avtales nærmere med nærmeste leder.</p>
<h3>Overtid</h3>
<p>Overtid skal være pålagt eller avtalt med nærmeste leder på forhånd. Overtid kompenseres i henhold til arbeidsmiljøloven med et tillegg på minimum 40%.</p>
<h3>Fleksibel arbeidstid</h3>
<p>Bedriften tilbyr fleksibel arbeidstid der dette er forenlig med arbeidsoppgavene. Kjernetid er normalt mellom kl. 09:00 og 15:00.</p>
<h3>Hjemmekontor</h3>
<p>Muligheter for hjemmekontor avtales med nærmeste leder i henhold til bedriftens retningslinjer. Forskrift om arbeid i arbeidstakers hjem gjelder.</p>`
  },
  {
    title: "Lønn og godtgjørelser",
    slug: "lonn",
    icon: "Banknote",
    sort_order: 3,
    content: `<h2>Lønn og godtgjørelser</h2>
<h3>Lønnsutbetaling</h3>
<p>Lønn utbetales den 15. i hver måned. Dersom utbetalingsdagen faller på en helg eller helligdag, utbetales lønnen siste virkedag før.</p>
<h3>Lønnsjustering</h3>
<p>Lønnsforhandlinger gjennomføres årlig, normalt i forbindelse med bedriftens budsjettarbeid. Individuelle lønnsjusteringer vurderes basert på kompetanse, ansvar, prestasjoner og markedssituasjon.</p>
<h3>Reisegodtgjørelse</h3>
<p>Reisegodtgjørelse utbetales i henhold til statens satser ved tjenestereiser godkjent av nærmeste leder. Reiseregninger skal leveres innen 30 dager.</p>
<h3>Telefon og internett</h3>
<p>Ansatte som har behov for mobiltelefon i arbeidet kan få dekket dette etter avtale med leder.</p>`
  },
  {
    title: "Ferie",
    slug: "ferie",
    icon: "Sun",
    sort_order: 4,
    content: `<h2>Ferie</h2>
<h3>Ferierettigheter</h3>
<p>Alle ansatte har rett til ferie i henhold til ferieloven. Normal feriefritid er 25 virkedager (5 uker) per kalenderår. Ansatte over 60 år har rett til en ekstra ferieuke.</p>
<h3>Ferieavvikling</h3>
<p>Arbeidsgiver fastsetter ferietidspunktet etter drøfting med den ansatte. Hovedferien (3 uker sammenhengende) avvikles normalt i perioden 1. juni – 30. september.</p>
<h3>Feriepenger</h3>
<p>Feriepenger beregnes og utbetales i henhold til ferieloven. Satsen er 10,2% av feriepengegrunnlaget (12% ved 5 uker ferie etter tariff/avtale).</p>
<h3>Overføring av ferie</h3>
<p>Inntil 12 virkedager kan overføres til neste år etter skriftlig avtale.</p>`
  },
  {
    title: "Sykefravær",
    slug: "sykefravaer",
    icon: "HeartPulse",
    sort_order: 5,
    content: `<h2>Sykefravær</h2>
<h3>Meldingsplikt</h3>
<p>Ved sykdom skal nærmeste leder varsles så tidlig som mulig første fraværsdag, helst innen arbeidsdagens start.</p>
<h3>Egenmelding</h3>
<p>Ansatte med minst 2 måneders ansettelse kan benytte egenmelding i inntil 3 kalenderdager per sykdomstilfelle. Ved IA-avtale kan det gis utvidet rett til 8 kalenderdager.</p>
<h3>Sykemelding</h3>
<p>Ved fravær utover egenmeldingsperioden kreves sykemelding fra lege. Sykemeldingen skal leveres arbeidsgiver snarest mulig.</p>
<h3>Oppfølging</h3>
<p>Arbeidsgiver følger opp sykmeldte i henhold til arbeidsmiljølovens krav:</p>
<ul>
<li>Oppfølgingsplan innen 4 uker</li>
<li>Dialogmøte 1 innen 7 uker</li>
<li>Dialogmøte 2 (med NAV) innen 26 uker</li>
</ul>
<h3>Barn og barnepassers sykdom</h3>
<p>Ansatte har rett til permisjon ved barns eller barnepassers sykdom i henhold til arbeidsmiljøloven § 12-9.</p>`
  },
  {
    title: "Permisjoner",
    slug: "permisjoner",
    icon: "Calendar",
    sort_order: 6,
    content: `<h2>Permisjoner</h2>
<h3>Lovbestemte permisjoner</h3>
<p>Ansatte har rett til permisjon i henhold til arbeidsmiljølovens bestemmelser, herunder:</p>
<ul>
<li><strong>Foreldrepermisjon:</strong> I henhold til arbeidsmiljøloven kap. 12</li>
<li><strong>Omsorgspermisjon:</strong> 10 dager per år for nødvendig omsorg</li>
<li><strong>Utdanningspermisjon:</strong> Etter 3 års ansettelse, jf. aml. § 12-11</li>
<li><strong>Militærtjeneste:</strong> I henhold til gjeldende lovverk</li>
</ul>
<h3>Velferdspermisjon</h3>
<p>Bedriften gir korttidspermisjon med lønn i forbindelse med:</p>
<ul>
<li>Dødsfall og begravelse i nær familie: inntil 3 dager</li>
<li>Eget bryllup: 1 dag</li>
<li>Flytting: 1 dag per år</li>
<li>Legebesøk som ikke kan legges utenfor arbeidstid</li>
</ul>
<h3>Permisjon uten lønn</h3>
<p>Permisjon uten lønn kan innvilges etter søknad til nærmeste leder og vurderes individuelt.</p>`
  },
  {
    title: "Pensjon og forsikring",
    slug: "pensjon",
    icon: "Shield",
    sort_order: 7,
    content: `<h2>Pensjon og forsikring</h2>
<h3>Tjenestepensjonsordning</h3>
<p>Bedriften har en pensjonsordning som oppfyller kravene i lov om obligatorisk tjenestepensjon. Nærmere informasjon om pensjonsordningen finnes i pensjonsforsikringsavtalen.</p>
<h3>Personalforsikringer</h3>
<p>Bedriften har følgende forsikringer for sine ansatte:</p>
<ul>
<li><strong>Yrkesskadeforsikring:</strong> Lovpålagt, dekker yrkesskade og yrkessykdom</li>
<li><strong>Gruppelivsforsikring:</strong> Utbetaling ved død</li>
<li><strong>Reiseforsikring:</strong> Dekker tjenestereiser</li>
</ul>
<h3>AFP</h3>
<p>Informasjon om avtalefestet pensjon (AFP) gis til den enkelte basert på gjeldende ordning.</p>`
  },
  {
    title: "HMS – Helse, miljø og sikkerhet",
    slug: "hms",
    icon: "ShieldCheck",
    sort_order: 8,
    content: `<h2>HMS – Helse, miljø og sikkerhet</h2>
<h3>Overordnet HMS-policy</h3>
<p>Bedriften skal sikre et fullt forsvarlig arbeidsmiljø i henhold til arbeidsmiljøloven. Alle ansatte har plikt til å medvirke til et godt arbeidsmiljø og følge bedriftens HMS-rutiner.</p>
<h3>Verneombud</h3>
<p>Bedriften har valgt verneombud som ivaretar de ansattes interesser i saker som angår arbeidsmiljøet.</p>
<h3>Arbeidsmiljøutvalg (AMU)</h3>
<p>Bedrifter med minst 50 ansatte skal ha AMU. Utvalget behandler spørsmål som angår bedriftshelsetjenesten og vernetjenesten.</p>
<h3>Varsling</h3>
<p>Ansatte har rett til å varsle om kritikkverdige forhold på arbeidsplassen, jf. arbeidsmiljøloven kap. 2A. Varslingsrutiner finnes i bedriftens HMS-system.</p>
<h3>Bedriftshelsetjeneste</h3>
<p>Bedriften er tilknyttet godkjent bedriftshelsetjeneste som bistår med forebyggende HMS-arbeid.</p>`
  },
  {
    title: "Personalgoder",
    slug: "personalgoder",
    icon: "Gift",
    sort_order: 9,
    content: `<h2>Personalgoder</h2>
<h3>Treningsstøtte</h3>
<p>Bedriften kan tilby støtte til treningsaktiviteter for å fremme god helse blant ansatte. Nærmere vilkår avtales.</p>
<h3>Sosiale arrangementer</h3>
<p>Bedriften arrangerer sosiale sammenkomster gjennom året, inkludert sommerfest, julebord og andre fellesaktiviteter.</p>
<h3>Jubileum</h3>
<p>Ansatte med lang tjenestetid hedres i henhold til bedriftens retningslinjer.</p>
<h3>Kompetanseutvikling</h3>
<p>Bedriften støtter faglig utvikling gjennom kurs, konferanser og videreutdanning etter avtale med leder.</p>`
  },
  {
    title: "IT-retningslinjer",
    slug: "it-retningslinjer",
    icon: "Monitor",
    sort_order: 10,
    content: `<h2>IT-retningslinjer</h2>
<h3>Bruk av bedriftens utstyr</h3>
<p>Bedriftens IT-utstyr og systemer skal primært brukes til arbeidsrelaterte formål. Begrenset privat bruk aksepteres så lenge det ikke påvirker arbeidet eller sikkerheten.</p>
<h3>Datasikkerhet</h3>
<p>Alle ansatte plikter å:</p>
<ul>
<li>Bruke sterke passord og endre dem regelmessig</li>
<li>Ikke dele passord med andre</li>
<li>Låse datamaskinen når den forlates</li>
<li>Rapportere mistenkelige e-poster eller hendelser til IT-ansvarlig</li>
</ul>
<h3>E-post og kommunikasjon</h3>
<p>E-post fra bedriftens domene representerer bedriften og skal brukes profesjonelt. Sensitiv informasjon skal krypteres.</p>
<h3>Sosiale medier</h3>
<p>Ansatte bes om å utvise forsiktighet ved bruk av sosiale medier, og skal ikke dele konfidensiell informasjon om bedriften eller kollegaer.</p>`
  },
  {
    title: "Etikk og adferd",
    slug: "etikk",
    icon: "Scale",
    sort_order: 11,
    content: `<h2>Etikk og adferd</h2>
<h3>Etiske retningslinjer</h3>
<p>Alle ansatte forventes å opptre med integritet, respekt og profesjonalitet. Bedriften har nulltoleranse for:</p>
<ul>
<li>Korrupsjon og bestikkelser</li>
<li>Diskriminering og trakassering</li>
<li>Brudd på taushetsplikt</li>
</ul>
<h3>Taushetsplikt</h3>
<p>Ansatte har taushetsplikt om bedriftens forretningsforhold, kundeinformasjon og andre konfidensielle opplysninger. Taushetsplikten gjelder også etter at arbeidsforholdet er avsluttet.</p>
<h3>Interessekonflikter</h3>
<p>Ansatte skal melde fra om forhold som kan innebære en interessekonflikt mellom private interesser og bedriftens interesser.</p>
<h3>Gaver og representasjon</h3>
<p>Ansatte skal ikke motta gaver eller andre fordeler som kan påvirke, eller oppfattes å påvirke, utøvelsen av arbeidsoppgavene.</p>`
  },
  {
    title: "Varsling",
    slug: "varsling",
    icon: "Bell",
    sort_order: 12,
    content: `<h2>Varsling</h2>
<h3>Rett til å varsle</h3>
<p>Alle ansatte har rett til å varsle om kritikkverdige forhold i virksomheten, jf. arbeidsmiljøloven kapittel 2A.</p>
<h3>Hva kan varsles om?</h3>
<p>Kritikkverdige forhold kan være:</p>
<ul>
<li>Fare for liv og helse</li>
<li>Fare for miljøet</li>
<li>Korrupsjon eller andre økonomiske misligheter</li>
<li>Trakassering eller diskriminering</li>
<li>Brudd på lover, regler eller etiske retningslinjer</li>
</ul>
<h3>Hvordan varsle?</h3>
<p>Varsling kan skje til nærmeste leder, verneombud, tillitsvalgt eller via bedriftens anonyme varslingskanal.</p>
<h3>Vern av varsler</h3>
<p>Det er forbudt å gjengjelde mot arbeidstaker som varsler. Bedriften skal påse at den som varsler ikke utsettes for negative konsekvenser.</p>`
  },
  {
    title: "Kompetanseutvikling",
    slug: "kompetanse",
    icon: "GraduationCap",
    sort_order: 13,
    content: `<h2>Kompetanseutvikling</h2>
<h3>Policy</h3>
<p>Bedriften er opptatt av å utvikle sine ansattes kompetanse for å sikre kvalitet i leveransene og den enkeltes karriereutvikling.</p>
<h3>Kurs og opplæring</h3>
<p>Faglige kurs og opplæring som er relevant for stillingen dekkes av bedriften etter godkjenning fra leder.</p>
<h3>Videreutdanning</h3>
<p>Støtte til videreutdanning kan gis etter individuell vurdering. Det kan inngås utdanningsavtale med bindingstid.</p>
<h3>Medarbeidersamtaler</h3>
<p>Alle ansatte skal ha minimum én årlig medarbeidersamtale med sin leder, der kompetanseutvikling er et sentralt tema.</p>`
  },
  {
    title: "Reise og utlegg",
    slug: "reise",
    icon: "Plane",
    sort_order: 14,
    content: `<h2>Reise og utlegg</h2>
<h3>Tjenestereiser</h3>
<p>Alle tjenestereiser skal godkjennes av nærmeste leder på forhånd. Reiser bestilles i henhold til bedriftens reisepolicy.</p>
<h3>Diettgodtgjørelse</h3>
<p>Ved tjenestereiser med overnatting utbetales diettgodtgjørelse etter statens satser.</p>
<h3>Bilgodtgjørelse</h3>
<p>Ved bruk av egen bil i tjeneste utbetales kjøregodtgjørelse etter statens satser. Kjørebok skal føres.</p>
<h3>Utlegg</h3>
<p>Utlegg i forbindelse med arbeidet refunderes mot kvittering. Utleggsrapport skal sendes inn innen 30 dager.</p>`
  },
  {
    title: "Avslutning av arbeidsforhold",
    slug: "avslutning",
    icon: "LogOut",
    sort_order: 15,
    content: `<h2>Avslutning av arbeidsforhold</h2>
<h3>Oppsigelse</h3>
<p>Oppsigelse fra arbeidstaker eller arbeidsgiver skal være skriftlig. Oppsigelsesfrister følger arbeidsmiljøloven eller individuell avtale.</p>
<h3>Oppsigelsesfrist</h3>
<p>Med mindre annet er avtalt, gjelder følgende oppsigelsesfrister:</p>
<ul>
<li>I prøvetiden: 14 dager</li>
<li>Under 5 års ansettelse: 1 måned</li>
<li>5-10 års ansettelse: 2 måneder</li>
<li>Over 10 års ansettelse: 3 måneder</li>
</ul>
<h3>Avskjed</h3>
<p>Ved grovt pliktbrudd eller vesentlig mislighold kan arbeidsforholdet avsluttes med øyeblikkelig virkning (avskjed), jf. arbeidsmiljøloven § 15-14.</p>
<h3>Sluttattest</h3>
<p>Ansatte som slutter har krav på skriftlig sluttattest i henhold til arbeidsmiljøloven § 15-15.</p>
<h3>Tilbakelevering</h3>
<p>Ved fratredelse skal alt bedriftens utstyr, nøkler, adgangskort og dokumenter returneres.</p>`
  },
  {
    title: "Likestilling og diskriminering",
    slug: "likestilling",
    icon: "Users",
    sort_order: 16,
    content: `<h2>Likestilling og diskriminering</h2>
<h3>Policy</h3>
<p>Bedriften har nulltoleranse for diskriminering og trakassering av enhver art. Alle ansatte har rett til et arbeidsmiljø fritt for diskriminering basert på kjønn, alder, etnisitet, religion, funksjonsevne, seksuell orientering eller andre forhold.</p>
<h3>Tilrettelegging</h3>
<p>Arbeidsgiver skal, så langt det er mulig, tilrettelegge arbeidsplassen for ansatte med særskilte behov.</p>
<h3>Aktivitets- og redegjørelsesplikt</h3>
<p>Bedriften følger opp aktivitets- og redegjørelsesplikten (ARP) i henhold til likestillings- og diskrimineringsloven.</p>`
  },
  {
    title: "Rusmiddelpolitikk",
    slug: "rusmiddel",
    icon: "Ban",
    sort_order: 17,
    content: `<h2>Rusmiddelpolitikk</h2>
<h3>Policy</h3>
<p>Bedriften har en rusmiddelfri arbeidsplass. Bruk av rusmidler som påvirker arbeidsevnen er ikke akseptert. Dette gjelder alkohol, narkotika og medikamenter som påvirker prestasjonsevnen.</p>
<h3>Representasjon</h3>
<p>Ved representasjon og sosiale arrangementer i regi av bedriften skal det utvises moderasjon med alkohol.</p>
<h3>AKAN</h3>
<p>Bedriften følger AKAN-modellen for forebygging og håndtering av rusmiddelproblematikk. Ansatte som opplever problemer med rusmidler oppfordres til å søke hjelp.</p>`
  },
  {
    title: "Arbeidsreglement",
    slug: "arbeidsreglement",
    icon: "Gavel",
    sort_order: 18,
    content: `<h2>Arbeidsreglement</h2>
<h3>Orden og oppførsel</h3>
<p>Alle ansatte forventes å møte presis, utføre arbeidet samvittighetsfullt, og opptre hensynsfullt overfor kollegaer og kunder.</p>
<h3>Fravær</h3>
<p>Alt planlagt fravær skal avtales med nærmeste leder i rimelig tid. Uforutsett fravær meldes inn snarest mulig.</p>
<h3>Bruk av bedriftens eiendeler</h3>
<p>Bedriftens eiendeler og ressurser skal brukes forsvarlig og kun til arbeidsrelaterte formål med mindre annet er avtalt.</p>
<h3>Konsekvenser ved brudd</h3>
<p>Brudd på arbeidsreglementet kan medføre advarsler, og ved gjentatte eller grove brudd, oppsigelse eller avskjed.</p>`
  },
  {
    title: "Kontaktinformasjon",
    slug: "kontakt",
    icon: "Phone",
    sort_order: 19,
    content: `<h2>Kontaktinformasjon</h2>
<h3>Viktige kontaktpunkter</h3>
<ul>
<li><strong>Daglig leder:</strong> [Fyll inn navn og kontaktinfo]</li>
<li><strong>HR-ansvarlig:</strong> [Fyll inn navn og kontaktinfo]</li>
<li><strong>Verneombud:</strong> [Fyll inn navn og kontaktinfo]</li>
<li><strong>Tillitsvalgt:</strong> [Fyll inn navn og kontaktinfo]</li>
<li><strong>Bedriftshelsetjeneste:</strong> [Fyll inn navn og kontaktinfo]</li>
</ul>
<h3>Nødnumre</h3>
<ul>
<li>Brann: 110</li>
<li>Politi: 112</li>
<li>Ambulanse: 113</li>
<li>Giftinformasjon: 22 59 13 00</li>
</ul>`
  }
];
