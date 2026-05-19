
CREATE TABLE public.ks_module2_rigg_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.ks_module2_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Riggplan',
  description TEXT,
  canvas_data JSONB NOT NULL DEFAULT '{"objects":[],"width":1200,"height":800,"scaleMetersPerPixel":0.05}'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft',
  is_current_version BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rigg_plans_project ON public.ks_module2_rigg_plans(project_id);
CREATE INDEX idx_rigg_plans_company ON public.ks_module2_rigg_plans(company_id);

ALTER TABLE public.ks_module2_rigg_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view rigg plans"
ON public.ks_module2_rigg_plans FOR SELECT
USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_system_admin(auth.uid()));

CREATE POLICY "Company members can insert rigg plans"
ON public.ks_module2_rigg_plans FOR INSERT
WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Company members can update rigg plans"
ON public.ks_module2_rigg_plans FOR UPDATE
USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Company members can delete rigg plans"
ON public.ks_module2_rigg_plans FOR DELETE
USING (company_id = public.get_user_company_id(auth.uid()));

CREATE TRIGGER update_ks_module2_rigg_plans_updated_at
BEFORE UPDATE ON public.ks_module2_rigg_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
