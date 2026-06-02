UPDATE public.company_modules 
SET settings = jsonb_build_object(
  'setupComplete', true,
  'setupSource', 'pdf-import',
  'setupDate', now()::text,
  'importedBransje', 'Malerarbeid og overflatebehandling'
)
WHERE company_id = '0763c3c0-dacf-4015-8df4-16b3040948d3' AND module_type = 'IK_HMS';

UPDATE public.companies 
SET brreg_employee_count = 1, employee_count = 1
WHERE id = '0763c3c0-dacf-4015-8df4-16b3040948d3';