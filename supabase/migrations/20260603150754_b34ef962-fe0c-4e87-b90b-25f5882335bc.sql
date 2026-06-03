INSERT INTO public.company_modules (company_id, module_type, is_active, settings)
VALUES ('89874ff8-d688-4944-85e6-1a5e9bca0f69', 'IK_HMS', true, '{"setupComplete": true, "industry": "bygg", "importedBransje": "Bygg/Anlegg"}'::jsonb)
ON CONFLICT DO NOTHING;

UPDATE public.companies
SET brreg_employee_count = 1, employee_count = 1
WHERE id = '89874ff8-d688-4944-85e6-1a5e9bca0f69';