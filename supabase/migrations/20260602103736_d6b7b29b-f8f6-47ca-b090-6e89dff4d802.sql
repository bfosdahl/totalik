UPDATE public.company_modules
SET settings = '{"industry": null, "setupComplete": true, "setupSource": "pdf-import"}'::jsonb,
    updated_at = now()
WHERE company_id = 'c11cdf5f-0813-45e0-9e53-8ca1b49f0cd2'
  AND module_type = 'IK_HMS';