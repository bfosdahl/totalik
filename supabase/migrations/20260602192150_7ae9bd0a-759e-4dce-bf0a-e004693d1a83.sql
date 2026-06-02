UPDATE companies SET brreg_employee_count = 1, employee_count = 1 WHERE id = 'd1cee403-99f6-45a1-b5ed-6b14a2d06691';
UPDATE company_modules 
SET settings = jsonb_build_object('industry','bygg_anlegg','importedBransje','Snekkerarbeid (43.320)','setupComplete',true,'setupSource','pdf-import'),
    updated_at = now()
WHERE company_id = 'd1cee403-99f6-45a1-b5ed-6b14a2d06691' AND module_type = 'IK_HMS';