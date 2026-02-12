
-- Seed standard IK HMS routines into admin_routine_templates_v2
INSERT INTO public.admin_routine_templates_v2 (title, module, status, is_global_default, description, purpose, subcategory, steps, frequency, version)
VALUES
  ('Avviksbehandling', 'ik_hms', 'published', true,
   'Sikre systematisk håndtering av avvik, uønskede hendelser og forbedringsforslag.',
   'Sikre systematisk håndtering av avvik, uønskede hendelser og forbedringsforslag.',
   'HMS-system',
   '[{"title":"Registrer avvik i HMS-systemet"},{"title":"Vurder alvorlighetsgrad"},{"title":"Iverksett strakstiltak ved behov"},{"title":"Analyser årsak"},{"title":"Definer korrigerende tiltak"},{"title":"Følg opp at tiltak blir gjennomført"},{"title":"Avslutt avvik når tiltak er verifisert"}]'::jsonb,
   'Ved behov', 1),

  ('Risikovurdering', 'ik_hms', 'published', true,
   'Identifisere farer og vurdere risiko for å kunne iverksette forebyggende tiltak.',
   'Identifisere farer og vurdere risiko for å kunne iverksette forebyggende tiltak.',
   'HMS-system',
   '[{"title":"Kartlegg arbeidsoppgaver og aktiviteter"},{"title":"Identifiser farer og mulige uønskede hendelser"},{"title":"Vurder konsekvens og sannsynlighet"},{"title":"Beregn risikoverdi"},{"title":"Prioriter tiltak for høy risiko"},{"title":"Dokumenter i risikovurderingsskjema"},{"title":"Gjennomgå årlig eller ved endringer"}]'::jsonb,
   'Årlig', 1),

  ('Opplæring og kompetanse', 'ik_hms', 'published', true,
   'Sikre at alle ansatte har nødvendig kompetanse for å utføre arbeidet sikkert.',
   'Sikre at alle ansatte har nødvendig kompetanse for å utføre arbeidet sikkert.',
   'Ansatte',
   '[{"title":"Kartlegg kompetansebehov for hver stilling"},{"title":"Utarbeid opplæringsplan for nyansatte"},{"title":"Gjennomfør grunnleggende HMS-opplæring"},{"title":"Dokumenter gjennomført opplæring"},{"title":"Følg opp behov for oppfriskning"},{"title":"Oppdater ved endringer i oppgaver"}]'::jsonb,
   'Ved behov', 1),

  ('Vernerunder', 'ik_hms', 'published', true,
   'Kartlegge arbeidsmiljøet systematisk for å avdekke farer og forbedringsområder.',
   'Kartlegge arbeidsmiljøet systematisk for å avdekke farer og forbedringsområder.',
   'HMS-system',
   '[{"title":"Planlegg vernerunde (tidspunkt, områder)"},{"title":"Varsle ansatte i forkant"},{"title":"Gjennomfør befaring med sjekkliste"},{"title":"Dokumenter observasjoner"},{"title":"Registrer avvik som oppdages"},{"title":"Følg opp tiltak fra forrige runde"},{"title":"Arkiver rapport"}]'::jsonb,
   'Årlig', 1),

  ('Førstehjelp og beredskap', 'ik_hms', 'published', true,
   'Sikre rask og riktig respons ved ulykker, skader eller akutte situasjoner.',
   'Sikre rask og riktig respons ved ulykker, skader eller akutte situasjoner.',
   'Sikkerhet',
   '[{"title":"Førstehjelpsutstyr plassert tilgjengelig og merket"},{"title":"Oversikt over førstehjelpere hengt opp"},{"title":"Nødnumre synlig oppslått"},{"title":"Årlig kontroll av utstyr"},{"title":"Opplæring i førstehjelp for utpekte"},{"title":"Øvelser gjennomføres årlig"}]'::jsonb,
   'Årlig', 1),

  ('Brannvern', 'ik_hms', 'published', true,
   'Forebygge brann og sikre trygg evakuering ved brann.',
   'Forebygge brann og sikre trygg evakuering ved brann.',
   'Sikkerhet',
   '[{"title":"Rømningsveier merket og frie"},{"title":"Slukkeutstyr kontrollert årlig"},{"title":"Brannøvelse minst årlig"},{"title":"Nyansatte får brannvernopplæring"},{"title":"Elektrisk anlegg kontrollert"},{"title":"Varme arbeider kun med tillatelse"},{"title":"Møteplass ved evakuering definert"}]'::jsonb,
   'Årlig', 1),

  ('Årlig HMS-gjennomgang', 'ik_hms', 'published', true,
   'Evaluere og forbedre HMS-arbeidet systematisk.',
   'Evaluere og forbedre HMS-arbeidet systematisk.',
   'HMS-system',
   '[{"title":"Gjennomgå HMS-mål og resultater"},{"title":"Vurder status på handlingsplan"},{"title":"Analyser avvik og hendelser"},{"title":"Oppdater risikovurderinger"},{"title":"Vurder rutiner og prosedyrer"},{"title":"Sett mål for neste periode"},{"title":"Dokumenter i årsrapport"}]'::jsonb,
   'Årlig', 1),

  ('Sykefravær og oppfølging', 'ik_hms', 'published', true,
   'Sikre god oppfølging av sykmeldte og forebygge langtidsfravær.',
   'Sikre god oppfølging av sykmeldte og forebygge langtidsfravær.',
   'Ansatte',
   '[{"title":"Kontakt sykmeldt innen 2 uker"},{"title":"Gjennomfør dialogmøte innen 7 uker"},{"title":"Vurder tilrettelegging"},{"title":"Dokumenter oppfølgingsplan"},{"title":"Samarbeid med NAV ved behov"},{"title":"Evaluer arbeidsmiljøfaktorer"}]'::jsonb,
   'Ved behov', 1);
