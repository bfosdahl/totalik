
-- Template 2: 14-dagers samtale med ny medarbeider
INSERT INTO public.hr_meeting_templates (id, company_id, template_name, meeting_type, is_active)
VALUES ('b2c3d4e5-f6a7-8901-bcde-f12345678901', '4d172d1a-ff85-41e4-9178-fc638e2ba292', '14-dagers samtale (ny medarbeider)', 'medarbeidersamtale', true);

INSERT INTO public.hr_meeting_template_questions (template_id, question_text, question_type, options, sort_order, is_required) VALUES
('b2c3d4e5-f6a7-8901-bcde-f12345678901', '1. Mottak og oppstart', 'section_header', null, 0, false),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Hvordan opplevde du de første dagene på jobb?', 'text', null, 1, true),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Har du fått tilstrekkelig opplæring så langt?', 'multiple_choice', '["Ja", "Delvis", "Nei"]', 2, true),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Har du fått tilgang til nødvendig utstyr og verktøy?', 'multiple_choice', '["Ja", "Delvis", "Nei"]', 3, true),

('b2c3d4e5-f6a7-8901-bcde-f12345678901', '2. Arbeidsmiljø og kollegaer', 'section_header', null, 4, false),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Hvordan opplever du arbeidsmiljøet?', 'multiple_choice', '["Svært godt", "Godt", "Greit", "Mindre bra"]', 5, true),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Føler du deg velkommen og inkludert?', 'multiple_choice', '["Ja", "Delvis", "Nei"]', 6, true),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Har du blitt kjent med kollegene dine?', 'text', null, 7, false),

('b2c3d4e5-f6a7-8901-bcde-f12345678901', '3. Arbeidsoppgaver', 'section_header', null, 8, false),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Er arbeidsoppgavene slik du forventet?', 'multiple_choice', '["Ja", "Delvis", "Nei"]', 9, true),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Har du forstått hva som forventes av deg i rollen?', 'multiple_choice', '["Ja", "Delvis", "Nei"]', 10, true),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Er det noe du trenger hjelp med eller lurer på?', 'text', null, 11, false),

('b2c3d4e5-f6a7-8901-bcde-f12345678901', '4. HMS og sikkerhet', 'section_header', null, 12, false),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Har du fått HMS-opplæring?', 'multiple_choice', '["Ja", "Delvis", "Nei"]', 13, true),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Vet du hvem som er verneombud og HMS-ansvarlig?', 'multiple_choice', '["Ja", "Nei"]', 14, false),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Føler du deg trygg på arbeidsplassen?', 'multiple_choice', '["Ja", "Delvis", "Nei"]', 15, true),

('b2c3d4e5-f6a7-8901-bcde-f12345678901', '5. Videre oppfølging', 'section_header', null, 16, false),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Hva trenger du mest støtte med fremover?', 'text', null, 17, false),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Er det noe annet du ønsker å ta opp?', 'text', null, 18, false);

-- Template 3: Oppfølgingssamtale (prøvetid)
INSERT INTO public.hr_meeting_templates (id, company_id, template_name, meeting_type, is_active)
VALUES ('c3d4e5f6-a7b8-9012-cdef-123456789012', '4d172d1a-ff85-41e4-9178-fc638e2ba292', 'Oppfølgingssamtale (prøvetid)', 'medarbeidersamtale', true);

INSERT INTO public.hr_meeting_template_questions (template_id, question_text, question_type, options, sort_order, is_required) VALUES
('c3d4e5f6-a7b8-9012-cdef-123456789012', '1. Generell trivsel', 'section_header', null, 0, false),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Hvordan trives du i jobben så langt?', 'multiple_choice', '["Svært godt", "Godt", "Greit", "Mindre bra"]', 1, true),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Samsvarer jobben med forventningene du hadde?', 'multiple_choice', '["Ja", "Delvis", "Nei"]', 2, true),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Kommentarer til trivsel', 'text', null, 3, false),

('c3d4e5f6-a7b8-9012-cdef-123456789012', '2. Kompetanse og mestring', 'section_header', null, 4, false),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Føler du at du mestrer arbeidsoppgavene?', 'multiple_choice', '["Ja", "Delvis", "Nei"]', 5, true),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Har du fått tilstrekkelig opplæring og veiledning?', 'multiple_choice', '["Ja", "Delvis", "Nei"]', 6, true),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Er det områder du trenger mer opplæring?', 'text', null, 7, false),

