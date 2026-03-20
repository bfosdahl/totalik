
CREATE TABLE public.company_project_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  description TEXT,
  contractor_type TEXT,
  default_description TEXT,
  default_checklists JSONB DEFAULT '[]'::jsonb,
  default_routines JSONB DEFAULT '[]'::jsonb,
  icon TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.company_project_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view own templates"
  ON public.company_project_templates FOR SELECT
  TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can insert templates"
  ON public.company_project_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id = public.get_user_company_id(auth.uid())
    AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid()))
  );

CREATE POLICY "Company admins can update templates"
  ON public.company_project_templates FOR UPDATE
  TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid()))
  );

CREATE POLICY "Company admins can delete templates"
  ON public.company_project_templates FOR DELETE
  TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid()))
  );

CREATE POLICY "System admins full access"
  ON public.company_project_templates FOR ALL
  TO authenticated
  USING (public.is_system_admin(auth.uid()));
