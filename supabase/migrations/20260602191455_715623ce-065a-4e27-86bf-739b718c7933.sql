UPDATE public.company_modules
SET settings = jsonb_build_object(
  'industry', 'bygg_anlegg',
  'importedBransje', 'Bygg og vedlikehold',
  'setupComplete', true,
  'setupSource', 'pdf-import'
),
updated_at = now()
WHERE company_id = '1543ae71-c402-4b52-b4d8-7426c3ed3293' AND module_type = 'IK_HMS';