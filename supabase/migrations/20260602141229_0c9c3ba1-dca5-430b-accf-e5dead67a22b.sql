
INSERT INTO public.company_modules (company_id, module_type, is_active, settings)
VALUES (
  '93a77849-9d38-4675-a174-9ebaaca4ae74',
  'IK_HMS',
  true,
  jsonb_build_object(
    'setupComplete', true,
    'setupSource', 'pdf-import',
    'setupDate', now(),
    'importedBransje', 'Gård og grunnarbeid',
    'industry', 'anlegg'
  )
)
ON CONFLICT (company_id, module_type) DO UPDATE
SET is_active = true,
    settings = public.company_modules.settings || EXCLUDED.settings,
    updated_at = now();

UPDATE public.companies
SET employee_count = 1, brreg_employee_count = 1, updated_at = now()
WHERE id = '93a77849-9d38-4675-a174-9ebaaca4ae74';
