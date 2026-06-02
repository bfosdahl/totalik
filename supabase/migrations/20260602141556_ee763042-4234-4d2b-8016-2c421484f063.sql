
INSERT INTO public.company_modules (company_id, module_type, is_active, settings)
VALUES (
  'c759e868-a999-4e78-a447-f9b5b1937c88',
  'IK_HMS',
  true,
  jsonb_build_object(
    'setupComplete', true,
    'setupSource', 'pdf-import',
    'setupDate', now(),
    'importedBransje', 'Sveising og mekanisk reparasjon',
    'industry', 'verksted'
  )
)
ON CONFLICT (company_id, module_type) DO UPDATE
SET is_active = true,
    settings = public.company_modules.settings || EXCLUDED.settings,
    updated_at = now();
