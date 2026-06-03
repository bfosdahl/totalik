INSERT INTO company_modules (company_id, module_type, is_active, settings)
VALUES (
  'f7e97668-2b53-4c67-b608-2dc8c4d04670',
  'IK_BYGG',
  true,
  jsonb_build_object('setupComplete',true,'setupSource','pdf-import','importedBransje','Bygg')
)
ON CONFLICT (company_id, module_type) DO UPDATE
SET is_active = true, settings = EXCLUDED.settings, updated_at = now();

UPDATE company_modules
SET settings = jsonb_build_object('industry','bygg','setupComplete',true,'setupSource','pdf-import','importedBransje','Bygg'),
    updated_at = now()
WHERE company_id = 'f7e97668-2b53-4c67-b608-2dc8c4d04670' AND module_type = 'IK_HMS';