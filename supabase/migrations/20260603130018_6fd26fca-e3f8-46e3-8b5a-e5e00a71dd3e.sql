
INSERT INTO public.company_modules (company_id, module_type, is_active, settings)
VALUES
  ('1b3fc4f5-c311-4484-9621-63aa56cb2221','IK_HMS',true, '{"industry":"bygg","importedBransje":"Bygg","setupComplete":true}'::jsonb),
  ('1b3fc4f5-c311-4484-9621-63aa56cb2221','IK_BYGG',true,'{"importedBransje":"Bygg","setupComplete":true}'::jsonb),
  ('1b3fc4f5-c311-4484-9621-63aa56cb2221','KS',true,    '{"importedBransje":"Bygg","setupComplete":true}'::jsonb)
ON CONFLICT DO NOTHING;

UPDATE public.companies
SET brreg_employee_count = 1, employee_count = 1
WHERE id = '1b3fc4f5-c311-4484-9621-63aa56cb2221';
