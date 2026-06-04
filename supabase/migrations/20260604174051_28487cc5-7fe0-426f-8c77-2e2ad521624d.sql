INSERT INTO company_modules (company_id, module_type, is_active, settings)
VALUES ('a0bba6e8-ee4d-484a-a89c-ef9325d628f1','IK_HMS', true, '{"industry":"maler/byggtapetsering","setupComplete":true}'::jsonb)
ON CONFLICT (company_id, module_type) DO UPDATE SET is_active=true, settings=EXCLUDED.settings, is_deleted=false, updated_at=now();

UPDATE companies SET employee_count = 1 WHERE id='a0bba6e8-ee4d-484a-a89c-ef9325d628f1';