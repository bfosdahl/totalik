
-- Insert the example template
INSERT INTO public.hr_meeting_templates (id, company_id, template_name, meeting_type, is_active)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4d172d1a-ff85-41e4-9178-fc638e2ba292', 'Årlig medarbeidersamtale (standard)', 'medarbeidersamtale', true);

-- Insert all questions
INSERT INTO public.hr_meeting_template_questions (template_id, question_text, question_type, options, sort_order, is_required) VALUES
-- Section 1: Trivsel og arbeidsmiljø
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '1. Trivsel og arbeidsmiljø', 'section_header', null, 0, false),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Hvordan trives du på jobb?', 'multiple_choice', '["Svært godt", "Godt", "Greit", "Mindre bra"]', 1, true),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Hvordan opplever du arbeidsmiljøet? (Samarbeid med kolleger, samarbeid med ledelse, kommunikasjon)', 'text', null, 2, false),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Opplever du at du har tydelige arbeidsoppgaver, tilstrekkelig informasjon og god støtte fra leder?', 'multiple_choice', '["Tydelige arbeidsoppgaver", "Tilstrekkelig informasjon til å gjøre jobben", "God støtte fra leder"]', 3, false),

-- Section 2: Arbeidsoppgaver
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2. Arbeidsoppgaver', 'section_header', null, 4, false),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Hvordan opplever du dine arbeidsoppgaver?', 'multiple_choice', '["Passe utfordrende", "For lite utfordrende", "For krevende"]', 5, true),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Er det arbeidsoppgaver du ønsker mer eller mindre av?', 'text', null, 6, false),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Er det noe som hindrer deg i å gjøre jobben best mulig?', 'text', null, 7, false),

-- Section 3: Kompetanse og utvikling
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '3. Kompetanse og utvikling', 'section_header', null, 8, false),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Opplever du at du har nødvendig kompetanse til jobben?', 'multiple_choice', '["Ja", "Delvis", "Nei"]', 9, true),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Er det kurs eller opplæring du ønsker eller trenger?', 'text', null, 10, false),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Ønsker du å utvikle deg videre i bedriften?', 'multiple_choice', '["Ja", "Nei", "Usikker"]', 11, false),

-- Section 4: HMS og sikkerhet
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4. HMS og sikkerhet', 'section_header', null, 12, false),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Opplever du arbeidet som trygt?', 'multiple_choice', '["Ja", "Delvis", "Nei"]', 13, true),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Har du forslag til forbedringer innen HMS, rutiner, sikkerhet eller arbeidsmetoder?', 'text', null, 14, false),

-- Section 5: Samarbeid og kommunikasjon
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '5. Samarbeid og kommunikasjon', 'section_header', null, 15, false),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Hvordan opplever du kommunikasjonen i bedriften?', 'multiple_choice', '["Svært god", "God", "Kan bli bedre"]', 16, true),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Er det noe vi kan gjøre for å forbedre samarbeidet i bedriften?', 'text', null, 17, false),

-- Section 6: Ledelse
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '6. Ledelse', 'section_header', null, 18, false),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Opplever du at du får tilstrekkelig oppfølging fra leder?', 'multiple_choice', '["Ja", "Delvis", "Nei"]', 19, true),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Hva kan ledelsen gjøre bedre?', 'text', null, 20, false),

-- Section 7: Mål fremover
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '7. Mål fremover', 'section_header', null, 21, false),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Hva er dine mål for det neste året?', 'text', null, 22, false),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Hva kan bedriften gjøre for å støtte deg i dette?', 'text', null, 23, false),

-- Section 8: Tiltak og oppfølging
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '8. Tiltak og oppfølging', 'section_header', null, 24, false),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Beskriv tiltak, ansvarlig og frist', 'text', null, 25, false),

-- Section 9: Oppsummering
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '9. Oppsummering', 'section_header', null, 26, false),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Kort oppsummering av samtalen', 'text', null, 27, false);
