
UPDATE public.companies 
SET brreg_employee_count = 1, employee_count = 1
WHERE id = '4f53c1aa-23aa-4745-bfc3-f581a9d37601';

INSERT INTO public.company_modules (company_id, module_type, is_active, settings)
VALUES (
  '4f53c1aa-23aa-4745-bfc3-f581a9d37601',
  'IK_HMS',
  true,
  jsonb_build_object(
    'setupComplete', true,
    'setupSource', 'pdf-import',
    'setupDate', now(),
    'importedBransje', 'Bygg og renovering',
    'industry', 'bygg'
  )
)
ON CONFLICT (company_id, module_type) DO UPDATE 
SET is_active = true,
    settings = EXCLUDED.settings,
    updated_at = now();
