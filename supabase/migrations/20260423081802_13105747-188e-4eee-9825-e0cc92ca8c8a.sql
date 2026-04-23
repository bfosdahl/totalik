-- Mannskapsliste for prosjekter
CREATE TABLE public.ks_module2_project_crew (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.ks_module2_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  project_role TEXT,
  responsibilities TEXT,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  added_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_project_crew_project ON public.ks_module2_project_crew(project_id);
CREATE INDEX idx_project_crew_user ON public.ks_module2_project_crew(user_id);
CREATE INDEX idx_project_crew_company ON public.ks_module2_project_crew(company_id);

ALTER TABLE public.ks_module2_project_crew ENABLE ROW LEVEL SECURITY;

-- Alle i samme bedrift (eller gjester med tilgang) kan se mannskapsliste
CREATE POLICY "Crew viewable by company members and project guests"
ON public.ks_module2_project_crew
FOR SELECT
TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
  OR public.has_guest_project_access(project_id)
  OR public.is_system_admin(auth.uid())
);

-- Bedriftsadmin og systemadmin kan opprette mannskap
CREATE POLICY "Admins can insert crew"
ON public.ks_module2_project_crew
FOR INSERT
TO authenticated
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid())
  AND (
    public.is_company_admin(auth.uid())
    OR public.is_system_admin(auth.uid())
    OR public.is_hms_responsible(auth.uid())
  )
);

CREATE POLICY "Admins can update crew"
ON public.ks_module2_project_crew
FOR UPDATE
TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND (
    public.is_company_admin(auth.uid())
    OR public.is_system_admin(auth.uid())
    OR public.is_hms_responsible(auth.uid())
  )
);

CREATE POLICY "Admins can delete crew"
ON public.ks_module2_project_crew
FOR DELETE
TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND (
    public.is_company_admin(auth.uid())
    OR public.is_system_admin(auth.uid())
    OR public.is_hms_responsible(auth.uid())
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_project_crew_updated_at
BEFORE UPDATE ON public.ks_module2_project_crew
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();