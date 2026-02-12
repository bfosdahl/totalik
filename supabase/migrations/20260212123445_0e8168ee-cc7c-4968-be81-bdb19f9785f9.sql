
-- Seed DEFAULT_ROUTINES from IK Alkohol into admin_routine_templates_v2
INSERT INTO public.admin_routine_templates_v2 (title, description, module, subcategory, frequency, purpose, steps, legal_refs, target_roles, tags, status, version, is_global_default)
VALUES
  ('Legitimasjonskontroll', 'Rutine for når og hvordan legitimasjon skal kreves', 'ik_alkohol', 'Alderskontroll', 'daglig', 'Sikre korrekt alderskontroll ved salg og servering av alkohol', 
   '[{"text":"Alle som ser ut til å være under 25 år skal alltid spørres om legitimasjon"},{"text":"Godkjent legitimasjon: Norsk pass, førerkort, nasjonalt ID-kort med bilde, bankkort med bilde"},{"text":"Sjekk at bildet stemmer med personen"},{"text":"Kontroller fødselsdato nøye"},{"text":"Sjekk utløpsdato - ugyldig legitimasjon aksepteres ikke"},{"text":"Hold kortet opp mot lyset for å se sikkerhetsmerker"},{"text":"Ved tvil - avvis salg/servering"},{"text":"Ved falsk legitimasjon: noter hendelsen i logg, vurder å kontakte politi"}]'::jsonb,
   '["Alkoholloven § 1-5","Alkoholforskriften"]'::jsonb,
   '{"Bartender","Servitør","Kasserer"}',
   '{"alderskontroll"}',
   'published', 1, true),

  ('Armbånd/stempel ved arrangement', 'Rutine for aldersmerking ved arrangementer', 'ik_alkohol', 'Alderskontroll', 'ved_behov', 'Sikre effektiv alderskontroll ved store arrangementer',
   '[{"text":"Alderskontroll utføres ved inngang"},{"text":"Personer over 18 år får armbånd/stempel"},{"text":"Armbånd skal være vanskelig å fjerne og overføre"},{"text":"Ulike farger for 18+ og 20+ hvis aktuelt"},{"text":"Ingen servering uten armbånd"},{"text":"Armbånd kontrolleres ved hver bestilling"},{"text":"Ødelagt/manglende armbånd = ny legitimasjonskontroll"}]'::jsonb,
   '["Alkoholloven § 1-5"]'::jsonb,
   '{"Dørvakt","Bartender"}',
   '{"event","arrangement"}',
   'published', 1, true),

  ('Identifisering av beruselse', 'Tegn på åpenbar påvirkning og vurdering', 'ik_alkohol', 'Åpenbart påvirket / nekt', 'daglig', 'Identifisere og håndtere åpenbart påvirkede gjester',
   '[{"text":"Fysiske tegn: ustø gange, glassaktige/røde øyne, sløret tale, problemer med motorikk"},{"text":"Atferdsmessige tegn: høylytt, aggressiv, problemer med å fokusere"},{"text":"Gjentatte bestillinger på kort tid"},{"text":"Sovner/dupper av"},{"text":"Ved tvil om påvirkning - stopp servering og konsulter med kollega eller leder"}]'::jsonb,
   '["Alkoholloven § 8-11"]'::jsonb,
   '{"Bartender","Servitør","Vakt"}',
   '{"beruselse","pavirket"}',
   'published', 1, true),

  ('Nektelse av servering/salg', 'Hvordan avvise påvirkede gjester profesjonelt', 'ik_alkohol', 'Åpenbart påvirket / nekt', 'daglig', 'Profesjonell og trygg håndtering av nektelse',
   '[{"text":"Vær alltid rolig, bestemt og høflig"},{"text":"Tilby vann og noe å spise"},{"text":"Tilby å bestille taxi"},{"text":"Sørg for at gjesten kommer seg trygt hjem"},{"text":"Informer kolleger om avslaget"},{"text":"Ved allerede betalt: tilby refusjon eller byttekvittering"},{"text":"Dokumenter i hendelseslogg"}]'::jsonb,
   '["Alkoholloven § 8-11"]'::jsonb,
   '{"Bartender","Servitør"}',
   '{"nektelse","pavirket"}',
   'published', 1, true),

  ('Konfliktnedtrapping', 'Trinnvis håndtering av konfliktsituasjoner', 'ik_alkohol', 'Konflikthåndtering', 'ved_behov', 'Trinnvis og trygg håndtering av konfliktsituasjoner',
   '[{"text":"Trinn 1: Forebygging - vær observant, grip inn tidlig"},{"text":"Trinn 2: De-eskalering - snakk rolig, lytt aktivt, vis forståelse"},{"text":"Trinn 3: Advarsel - gi klar beskjed om konsekvenser"},{"text":"Trinn 4: Bortvisning - gjennomfør rolig og bestemt, dokumenter hendelsen"},{"text":"Trinn 5: Ring vaktselskap/politi ved behov"},{"text":"Prioriter alltid sikkerheten til ansatte og andre gjester"}]'::jsonb,
   '["Arbeidsmiljøloven § 4-3"]'::jsonb,
   '{"Bartender","Servitør","Vakt","Leder"}',
   '{"konflikt","sikkerhet"}',
   'published', 1, true),

  ('Bemanning i høyrisikoperioder', 'Ekstra tiltak ved høy aktivitet', 'ik_alkohol', 'Risikoperioder / drift', 'ved_behov', 'Sikre tilstrekkelig bemanning og kontroll i perioder med høy risiko',
   '[{"text":"Høyrisikoperioder: fredag/lørdag kveld, julebordsesong, nyttårsaften, sportsarrangementer, festivaler"},{"text":"Økt bemanning (minimum 2 på bar)"},{"text":"Dedikert dørvakt/ordensvakt"},{"text":"Hyppigere runder i lokalet"},{"text":"Kortere intervaller mellom serveringsstopp-vurderinger"},{"text":"Ledelse/styrer tilgjengelig på telefon"},{"text":"Maks 2 shots per person per bestilling"},{"text":"Ingen runder til bordet uten alderskontroll av alle"}]'::jsonb,
   '["Alkoholloven § 4-7"]'::jsonb,
   '{"Leder","Bartender","Vakt"}',
   '{"risikoperioder","bemanning"}',
   'published', 1, true),

  ('Påkrevd skilting', 'Obligatoriske oppslag og informasjon', 'ik_alkohol', 'Skilting og informasjon', 'aarlig', 'Sikre at all påkrevd informasjon er synlig for gjester og ansatte',
   '[{"text":"Ved inngang: krav om legitimasjon, nektelse av berusede"},{"text":"I serveringsområdet: aldersgrense 18/20 år, falskt ID anmeldes"},{"text":"Ved kasse: aldersgrense for alkoholsalg, salgstider"},{"text":"Interne oppslag: rutinekort for legitimasjonskontroll"},{"text":"Kontaktliste: styrer, vakt, politi, ambulanse"},{"text":"Eskaleringsprosedyre"}]'::jsonb,
   '["Alkoholloven § 1-5","Alkoholforskriften"]'::jsonb,
   '{"Leder","Styrer"}',
   '{"skilting","informasjon"}',
   'published', 1, true),

  ('Årlig revisjon av internkontroll', 'Gjennomgang og oppdatering av IK-system', 'ik_alkohol', 'Dokumentasjon og revisjon', 'aarlig', 'Sikre at internkontrollsystemet er oppdatert og etterlevd',
   '[{"text":"Deltakere: daglig leder, styrer/stedfortreder, HMS-ansvarlig"},{"text":"Er alle rutiner oppdaterte og relevante?"},{"text":"Har det vært hendelser som krever rutineendring?"},{"text":"Er all opplæring gjennomført?"},{"text":"Er bevillingsdokumenter oppdatert?"},{"text":"Dokumenter dato, deltakere, endringer gjort, signatur"},{"text":"Revisjonslogg oppbevares i minimum 3 år"},{"text":"Tilgjengelig for kommunal kontroll"}]'::jsonb,
   '["Alkoholloven § 1-9","Alkoholforskriften kap. 8"]'::jsonb,
   '{"Daglig leder","Styrer"}',
   '{"revisjon","dokumentasjon"}',
   'published', 1, true);
