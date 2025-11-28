-- Create HMS Plan tables for KS projects

-- Project-specific HMS goals
CREATE TABLE IF NOT EXISTS public.ks_project_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.ks_projects(id) ON DELETE CASCADE,
  goal_text text NOT NULL,
  is_predefined boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.ks_project_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view HMS goals for their company projects"
ON public.ks_project_goals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ks_projects
    WHERE ks_projects.id = ks_project_goals.project_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
);

CREATE POLICY "Users can manage HMS goals for their company projects"
ON public.ks_project_goals FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.ks_projects
    WHERE ks_projects.id = ks_project_goals.project_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ks_projects
    WHERE ks_projects.id = ks_project_goals.project_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
);

-- Project organization structure
CREATE TABLE IF NOT EXISTS public.ks_project_organization (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.ks_projects(id) ON DELETE CASCADE UNIQUE,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.ks_project_organization ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view organization for their company projects"
ON public.ks_project_organization FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ks_projects
    WHERE ks_projects.id = ks_project_organization.project_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
);

CREATE POLICY "Users can manage organization for their company projects"
ON public.ks_project_organization FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.ks_projects
    WHERE ks_projects.id = ks_project_organization.project_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ks_projects
    WHERE ks_projects.id = ks_project_organization.project_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
);

-- Project risks
CREATE TABLE IF NOT EXISTS public.ks_project_risks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.ks_projects(id) ON DELETE CASCADE,
  hazard text NOT NULL,
  consequence integer NOT NULL CHECK (consequence >= 1 AND consequence <= 5),
  probability integer NOT NULL CHECK (probability >= 1 AND probability <= 5),
  risk_score integer GENERATED ALWAYS AS (consequence * probability) STORED,
  measures text,
  responsible text,
  deadline date,
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.ks_project_risks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view risks for their company projects"
ON public.ks_project_risks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ks_projects
    WHERE ks_projects.id = ks_project_risks.project_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
);

CREATE POLICY "Users can manage risks for their company projects"
ON public.ks_project_risks FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.ks_projects
    WHERE ks_projects.id = ks_project_risks.project_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ks_projects
    WHERE ks_projects.id = ks_project_risks.project_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
);

-- Update SJA table structure for better usability
ALTER TABLE public.ks_sja 
ADD COLUMN IF NOT EXISTS work_description text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS participants text,
ADD COLUMN IF NOT EXISTS date date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived'));

-- Project actions/measures
CREATE TABLE IF NOT EXISTS public.ks_project_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.ks_projects(id) ON DELETE CASCADE,
  risk_id uuid REFERENCES public.ks_project_risks(id) ON DELETE SET NULL,
  description text NOT NULL,
  responsible text,
  deadline date,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.ks_project_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view actions for their company projects"
ON public.ks_project_actions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ks_projects
    WHERE ks_projects.id = ks_project_actions.project_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
);

CREATE POLICY "Users can manage actions for their company projects"
ON public.ks_project_actions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.ks_projects
    WHERE ks_projects.id = ks_project_actions.project_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ks_projects
    WHERE ks_projects.id = ks_project_actions.project_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
);

-- HMS Plan wizard progress tracking
CREATE TABLE IF NOT EXISTS public.ks_hms_plan_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.ks_projects(id) ON DELETE CASCADE UNIQUE,
  current_step integer DEFAULT 0,
  completed_steps text[] DEFAULT '{}',
  is_completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.ks_hms_plan_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view HMS plan progress for their company projects"
ON public.ks_hms_plan_progress FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ks_projects
    WHERE ks_projects.id = ks_hms_plan_progress.project_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
);

CREATE POLICY "Users can manage HMS plan progress for their company projects"
ON public.ks_hms_plan_progress FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.ks_projects
    WHERE ks_projects.id = ks_hms_plan_progress.project_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ks_projects
    WHERE ks_projects.id = ks_hms_plan_progress.project_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_ks_project_goals_updated_at
BEFORE UPDATE ON public.ks_project_goals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ks_project_organization_updated_at
BEFORE UPDATE ON public.ks_project_organization
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ks_project_risks_updated_at
BEFORE UPDATE ON public.ks_project_risks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ks_project_actions_updated_at
BEFORE UPDATE ON public.ks_project_actions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ks_hms_plan_progress_updated_at
BEFORE UPDATE ON public.ks_hms_plan_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();