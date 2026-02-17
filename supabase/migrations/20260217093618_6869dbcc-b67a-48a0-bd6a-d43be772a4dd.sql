-- Create table for storing HMS plan content per KS project
CREATE TABLE public.ks_module2_hms_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.ks_module2_projects(id) ON DELETE CASCADE,
  goals JSONB NOT NULL DEFAULT '[]'::jsonb,
  responsibilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  general_measures TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id)
);

-- Enable RLS
ALTER TABLE public.ks_module2_hms_plans ENABLE ROW LEVEL SECURITY;

-- RLS policies - same pattern as other ks_module2 tables
CREATE POLICY "Users can view HMS plans for their company projects"
  ON public.ks_module2_hms_plans FOR SELECT
  USING (
    project_id IN (
      SELECT p.id FROM public.ks_module2_projects p
      JOIN public.profiles pr ON pr.company_id = p.company_id
      WHERE pr.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert HMS plans for their company projects"
  ON public.ks_module2_hms_plans FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM public.ks_module2_projects p
      JOIN public.profiles pr ON pr.company_id = p.company_id
      WHERE pr.id = auth.uid()
    )
  );

CREATE POLICY "Users can update HMS plans for their company projects"
  ON public.ks_module2_hms_plans FOR UPDATE
  USING (
    project_id IN (
      SELECT p.id FROM public.ks_module2_projects p
      JOIN public.profiles pr ON pr.company_id = p.company_id
      WHERE pr.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete HMS plans for their company projects"
  ON public.ks_module2_hms_plans FOR DELETE
  USING (
    project_id IN (
      SELECT p.id FROM public.ks_module2_projects p
      JOIN public.profiles pr ON pr.company_id = p.company_id
      WHERE pr.id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_ks_module2_hms_plans_updated_at
  BEFORE UPDATE ON public.ks_module2_hms_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();