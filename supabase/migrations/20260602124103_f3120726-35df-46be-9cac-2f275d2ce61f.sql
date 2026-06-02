UPDATE companies SET brreg_employee_count = 1, employee_count = 1 WHERE id = '0aa4c0d6-59a8-403e-a943-71abfd00b197';

UPDATE company_modules
SET settings = jsonb_build_object(
  'setupComplete', true,
  'setupSource', 'pdf-import',
  'setupDate', now()::text,
  'importedBransje', 'Murerarbeid og bygg/anlegg'
)
WHERE company_id = '0aa4c0d6-59a8-403e-a943-71abfd00b197' AND module_type = 'IK_HMS';