
INSERT INTO public.company_modules (company_id, module_type, is_active, settings)
VALUES (
  '314b17d3-364c-4673-b823-5f81db51aaf2',
  'IK_HMS',
  true,
  jsonb_build_object(
    'setupComplete', true,
    'setupSource', 'pdf-import',
    'setupDate', now()::text,
    'importedBransje', 'Drift av pub og bar',
    'industry', 'servering'
  )
)
ON CONFLICT (company_id, module_type) DO UPDATE
SET is_active = true,
    settings = EXCLUDED.settings,
    updated_at = now();

INSERT INTO public.company_modules (company_id, module_type, is_active, settings)
VALUES (
  '314b17d3-364c-4673-b823-5f81db51aaf2',
  'IK_ALKOHOL',
  true,
  jsonb_build_object(
    'setupComplete', false,
    'setupSource', 'manual',
    'note', 'Modul aktivert; oppsett må fullføres manuelt.'
  )
)
ON CONFLICT (company_id, module_type) DO UPDATE
SET is_active = true,
    updated_at = now();

UPDATE public.companies
SET employee_count = 10,
    updated_at = now()
WHERE id = '314b17d3-364c-4673-b823-5f81db51aaf2';
