UPDATE companies
SET brreg_employee_count = 1, employee_count = 1
WHERE id = '3c946754-9c88-4604-ba88-aea189c27899';

INSERT INTO company_modules (company_id, module_type, is_active, settings)
VALUES (
  '3c946754-9c88-4604-ba88-aea189c27899',
  'IK_HMS',
  true,
  jsonb_build_object('industry','service','setupComplete',true,'setupSource','pdf-import','importedBransje','Service')
)
ON CONFLICT (company_id, module_type) DO UPDATE
SET is_active = true, settings = EXCLUDED.settings, updated_at = now();

INSERT INTO company_modules (company_id, module_type, is_active, settings)
VALUES (
  '3c946754-9c88-4604-ba88-aea189c27899',
  'IK_MAT',
  true,
  jsonb_build_object('setupComplete',false,'setupSource','manual')
)
ON CONFLICT (company_id, module_type) DO UPDATE
SET is_active = true, updated_at = now();