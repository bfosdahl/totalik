
INSERT INTO public.company_modules (company_id, module_type, is_active, settings)
VALUES (
  '92627636-850c-4e1c-8d0f-59aeae0f0885',
  'IK_HMS',
  true,
  jsonb_build_object(
    'setupComplete', true,
    'setupSource', 'pdf-import',
    'setupDate', now()::text,
    'importedBransje', 'Godstransport på vei',
    'industry', 'transport'
  )
)
ON CONFLICT (company_id, module_type) DO UPDATE
SET is_active = true,
    settings = EXCLUDED.settings,
    updated_at = now();

UPDATE public.companies
SET employee_count = 1,
    brreg_employee_count = 1,
    updated_at = now()
WHERE id = '92627636-850c-4e1c-8d0f-59aeae0f0885';
