-- Create table for project responsibilities (multiple responsible parties per project)
CREATE TABLE IF NOT EXISTS public.ks_project_responsibilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.ks_projects(id) ON DELETE CASCADE,
  role_type text NOT NULL CHECK (role_type IN ('SØK', 'PRO', 'UTF', 'KTR')),
  funksjon text NOT NULL,
  ansvarlig_navn text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.ks_project_responsibilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view responsibilities for their company projects"
  ON public.ks_project_responsibilities
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ks_projects
      WHERE ks_projects.id = ks_project_responsibilities.project_id
        AND ks_projects.company_id = public.get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "Users can manage responsibilities for their company projects"
  ON public.ks_project_responsibilities
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.ks_projects
      WHERE ks_projects.id = ks_project_responsibilities.project_id
        AND ks_projects.company_id = public.get_user_company_id(auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ks_projects
      WHERE ks_projects.id = ks_project_responsibilities.project_id
        AND ks_projects.company_id = public.get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "System admins can manage all responsibilities"
  ON public.ks_project_responsibilities
  FOR ALL
  USING (public.is_system_admin(auth.uid()))
  WITH CHECK (public.is_system_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_ks_project_responsibilities_updated_at
  BEFORE UPDATE ON public.ks_project_responsibilities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing data from ks_projects to ks_project_responsibilities
INSERT INTO public.ks_project_responsibilities (project_id, role_type, funksjon, ansvarlig_navn)
SELECT 
  id,
  'SØK',
  COALESCE(ansvarlig_soker_funksjon, 'Ansvarlig søker'),
  ansvarlig_soker
FROM public.ks_projects
WHERE ansvarlig_soker IS NOT NULL AND ansvarlig_soker != '';

INSERT INTO public.ks_project_responsibilities (project_id, role_type, funksjon, ansvarlig_navn)
SELECT 
  id,
  'PRO',
  COALESCE(ansvarlig_prosjekterende_funksjon, 'Arkitektur'),
  ansvarlig_prosjekterende
FROM public.ks_projects
WHERE ansvarlig_prosjekterende IS NOT NULL AND ansvarlig_prosjekterende != '';

INSERT INTO public.ks_project_responsibilities (project_id, role_type, funksjon, ansvarlig_navn)
SELECT 
  id,
  'UTF',
  COALESCE(ansvarlig_utforende_funksjon, ansvarsrolle),
  ansvarlig_utforende
FROM public.ks_projects
WHERE ansvarlig_utforende IS NOT NULL AND ansvarlig_utforende != '';

INSERT INTO public.ks_project_responsibilities (project_id, role_type, funksjon, ansvarlig_navn)
SELECT 
  id,
  'KTR',
  COALESCE(ansvarlig_kontrollerende_funksjon, 'Overordnet ansvar for kontroll'),
  ansvarlig_kontrollerende
FROM public.ks_projects
WHERE ansvarlig_kontrollerende IS NOT NULL AND ansvarlig_kontrollerende != '';