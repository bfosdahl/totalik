
-- Seed standard IK MAT routines into admin_routine_templates_v2
INSERT INTO public.admin_routine_templates_v2 (title, description, module, subcategory, frequency, purpose, steps, status, is_global_default)
VALUES
  ('Mottakskontroll av varer', 'Rutine for inspeksjon av varer ved mottak', 'ik_mat', 'Varemottak', 'ved_behov',
   'Sikre at alle varer som mottas oppfyller krav til temperatur, emballasje, holdbarhetsdato og visuell kvalitet.',
   '["Kontroller temperatur på kjøle-/frysevarer ved mottak", "Sjekk emballasje for skader eller lekkasjer", "Kontroller holdbarhetsdato - avvis utgåtte varer", "Vurder visuell kvalitet (farge, lukt, konsistens)", "Registrer leverandør, dato og eventuelt avvik", "Returner varer som ikke oppfyller kravene", "Lagre varer korrekt etter FIFO-prinsippet"]'::jsonb,
   'published', true),

  ('Temperaturkontroll', 'Daglig kontroll av temperaturer i kjøle- og fryseutstyr', 'ik_mat', 'Temperatur', 'daglig',
   'Dokumentere at kjøle- og fryseutstyr holder korrekte temperaturer for å sikre mattrygghet.',
   '["Kontroller temperaturen i alle kjøleskap (maks 4°C)", "Kontroller temperaturen i alle frysere (maks -18°C)", "Kontroller temperatur på varmholdt mat (min 60°C)", "Loggfør alle temperaturer i kontrollskjema", "Ved avvik: iverksett tiltak og registrer avvik"]'::jsonb,
   'published', true),

  ('Renholdsplan og rengjøring', 'Rutine for daglig, ukentlig og periodisk renhold', 'ik_mat', 'Renhold', 'daglig',
   'Sikre at alle overflater, utstyr og lokaler holdes rene for å forebygge forurensning av mat.',
   '["Følg daglig renholdsplan for kjøkken og produksjonsområder", "Rengjør arbeidsbenker mellom ulike råvarer", "Vask og desinfiser skjærebrett og kniver", "Ukentlig grundig rengjøring av kjøleutstyr", "Månedlig rengjøring av ventilasjon og vanskelig tilgjengelige områder", "Dokumenter utført renhold i renholdsplan"]'::jsonb,
   'published', true),

  ('Personlig hygiene', 'Rutine for personlig hygiene for ansatte som håndterer mat', 'ik_mat', 'Hygiene', 'daglig',
   'Forebygge kontaminering av mat gjennom god personlig hygiene hos alle som håndterer næringsmidler.',
   '["Vask hender grundig før matproduksjon og mellom arbeidsoppgaver", "Bruk rent arbeidstøy og eventuelt hårfang", "Dekk til sår og kutt med vanntette plaster", "Meld fra ved sykdom (oppkast, diaré, feber)", "Ikke bruk smykker eller klokker ved matproduksjon", "Bruk engangshansker ved behov"]'::jsonb,
   'published', true),

  ('Allergenhåndtering', 'Rutine for håndtering og merking av allergener', 'ik_mat', 'Allergener', 'daglig',
   'Sikre korrekt håndtering, merking og informasjon om allergener for å beskytte forbrukere.',
   '["Hold oppdatert allergenliste for alle retter/produkter", "Merk allergener tydelig i menyer og ved bufféservering", "Unngå kryssforurensning mellom allergenfrie og allergenholdig mat", "Bruk separate redskaper for allergenfri tilberedning", "Informer servitører og betjening om allergener", "Oppdater allergenlisten ved endring av oppskrifter"]'::jsonb,
   'published', true),

  ('FIFO og lagerstyring', 'Rutine for riktig lagring og rotering av varer', 'ik_mat', 'Lagring', 'daglig',
   'Sikre at varer brukes i riktig rekkefølge og lagres korrekt for å minimere svinn og sikre mattrygghet.',
   '["Bruk FIFO-prinsippet: først inn, først ut", "Merk alle varer med mottaksdato", "Plasser nye varer bak eldre varer", "Kontroller holdbarhetsdato regelmessig", "Kast utgåtte varer og dokumenter svinn", "Hold lageret organisert og ryddig"]'::jsonb,
   'published', true),

  ('Avvikshåndtering', 'Rutine for registrering og håndtering av avvik', 'ik_mat', 'Avvik', 'ved_behov',
   'Sikre at alle avvik fra rutiner og krav fanges opp, registreres og korrigeres systematisk.',
   '["Identifiser avviket og beskriv hva som har skjedd", "Iverksett strakstiltak for å begrense skade", "Registrer avviket i avvikssystemet", "Analyser årsaken til avviket", "Planlegg og gjennomfør korrigerende tiltak", "Følg opp at tiltaket har effekt"]'::jsonb,
   'published', true),

  ('Opplæring i mattrygghet', 'Rutine for opplæring av ansatte i næringsmiddelhygiene', 'ik_mat', 'Opplæring', 'aarlig',
   'Sikre at alle ansatte har nødvendig kompetanse om næringsmiddelhygiene og internkontroll.',
   '["Gjennomfør opplæring ved nyansettelser", "Årlig repetisjonskurs i mattrygghet for alle ansatte", "Dokumenter all gjennomført opplæring", "Dekk temane: hygiene, allergener, temperatur, HACCP", "Evaluer opplæringsbehov basert på avvik og endringer", "Gjør opplæringsmateriell tilgjengelig for alle"]'::jsonb,
   'published', true),

  ('Skadedyrkontroll', 'Rutine for forebygging og kontroll av skadedyr', 'ik_mat', 'Skadedyr', 'maanedlig',
   'Forebygge og oppdage skadedyr som kan forurense næringsmidler eller produksjonsområder.',
   '["Inspiser lokaler regelmessig for tegn til skadedyr", "Hold døråpninger og vinduer lukket eller med insektnett", "Lagre avfall i lukkede beholdere", "Kontakt skadedyrfirma ved funn av skadedyr", "Dokumenter inspeksjoner og eventuelle tiltak", "Vedlikehold avtale med profesjonelt skadedyrfirma"]'::jsonb,
   'published', true),

  ('Sporbarhet og tilbaketrekking', 'Rutine for sporbarhet av råvarer og ferdigprodukter', 'ik_mat', 'Sporbarhet', 'ved_behov',
   'Sikre full sporbarhet i alle ledd for rask og effektiv tilbaketrekking ved behov.',
   '["Registrer leverandør og batchnummer ved mottak", "Merk alle produkter med produksjonsdato og batchnummer", "Oppbevar følgesedler og fakturaer systematisk", "Ha prosedyre for varsling av Mattilsynet ved tilbaketrekking", "Gjennomfør årlig øvelse på tilbaketrekking", "Dokumenter sporbarhetskjeden fra mottak til salg/servering"]'::jsonb,
   'published', true);
