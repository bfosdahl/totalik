-- Legg til standard inspeksjonsmal for Ferdigbefaring
INSERT INTO ks_inspection_template_seeds (template_name, inspection_type, description, checkpoints)
VALUES (
  'Standard Ferdigbefaring',
  'ferdigbefaring',
  'Systematisk kontroll av ferdig prosjekt før overtakelse',
  '[
    {"checkpoint_text": "Alle rom og områder er gjennomgått og kontrollert", "help_text": "Sjekk at alle rom er ferdigstilt og rengjort"},
    {"checkpoint_text": "Kvalitet på overflater og finish er kontrollert", "help_text": "Kontroller malingskvalitet, fliser, gulv, listverk"},
    {"checkpoint_text": "Tekniske installasjoner fungerer som forutsatt", "help_text": "Test elektriske installasjoner, vann, varme, ventilasjon"},
    {"checkpoint_text": "Dører og vinduer åpner/lukker korrekt", "help_text": "Kontroller funksjon, tetting og låsemekanismer"},
    {"checkpoint_text": "Mål samsvarer med tegninger og beskrivelser", "help_text": "Verifiser kritiske mål mot godkjente tegninger"},
    {"checkpoint_text": "Uteområder er ryddet og ferdigstilt", "help_text": "Sjekk adkomstveier, parkering, grøntområder"},
    {"checkpoint_text": "Bygget er rengjort innvendig og utvendig", "help_text": "Kontroller at bygget er klart for overtakelse"},
    {"checkpoint_text": "Dokumentasjon (FDV, samsvar) er komplett", "help_text": "Bekreft at all nødvendig dokumentasjon er levert"}
  ]'::json
);

-- Legg til standard inspeksjonsmal for Forhåndsbefaring
INSERT INTO ks_inspection_template_seeds (template_name, inspection_type, description, checkpoints)
VALUES (
  'Standard Forhåndsbefaring',
  'forhandsbefaring',
  'Tidlig kontroll 1-4 uker før ferdigstilling for å avdekke feil og mangler',
  '[
    {"checkpoint_text": "Generell gjennomgang av alle rom og områder", "help_text": "Identifiser områder som trenger oppfølging"},
    {"checkpoint_text": "Kontroll av ufullstendig arbeid", "help_text": "Liste opp arbeider som gjenstår før ferdigstillelse"},
    {"checkpoint_text": "Identifisering av synlige feil og mangler", "help_text": "Dokumenter avvik fra tegninger og spesifikasjoner"},
    {"checkpoint_text": "Kvalitetskontroll av utførte arbeider", "help_text": "Sjekk håndverksmessig kvalitet på ferdigstilte deler"},
    {"checkpoint_text": "Fotodokumentasjon av kritiske områder", "help_text": "Ta bilder av områder med mangler eller spesielle forhold"},
    {"checkpoint_text": "Vurdering av fremdrift mot tidsplan", "help_text": "Vurder om restarbeid kan fullføres til avtalt tid"},
    {"checkpoint_text": "Liste over tiltak som må utbedres", "help_text": "Lag prioritert liste over arbeider før ferdigbefaring"},
    {"checkpoint_text": "Avtale frister for utbedring av mangler", "help_text": "Sett realistiske frister for utbedring"}
  ]'::json
);

-- Legg til standard inspeksjonsmal for Sluttbefaring
INSERT INTO ks_inspection_template_seeds (template_name, inspection_type, description, checkpoints)
VALUES (
  'Standard Sluttbefaring',
  'sluttbefaring',
  'Endelig kontroll av at alle mangler fra ferdigbefaring er utbedret',
  '[
    {"checkpoint_text": "Kontroll av utbedrede mangler fra ferdigbefaring", "help_text": "Verifiser at alle registrerte mangler er rettet"},
    {"checkpoint_text": "Siste gjennomgang av hele prosjektområdet", "help_text": "Systematisk kontroll av alle områder en siste gang"},
    {"checkpoint_text": "Kontroll av restpunkter og små-feil", "help_text": "Identifiser eventuelle gjenstående mindre feil"},
    {"checkpoint_text": "Verifisering av tekniske installasjoner", "help_text": "Bekreft at alle systemer fungerer optimalt"},
    {"checkpoint_text": "Kontroll av renhold og rydding", "help_text": "Sjekk at alt er klart for overtakelse"},
    {"checkpoint_text": "Gjennomgang av dokumentasjon og FDV", "help_text": "Bekreft at all dokumentasjon er levert og korrekt"},
    {"checkpoint_text": "Bekreftelse av ferdigstillelse", "help_text": "Bekreft at prosjektet er 100% ferdig"},
    {"checkpoint_text": "Forberedelse til overtakelse", "help_text": "Sikre at alt er klart for formell overtakelse"}
  ]'::json
);

