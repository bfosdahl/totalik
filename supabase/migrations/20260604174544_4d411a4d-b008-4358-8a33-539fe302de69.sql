INSERT INTO company_modules (company_id, module_type, is_active, settings) VALUES
 ('ca6c9a62-a9ce-473a-825e-06b35026d385','IK_HMS',true,'{"industry":"bygg/tomrer","setupComplete":true}'::jsonb),
 ('ca6c9a62-a9ce-473a-825e-06b35026d385','KS',true,'{"setupComplete":true}'::jsonb)
ON CONFLICT (company_id, module_type) DO UPDATE SET is_active=true, settings=EXCLUDED.settings, is_deleted=false, updated_at=now();

UPDATE companies SET employee_count = 3 WHERE id='ca6c9a62-a9ce-473a-825e-06b35026d385';