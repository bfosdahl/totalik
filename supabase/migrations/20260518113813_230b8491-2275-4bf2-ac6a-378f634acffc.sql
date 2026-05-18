
-- Legg til department_id på IK MAT tabeller for ekte avdelingsisolering
ALTER TABLE public.ik_mat_temperature_equipment 
  ADD COLUMN IF NOT EXISTS department_id uuid NULL REFERENCES public.company_departments(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_ik_mat_temperature_equipment_company_dept 
  ON public.ik_mat_temperature_equipment(company_id, department_id);

ALTER TABLE public.ik_mat_temperature_logs 
  ADD COLUMN IF NOT EXISTS department_id uuid NULL REFERENCES public.company_departments(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_ik_mat_temperature_logs_company_dept 
  ON public.ik_mat_temperature_logs(company_id, department_id);
