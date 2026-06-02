
UPDATE public.companies 
SET brreg_employee_count = 1, employee_count = 1
WHERE id = '4d815e0d-4040-41b3-87e3-edc91f9c7855';

INSERT INTO public.company_modules (company_id, module_type, is_active, settings)
VALUES (
  '4d815e0d-4040-41b3-87e3-edc91f9c7855',
  'IK_HMS',
  true,
  jsonb_build_object(
    'setupComplete', true,
    'setupSource', 'pdf-import',
    'setupDate', now(),
    'importedBransje', 'Trefelling, trepleie og anleggsgartner',
    'industry', 'anlegg'
  )
)
ON CONFLICT (company_id, module_type) DO UPDATE 
SET is_active = true,
    settings = EXCLUDED.settings,
    updated_at = now();