('c3d4e5f6-a7b8-9012-cdef-123456789012', '3. Samarbeid og kommunikasjon', 'section_header', null, 8, false),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Hvordan fungerer samarbeidet med kollegene?', 'multiple_choice', '["Svært godt", "Godt", "Kan bli bedre"]', 9, true),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Får du tilstrekkelig tilbakemelding på arbeidet ditt?', 'multiple_choice', '["Ja", "Delvis", "Nei"]', 10, true),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Kommentarer til samarbeid', 'text', null, 11, false),

('c3d4e5f6-a7b8-9012-cdef-123456789012', '4. Leders vurdering', 'section_header', null, 12, false),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Faglig utvikling i prøvetiden', 'rating', null, 13, true),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Samarbeidsevne', 'rating', null, 14, true),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Selvstendighet', 'rating', null, 15, true),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Punktlighet og pålitelighet', 'rating', null, 16, true),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Kommentarer fra leder', 'text', null, 17, false),

('c3d4e5f6-a7b8-9012-cdef-123456789012', '5. Videre plan', 'section_header', null, 18, false),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Anbefaling etter prøvetid', 'multiple_choice', '["Bestått prøvetid", "Forlenget prøvetid", "Ikke bestått"]', 19, true),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Tiltak og mål for neste periode', 'text', null, 20, false),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Oppsummering', 'text', null, 21, false);

-- Template 4: Slutt-samtale (avslutning av arbeidsforhold)
INSERT INTO public.hr_meeting_templates (id, company_id, template_name, meeting_type, is_active)
VALUES ('d4e5f6a7-b8c9-0123-defa-234567890123', '4d172d1a-ff85-41e4-9178-fc638e2ba292', 'Sluttsamtale', 'medarbeidersamtale', true);

INSERT INTO public.hr_meeting_template_questions (template_id, question_text, question_type, options, sort_order, is_required) VALUES
('d4e5f6a7-b8c9-0123-defa-234567890123', '1. Bakgrunn for avslutning', 'section_header', null, 0, false),
('d4e5f6a7-b8c9-0123-defa-234567890123', 'Hva er hovedårsaken til at du slutter?', 'multiple_choice', '["Ny jobb", "Utdanning", "Flytting", "Arbeidsmiljø", "Lønn/vilkår", "Personlige årsaker", "Annet"]', 1, true),
('d4e5f6a7-b8c9-0123-defa-234567890123', 'Utdyp gjerne årsaken', 'text', null, 2, false),

('d4e5f6a7-b8c9-0123-defa-234567890123', '2. Opplevelse av arbeidsplassen', 'section_header', null, 3, false),
('d4e5f6a7-b8c9-0123-defa-234567890123', 'Hvordan har du trivdes hos oss totalt sett?', 'multiple_choice', '["Svært godt", "Godt", "Greit", "Mindre bra"]', 4, true),
('d4e5f6a7-b8c9-0123-defa-234567890123', 'Hva har vært det beste med å jobbe her?', 'text', null, 5, false),
('d4e5f6a7-b8c9-0123-defa-234567890123', 'Hva kunne vært bedre?', 'text', null, 6, false),

('d4e5f6a7-b8c9-0123-defa-234567890123', '3. Ledelse og oppfølging', 'section_header', null, 7, false),
('d4e5f6a7-b8c9-0123-defa-234567890123', 'Hvordan opplevde du ledelsen?', 'multiple_choice', '["Svært god", "God", "Kan bli bedre", "Dårlig"]', 8, true),
('d4e5f6a7-b8c9-0123-defa-234567890123', 'Fikk du tilstrekkelig oppfølging og tilbakemelding?', 'multiple_choice', '["Ja", "Delvis", "Nei"]', 9, false),

('d4e5f6a7-b8c9-0123-defa-234567890123', '4. Forbedringer', 'section_header', null, 10, false),
('d4e5f6a7-b8c9-0123-defa-234567890123', 'Har du forslag til forbedringer for bedriften?', 'text', null, 11, false),
('d4e5f6a7-b8c9-0123-defa-234567890123', 'Ville du anbefalt oss som arbeidsgiver?', 'multiple_choice', '["Ja, absolutt", "Ja, med forbehold", "Usikker", "Nei"]', 12, true),
('d4e5f6a7-b8c9-0123-defa-234567890123', 'Er det noe annet du ønsker å si?', 'text', null, 13, false),

('d4e5f6a7-b8c9-0123-defa-234567890123', '5. Praktisk avslutning', 'section_header', null, 14, false),
('d4e5f6a7-b8c9-0123-defa-234567890123', 'Er følgende levert tilbake?', 'multiple_choice', '["Nøkler/adgangskort", "Arbeidsutstyr", "Telefon/PC", "Arbeidsklær", "Annet utstyr"]', 15, false),
('d4e5f6a7-b8c9-0123-defa-234567890123', 'Oppsummering og avsluttende kommentar', 'text', null, 16, false);
