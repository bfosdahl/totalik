UPDATE companies SET brreg_employee_count = 1, employee_count = 1 WHERE id = 'd40a96ca-0cbd-444e-bad9-0455acbe3131';

INSERT INTO company_modules (company_id, module_type, is_active, settings)
VALUES ('d40a96ca-0cbd-444e-bad9-0455acbe3131', 'IK_HMS', true,
  jsonb_build_object('setupComplete', true, 'setupSource', 'pdf-import', 'setupDate', now(), 'importedBransje', 'Bygg og håndverk', 'industry', 'bygg'))
ON CONFLICT (company_id, module_type) DO UPDATE SET is_active = true, settings = EXCLUDED.settings;