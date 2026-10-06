// Nøyaktig kart over menyen i Total-IK. Brukes av HMS Proffen, Bygg Proffen og
// Oppsett-hjelperen slik at chatene alltid oppgir veier som faktisk finnes.
// Vedlikehold: hold denne i takt med src/components/layout/AppSidebar.tsx,
// src/components/ks2/Ks2ProjectSidebar.tsx og rutene i src/App.tsx.

export const NAV_MAP = `**SLIK ER MENYEN BYGGET (menyen til venstre, gruppeoverskrifter med fet skrift)**

Øverst: «Dashboard» (/), «Brukerveiledning» (/brukerveiledning), «Innstillinger» (/settings).

**IK/HMS**
- «Oppsett» (/setup)
- «Målsetting» (/maalsetting)
- «Organisering» (/organisering)
- «Risikoanalyse» (/risikoanalyse) – undersider: «Risikovurdering & Handlingsplan» (/risikoanalyse), «Oppfølging» (/risikoanalyse?tab=oppfolging), «SJA» (/risikoanalyse?tab=sja)
- «Rutiner» (/rutiner)
- «Stoffkartotek» (/stoffkartotek)
- «Lover og forskrifter» (/lover-og-forskrifter)
- «Avvik» (/deviations)
- «HMS aktiviteter» (/audits) – vernerunder, internrevisjoner, årshjul
- «Håndbok» (/handbook)
- «Dokumentsenter» (/dokumentsenter)
- «HMS Assistent» (/hms-chat)

**Personaladministrasjon** – gruppen «Mine ansatte» (kun leder/admin):
- «Ansattoversikt» (/employees)
- «Ansettelsesavtaler» (/hr/contracts)
- «Fravær» (/hr/absence)
- «Utstyr og klær» (/hr/utstyr)
- «Medarbeidersamtaler» (/hr/meetings)
- «Undersøkelser» (/hr/surveys)
- «Godkjenn ferie» (/time-off?view=admin)
- «Arbeidsplan» (/work-schedule)
- «Søndagsrapport (AML §10-8)» (/hr/sondagsrapport)
- «Godkjenn timer» (/time-registration?view=admin)
- «Timeføring» (/time-registration)
- «Timeoversikt» (/timer/oversikt)
- «Personalliste (Skatteetaten)» (/personalliste)
- «Anonyme meldinger» (/anonymous-messages)

**Personaladministrasjon** – gruppen «Mitt arbeidsforhold» (alle ansatte):
- «Min arbeidsavtale» (/my/contract)
- «Mine timer» (/time-registration)
- «Min ferie» (/time-off)
- «Mitt fravær» (/my/absence)
- «Min respons» (/my/surveys)
- «Meldinger» (/my/messages)
- «Send anonym melding» (knapp i menyen)
- «Kjørebok» (/my/driving-log) – også utlegg/reiseregning og GPS/geofence
- «Mitt ansattkort» (/my/employee-card)

**KS Bygg** – gruppen «IK/KS Grunnlag»:
- «Målsetting & Kvalitetsmål» (/ks/ik-ks/maalsetting)
- «Organisasjonsplan» (/ks/ik-ks/organisering)
- «Rutiner» (/ks/ik-ks/rutiner)
- «Dokumentsenter» (/ks/ik-ks/dokumenter)
- «Sjekklistemaler» (/ks/ik-ks/sjekklister)
- «Egenerklæring» (/ks/ik-ks/egenerklaering)
- «KS Håndbok» (/ks/ik-ks/handbok)

**KS Bygg** – hovedmenyen:
- «Mine prosjekter» (/ks)
- «Kunder» (/ks/kunder)
- «Oppsett-hjelper» (/ks/oppsett)
- «Utfylte sjekklister» (/ks/utfylte-sjekklister)
- «Befaring» (/ks/befaring)
- «Kalkyler» (/ks/kalkyler)
- «Dagsrapporter (admin)» (/ks/dagsrapport-oversikt)
- «Statistikk» (/ks/statistikk)
- «Prosjekt-hub» (/prosjekt-hub)
- «Småprosjekter» (/ks/smaaprosjekter)

**IK/MAT**
- «Oppsett» (/ik-mat/oppsett), «Håndbok» (/ik-mat/handbok), «Målsetting» (/ik-mat/maal), «Organisasjonskart» (/ik-mat/organisasjon), «Risiko & tiltak» (/ik-mat/risiko-og-tiltak), «Rutiner» (/ik-mat/rutiner), «Kontroll» (/ik-mat/kontroll), «Sensorer» (/ik-mat/sensorer), «Avvik» (/ik-mat/avvik), «Allergener» (/ik-mat/allergener), «Kjøkkenplan» (/ik-mat/kjokkenplan), «Faste avtaler» (/ik-mat/faste-avtaler), «Dokumentsenter» (/ik-mat/dokumentsenter)
- Temperaturlogg (/ik-mat/temperaturlogg), Sporbarhet (/ik-mat/sporbarhet), Renholdsplan (/ik-mat/renholdsplan), Sjekklister (/ik-mat/sjekklister)

**IK/Alkohol**
- «Oversikt» (/ik-alkohol), «Rutiner» (/ik-alkohol/rutiner), «Organisering» (/ik-alkohol/organisering), «Målsetting» (/ik-alkohol/maal), «Risikoanalyse» (/ik-alkohol/risikoanalyse), «Internkontroll» (/ik-alkohol/internkontroll), «Kontroll» (/ik-alkohol/kontroll), «Hendelser» (/ik-alkohol/hendelser), «Lovverk» (/ik-alkohol/lovverk), «Dokumentsenter» (/ik-alkohol/dokumentsenter), «Håndbok» (/ik-alkohol/handbok)

**IK/FDV**
- «Oversikt» (/fdv), «Bygg & Eiendommer» (/fdv/bygg), «Kontroller» (/fdv/kontroller), «Risikovurdering» (/fdv/risiko), «Regelverk» (/fdv/regelverk), «Etasjeplaner» (/fdv/etasjeplaner)

**Personalhåndbok** (/personalhandbok)

**Viktige regler for hvor ting finnes**
- Alt som hører til ett byggeprosjekt ligger INNE I prosjektet: åpne «KS Bygg» → «Mine prosjekter» → prosjektet. Der fins sjekklister, avvik, SJA, dagsrapport, bilder, SHA-plan, byggesak og økonomi.
- Oppslagstavlen ligger på «Dashboard» (/), ikke i en egen menypunkt.
- Kurs og kursbevis: «Mitt kursbevis» / mine kurs (=/my-courses).
- Moduler bedriften ikke har kjøpt ligger nederst i menyen under «Flere moduler». Ser brukeren ikke en modul, har bedriften den trolig ikke, eller brukeren mangler rettighet (vanlige ansatte ser ikke gruppen «Mine ansatte»).
- Bruk ALDRI navn som ikke finnes i menyen: ikke «KS-modul», ikke «HR / Ansatte», ikke «IK-Mat», ikke «/ks2/...». Si «KS Bygg», «Personaladministrasjon» og «IK/MAT».
- Oppgi alltid veien nøyaktig som over, med gruppene og navnene i anførselstegn, og si om det er leder/admin eller vanlig ansatt som ser den.`;

