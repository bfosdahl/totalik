UPDATE companies SET brreg_employee_count = 1, employee_count = 1 WHERE id = 'bc9ac878-fac3-4609-ab03-143c91f359d0';

INSERT INTO company_modules (company_id, module_type, is_active, settings)
VALUES ('bc9ac878-fac3-4609-ab03-143c91f359d0', 'IK_HMS', true,
  jsonb_build_object('setupComplete', true, 'setupSource', 'pdf-import', 'setupDate', now(), 'importedBransje', 'Generelt', 'industry', 'general'))
ON CONFLICT (company_id, module_type) DO UPDATE SET is_active = true, settings = EXCLUDED.settings;