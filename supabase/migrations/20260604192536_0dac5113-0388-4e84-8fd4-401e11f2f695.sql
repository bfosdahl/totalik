UPDATE public.companies SET employee_count = 2 WHERE id = 'b7a6357d-b20e-445a-b82d-4dcbede5ece4';

INSERT INTO public.company_modules (company_id, module_type, is_active, settings)
VALUES ('b7a6357d-b20e-445a-b82d-4dcbede5ece4','IK_HMS', true, jsonb_build_object('industry','frisor/skjonnhetspleie','setupComplete',true))
ON CONFLICT (company_id, module_type) DO UPDATE SET
  is_active = true,
  settings = public.company_modules.settings || jsonb_build_object('industry','frisor/skjonnhetspleie','setupComplete',true),
  updated_at = now();