// Fanene inne i et byggeprosjekt: /ks/project/<id> + sti
export const KS_PROJECT_NAV_MAP = `**FANENE INNE I ET BYGGEPROSJEKT** (åpnes via «KS Bygg» → «Mine prosjekter» → prosjektet)

- «Dashboard» (forsiden i prosjektet)
- «Prosjekt-assistent» (/chat) – chat-hjelperen for dette prosjektet
- Kvalitetssikring: «Sjekklister & egenkontroller» (/sjekklister), «KS-avvik» (/avvik)
- HMS / SHA: «HMS-dashboard» (/hms), «HMS-plan» (/hms/hms-plan), «SHA-plan» (/hms/sha-plan), «SJA» (/hms/sja), «Vernerunder & RUH» (/hms/vernerunder), «HMS-avvik» (/hms/avvik), «Stoffkartotek» (/hms/stoffkartotek), «Riggplan» (/hms/riggplan)
- Byggesak & Blanketter: «Byggesak-oversikt» (/byggesak), «Blanketter» (/byggesak/blanketter), «E-post utsending» (/byggesak/epost)
- Prosjektstyring: «Prosjektinfo» (/prosjektinfo), «Fremdriftsplan» (/fremdriftsplan), «Dagsrapporter» (/dagsrapport), «Timeregistrering» (/timeregistrering), «Mannskapsliste» (/mannskap), «Møtereferater» (/motereferater)
- Økonomi: «Økonomi» (/okonomi), «Endringsmeldinger» (/endringsmeldinger), «Reklamasjoner» (/reklamasjoner)
- Partnere: «Underleverandører» (/underleverandorer)
- Dokumenter og arkiv: «Dokumentasjon & FDV» (/dokumentasjon), «Rutinebank» (/rutiner), «Malbibliotek» (/maler), «Prosjektrapport» (/rapport), «Bilder» (/bilder), «Notater» (/notater), «Befaringer» (/befaringer)

Alt prosjektarbeid gjøres inne i prosjektet. Brukeren trenger sjelden å gå ut til bedriftens hovedmeny.`;
