UPDATE companies SET brreg_employee_count = 1, employee_count = 1 WHERE id = 'ab7dd94f-fa29-493c-8a17-282cfd27d23b';
INSERT INTO company_modules (company_id, module_type, is_active, settings)
VALUES ('ab7dd94f-fa29-493c-8a17-282cfd27d23b', 'IK_HMS', true, jsonb_build_object('industry','bygg_anlegg','importedBransje','Tømrer/snekring/maling/flislegging','setupComplete',true,'setupSource','pdf-import'))
ON CONFLICT (company_id, module_type) DO UPDATE SET is_active = true, settings = EXCLUDED.settings, updated_at = now();