-- Legg til standard inspeksjonsmal for Kundebesøk
INSERT INTO ks_inspection_template_seeds (template_name, inspection_type, description, checkpoints)
VALUES (
  'Standard Kundebesøk',
  'kundebesok',
  'Strukturert gjennomgang med kunde under prosjektperioden',
  '[
    {"checkpoint_text": "Gjennomgang av fremdrift i henhold til tidsplan", "help_text": "Presentér status og gjenstående arbeider"},
    {"checkpoint_text": "Presentasjon av utførte arbeider siden sist", "help_text": "Vis frem ferdigstilte milepæler og delprosjekter"},
    {"checkpoint_text": "Diskusjon av eventuelle endringer eller tillegg", "help_text": "Avklar ønsker om endringer og konsekvenser"},
    {"checkpoint_text": "Kvalitetskontroll av synlige arbeider", "help_text": "La kunde kontrollere kvalitet på pågående arbeid"},
    {"checkpoint_text": "Avklaring av spørsmål og bekymringer", "help_text": "Ta opp kundens spørsmål og gi tilbakemeldinger"},
    {"checkpoint_text": "Dokumentasjon av eventuelle avvik eller ønsker", "help_text": "Registrer alle avtaler og endringsønsker"},
    {"checkpoint_text": "Planlegging av neste møte eller milepæl", "help_text": "Avtale tidspunkt for neste oppfølging"},
    {"checkpoint_text": "Oppsummering og bekreftelse av beslutninger", "help_text": "Sikre felles forståelse av status og veien videre"}
  ]'::json
);

-- Legg til standard inspeksjonsmal for HMS inspeksjon
INSERT INTO ks_inspection_template_seeds (template_name, inspection_type, description, checkpoints)
VALUES (
  'Standard HMS Inspeksjon',
  'hms_inspeksjon',
  'Kontroll av helse, miljø og sikkerhet på byggeplass',
  '[
    {"checkpoint_text": "Personlig verneutstyr er tilgjengelig og brukes", "help_text": "Sjekk hjelm, vernesko, hansker, refleksvest, evt. hørselvern"},
    {"checkpoint_text": "Stilaser og arbeidshøyder er sikret", "help_text": "Kontroller rekkverker, nett, ankerpunkter, fall-sikring"},
    {"checkpoint_text": "Elektrisitet og elektriske verktøy er sikre", "help_text": "Sjekk kabler, jordfeilbrytere, sikring av utstyr"},
    {"checkpoint_text": "Orden og rydding på arbeidsplassen", "help_text": "Kontroller at arbeidsområdet er ryddig og fri for farlige hindringer"},
    {"checkpoint_text": "Farlige stoffer er merket og håndtert korrekt", "help_text": "Sjekk oppbevaring, merking og HMS-datablad"},
    {"checkpoint_text": "Førstehjelpsutstyr og brannslukking tilgjengelig", "help_text": "Verifiser plassering og tilstand på sikkerhetsmateriell"},
    {"checkpoint_text": "Adkomstveier og rømningsveier er frie", "help_text": "Sjekk at nødutganger og fluktruter er tilgjengelige"},
    {"checkpoint_text": "SHA-plan er tilgjengelig og kjent for ansatte", "help_text": "Bekreft at alle kjenner til sikkerhetsplanen"},
    {"checkpoint_text": "Maskiner og verktøy er kontrollert og sikre", "help_text": "Sjekk at utstyr er godkjent og har gyldige kontroller"}
  ]'::json
);

-- Legg til standard inspeksjonsmal for Vernerunde
INSERT INTO ks_inspection_template_seeds (template_name, inspection_type, description, checkpoints)
VALUES (
  'Standard Vernerunde (KS)',
  'vernerunde',
  'Løpende kontroll av utførelse og kvalitet på byggeplass',
  '[
    {"checkpoint_text": "Pågående arbeider følger godkjente tegninger", "help_text": "Sammenlign utførelse med prosjekteringstegninger"},
    {"checkpoint_text": "Materialbruk er i henhold til beskrivelser", "help_text": "Kontroller at spesifiserte materialer og produkter benyttes"},
    {"checkpoint_text": "Fagmessig utførelse og håndverkskvalitet", "help_text": "Vurder om arbeidet holder profesjonell standard"},
    {"checkpoint_text": "Fremdrift i henhold til plan", "help_text": "Sjekk om arbeider er på planlagt tidspunkt"},
    {"checkpoint_text": "Identifisering av feil før de bygges inn", "help_text": "Avdekk kvalitetsavvik tidlig i prosessen"},
    {"checkpoint_text": "Kontroll av dimensjoner og toleranser", "help_text": "Verifiser mål mot tegninger og normer"},
    {"checkpoint_text": "Fotodokumentasjon av utførelse", "help_text": "Ta bilder av viktige arbeider før de skjules"},
    {"checkpoint_text": "Registrering av avvik fra kvalitetskrav", "help_text": "Dokumenter avvik og følg opp utbedring"}
  ]'::json
);