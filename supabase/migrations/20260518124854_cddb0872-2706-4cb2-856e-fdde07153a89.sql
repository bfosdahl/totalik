
-- Drop the company-only unique constraints and replace with composite uniqueness
-- on (company_id, department_id) using NULLS NOT DISTINCT so a NULL department
-- represents the single "main company" record.

ALTER TABLE public.company_organization DROP CONSTRAINT IF EXISTS company_organization_company_id_key;
ALTER TABLE public.company_organization
  ADD CONSTRAINT company_organization_company_dept_key UNIQUE NULLS NOT DISTINCT (company_id, department_id);

ALTER TABLE public.company_risk_assessments DROP CONSTRAINT IF EXISTS company_risk_assessments_company_id_key;
ALTER TABLE public.company_risk_assessments
  ADD CONSTRAINT company_risk_assessments_company_dept_key UNIQUE NULLS NOT DISTINCT (company_id, department_id);

ALTER TABLE public.company_routines DROP CONSTRAINT IF EXISTS company_routines_company_id_key;
ALTER TABLE public.company_routines
  ADD CONSTRAINT company_routines_company_dept_key UNIQUE NULLS NOT DISTINCT (company_id, department_id);

ALTER TABLE public.company_action_plans DROP CONSTRAINT IF EXISTS company_action_plans_company_id_key;
ALTER TABLE public.company_action_plans
  ADD CONSTRAINT company_action_plans_company_dept_key UNIQUE NULLS NOT DISTINCT (company_id, department_id);
