-- Make aarshjul unique constraints department-aware
ALTER TABLE public.company_aarshjul_default_overrides 
  DROP CONSTRAINT IF EXISTS company_aarshjul_default_overrides_company_id_activity_id_key;
ALTER TABLE public.company_aarshjul_hidden_defaults 
  DROP CONSTRAINT IF EXISTS company_aarshjul_hidden_defaults_company_id_activity_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS company_aarshjul_default_overrides_company_dept_activity_uniq
  ON public.company_aarshjul_default_overrides (company_id, department_id, activity_id) NULLS NOT DISTINCT;
CREATE UNIQUE INDEX IF NOT EXISTS company_aarshjul_hidden_defaults_company_dept_activity_uniq
  ON public.company_aarshjul_hidden_defaults (company_id, department_id, activity_id) NULLS NOT DISTINCT;

-- Also add department_id to equipment_exposure_assessments and hms_self_declarations if missing
ALTER TABLE public.equipment_exposure_assessments
  ADD COLUMN IF NOT EXISTS department_id uuid NULL REFERENCES public.company_departments(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_equipment_exposure_assessments_company_dept 
  ON public.equipment_exposure_assessments (company_id, department_id);