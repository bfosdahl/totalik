-- Create KS routines table for quality assurance routines
CREATE TABLE IF NOT EXISTS public.ks_routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  routine_number text NOT NULL,
  name text NOT NULL,
  category text, -- a-h from SAK10 § 10-1
  purpose text,
  responsibility text,
  procedure text,
  examples text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ks_routines ENABLE ROW LEVEL SECURITY;

-- Policies for ks_routines
CREATE POLICY "Users can view routines for their company"
  ON public.ks_routines
  FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can manage routines for their company"
  ON public.ks_routines
  FOR ALL
  USING (
    company_id = get_user_company_id(auth.uid())
    AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
  )
  WITH CHECK (
    company_id = get_user_company_id(auth.uid())
    AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
  );

CREATE POLICY "System admins can manage all routines"
  ON public.ks_routines
  FOR ALL
  USING (is_system_admin(auth.uid()))
  WITH CHECK (is_system_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_ks_routines_updated_at
  BEFORE UPDATE ON public.ks_routines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create junction table for linking routines to projects
CREATE TABLE IF NOT EXISTS public.ks_project_routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.ks_projects(id) ON DELETE CASCADE,
  routine_id uuid NOT NULL REFERENCES public.ks_routines(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(project_id, routine_id)
);

-- Enable RLS for junction table
ALTER TABLE public.ks_project_routines ENABLE ROW LEVEL SECURITY;

-- Policies for junction table
CREATE POLICY "Users can view routine links for their company projects"
  ON public.ks_project_routines
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ks_projects
      WHERE ks_projects.id = ks_project_routines.project_id
      AND ks_projects.company_id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "Users can manage routine links for their company projects"
  ON public.ks_project_routines
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM ks_projects
      WHERE ks_projects.id = ks_project_routines.project_id
      AND ks_projects.company_id = get_user_company_id(auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ks_projects
      WHERE ks_projects.id = ks_project_routines.project_id
      AND ks_projects.company_id = get_user_company_id(auth.uid())
    )
  );