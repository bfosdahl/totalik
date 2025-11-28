-- Create table for KS Bygg deviations (separate from HMS deviations)
CREATE TABLE IF NOT EXISTS public.ks_project_deviations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.ks_projects(id) ON DELETE CASCADE,
  avvik_nummer TEXT NOT NULL,
  tittel TEXT NOT NULL,
  beskrivelse TEXT,
  kategori TEXT NOT NULL,
  prioritet TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  ansvarlig TEXT,
  frist DATE,
  oppdaget_dato DATE NOT NULL DEFAULT CURRENT_DATE,
  oppdaget_sted TEXT,
  type TEXT NOT NULL DEFAULT 'avvik',
  -- RUH-specific fields
  incident_time TIME,
  incident_location TEXT,
  incident_type TEXT,
  severity TEXT,
  consequences TEXT,
  involved_persons TEXT,
  root_cause_analysis TEXT,
  immediate_actions TEXT,
  preventive_measures TEXT,
  reporter_contact TEXT,
  responsible_receiver TEXT,
  notify_arbeidstilsynet BOOLEAN DEFAULT false,
  notify_insurance BOOLEAN DEFAULT false,
  additional_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for better query performance
CREATE INDEX idx_ks_project_deviations_company ON public.ks_project_deviations(company_id);
CREATE INDEX idx_ks_project_deviations_project ON public.ks_project_deviations(project_id);
CREATE INDEX idx_ks_project_deviations_status ON public.ks_project_deviations(status);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_ks_project_deviations_updated_at
  BEFORE UPDATE ON public.ks_project_deviations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.ks_project_deviations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view KS deviations for their company projects"
  ON public.ks_project_deviations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ks_projects
      WHERE ks_projects.id = ks_project_deviations.project_id
      AND ks_projects.company_id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "Users can create KS deviations for their company projects"
  ON public.ks_project_deviations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ks_projects
      WHERE ks_projects.id = ks_project_deviations.project_id
      AND ks_projects.company_id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "Users can update KS deviations for their company projects"
  ON public.ks_project_deviations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.ks_projects
      WHERE ks_projects.id = ks_project_deviations.project_id
      AND ks_projects.company_id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "Company admins can delete KS deviations"
  ON public.ks_project_deviations
  FOR DELETE
  USING (
    company_id = get_user_company_id(auth.uid()) 
    AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
  );

CREATE POLICY "System admins can manage all KS deviations"
  ON public.ks_project_deviations
  FOR ALL
  USING (is_system_admin(auth.uid()))
  WITH CHECK (is_system_admin(auth.uid()));