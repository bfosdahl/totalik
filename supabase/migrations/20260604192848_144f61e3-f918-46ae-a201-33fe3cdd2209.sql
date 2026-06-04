
INSERT INTO public.company_modules (company_id, module_type, settings, is_active)
VALUES ('faa77839-79d3-4c52-b2ce-8468e8c334de', 'IK_HMS', '{"industry":"lakkering/overflatebehandling","setupComplete":true}'::jsonb, true)
ON CONFLICT (company_id, module_type) DO UPDATE SET is_active = true, settings = public.company_modules.settings || EXCLUDED.settings, updated_at = now();

UPDATE public.companies SET employee_count = 1 WHERE id = 'faa77839-79d3-4c52-b2ce-8468e8c334de';
