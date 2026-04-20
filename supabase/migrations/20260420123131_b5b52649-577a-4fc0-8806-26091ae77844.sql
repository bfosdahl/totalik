-- 1) Organisering
INSERT INTO public.company_organization (company_id, custom_content, is_custom)
VALUES (
  '31b6e5cd-4bf7-4bb3-87a4-1296be7ebaa0',
  E'<h2>Organisering av HMS-arbeidet</h2><p><strong>Daglig leder / HMS-ansvarlig:</strong> Adrian Stavenes har det øverste ansvaret for HMS i Stavenes Transport AS, inkludert at internkontrollforskriften følges, at risikovurderinger gjennomføres og at avvik håndteres.</p><p><strong>Verneombud:</strong> Velges blant ansatte og deltar aktivt i vernerunder, risikovurderinger og oppfølging av avvik.</p><p><strong>Ansatte:</strong> Plikter å følge rutiner, bruke påkrevd verneutstyr, melde fra om farlige forhold og avvik, samt delta i HMS-arbeidet.</p><p><strong>Bedriftshelsetjeneste:</strong> Bedriften benytter ekstern bedriftshelsetjeneste for helsekontroller og rådgivning.</p>',
  true
)
ON CONFLICT (company_id) DO UPDATE SET custom_content = EXCLUDED.custom_content, is_custom = true, updated_at = now();

-- 2) Risikovurderinger
INSERT INTO public.company_risk_assessments (company_id, risks)
VALUES (
  '31b6e5cd-4bf7-4bb3-87a4-1296be7ebaa0',
  '[
    {"id":"rsk-1","activity":"Transport av farlig gods (ADR)","hazard":"Lekkasje, brann, eksplosjon","probability":2,"consequence":5,"riskScore":10,"existingMeasures":"ADR-godkjente kjøretøy, sjåfører med ADR-bevis, jevnlig vedlikehold","plannedMeasures":"Årlig oppfriskningskurs ADR, kontroll av sikkerhetsutstyr","responsible":"Adrian Stavenes","deadline":""},
    {"id":"rsk-2","activity":"Trafikksikkerhet ved langtransport","hazard":"Trafikkulykker, utforkjøring, tretthet","probability":3,"consequence":4,"riskScore":12,"existingMeasures":"Overholdelse av kjøre- og hviletid, defensiv kjøring","plannedMeasures":"Bruk av fartøysteknologi, oppfølging av kjøremønster","responsible":"Adrian Stavenes","deadline":""},
    {"id":"rsk-3","activity":"Lasting og lossing","hazard":"Klem-/fallskader, tunge løft","probability":3,"consequence":3,"riskScore":9,"existingMeasures":"Bruk av tekniske hjelpemidler, vernesko, hansker","plannedMeasures":"Opplæring i ergonomi","responsible":"Verneombud","deadline":""},
    {"id":"rsk-4","activity":"Vedlikehold av kjøretøy","hazard":"Klemskader, fallende deler, kjemikalier","probability":2,"consequence":3,"riskScore":6,"existingMeasures":"Verkstedrutiner, verneutstyr, stoffkartotek","plannedMeasures":"Oppdatering av stoffkartotek","responsible":"Adrian Stavenes","deadline":""},
    {"id":"rsk-5","activity":"Vinterkjøring og glatte veier","hazard":"Utforkjøring, kollisjon","probability":3,"consequence":4,"riskScore":12,"existingMeasures":"Vinterdekk/kjettinger, vurdering av værforhold","plannedMeasures":"Sjåføropplæring vinterforhold","responsible":"Adrian Stavenes","deadline":""}
  ]'::jsonb
)
ON CONFLICT (company_id) DO UPDATE SET risks = EXCLUDED.risks, updated_at = now();

-- 3) Handlingsplan
INSERT INTO public.company_action_plans (company_id, actions, is_deleted)
VALUES (
  '31b6e5cd-4bf7-4bb3-87a4-1296be7ebaa0',
  '[
    {"id":"act-1","action":"Gjennomføre årlig ADR-oppfriskning for sjåfører","responsible":"Adrian Stavenes","deadline":"2026-06-30","status":"planned","priority":"high"},
    {"id":"act-2","action":"Vernerunde - kontroll av kjøretøy og verksted","responsible":"Verneombud","deadline":"2026-05-15","status":"planned","priority":"medium"},
    {"id":"act-3","action":"Oppdatere stoffkartotek","responsible":"Adrian Stavenes","deadline":"2026-04-30","status":"planned","priority":"medium"},
    {"id":"act-4","action":"HMS-egenerklæring fra alle ansatte","responsible":"Adrian Stavenes","deadline":"2026-05-31","status":"planned","priority":"medium"},
    {"id":"act-5","action":"Gjennomgang av rutiner med ansatte (allmøte HMS)","responsible":"Adrian Stavenes","deadline":"2026-06-15","status":"planned","priority":"high"}
  ]'::jsonb,
  false
)
ON CONFLICT (company_id) DO UPDATE SET actions = EXCLUDED.actions, is_deleted = false, updated_at = now();

-- 4) Systemrevisjon (type='internal' pga CHECK-constraint)
INSERT INTO public.audits (
  company_id, title, description, type, status,
  scheduled_date, responsible_id, responsible_name,
  checklist_completed, checklist_total
) VALUES (
  '31b6e5cd-4bf7-4bb3-87a4-1296be7ebaa0',
  'Systemrevisjon – Migrering fra gammelt system',
  E'Komplett gjennomgang av IK/HMS etter migrering av håndbok (hefte 35) til Total-IK.\n\nGjennomført:\n- 5 risikovurderinger (ADR, trafikksikkerhet, lasting/lossing, vedlikehold, vinterkjøring)\n- 10 rutiner (daglig kjøretøysjekk, kjøre/hviletid, ADR, avvik, verneutstyr, ulykker, vernerunde, nyansatte, kjemikalier, medarbeidersamtaler)\n- 5 handlingsplan-tiltak med ansvarlig og frist\n- Bekreftet 5 HMS-mål\n- Etablert organisasjonsstruktur for HMS-arbeidet\n\nAnbefaling: Adrian gjennomgår alt innhold, justerer ved behov og signerer HMS-egenerklæring.',
  'internal', 'completed',
  CURRENT_DATE,
  '70fedce5-934d-4d57-ae42-261819d27e22',
  'Adrian Stavenes',
  10, 10
);