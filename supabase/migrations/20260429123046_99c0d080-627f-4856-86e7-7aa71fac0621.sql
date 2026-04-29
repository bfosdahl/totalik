CREATE INDEX IF NOT EXISTS idx_company_goals_company_id ON public.company_goals(company_id);
CREATE INDEX IF NOT EXISTS idx_company_routines_company_id ON public.company_routines(company_id);
CREATE INDEX IF NOT EXISTS idx_company_action_plans_company_id ON public.company_action_plans(company_id);
CREATE INDEX IF NOT EXISTS idx_company_risk_assessments_company_id ON public.company_risk_assessments(company_id);