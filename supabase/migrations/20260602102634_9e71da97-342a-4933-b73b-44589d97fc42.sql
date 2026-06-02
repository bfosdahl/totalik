-- Activate IK_BYGG (KS BYGG) for D-Blikk AS and mark both modules as setup-complete via PDF import
INSERT INTO public.company_modules (company_id, module_type, is_active, settings)
VALUES 
  ('2508a571-1845-4a3a-9131-a366a7c472af', 'IK_BYGG', true, '{"setupComplete": true, "setupSource": "pdf-import"}'::jsonb),
  ('2508a571-1845-4a3a-9131-a366a7c472af', 'KS',     true, '{"setupComplete": true, "setupSource": "pdf-import"}'::jsonb)
ON CONFLICT (company_id, module_type) DO UPDATE 
  SET is_active = true,
      settings = EXCLUDED.settings,
      updated_at = now();

UPDATE public.company_modules
SET settings = '{"setupComplete": true, "setupSource": "pdf-import"}'::jsonb,
    is_active = true,
    updated_at = now()
WHERE company_id = '2508a571-1845-4a3a-9131-a366a7c472af'
  AND module_type = 'IK_HMS';