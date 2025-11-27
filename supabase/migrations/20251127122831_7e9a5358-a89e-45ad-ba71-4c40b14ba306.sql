-- Create table for company goals
CREATE TABLE public.company_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  goal_text text NOT NULL,
  is_predefined boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create table for setup wizard progress
CREATE TABLE public.setup_wizard_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
  current_step integer NOT NULL DEFAULT 0,
  completed_steps text[] DEFAULT '{}',
  is_completed boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setup_wizard_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for company_goals
CREATE POLICY "Users can view their company goals"
ON public.company_goals FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can manage their company goals"
ON public.company_goals FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
)
WITH CHECK (
  company_id = get_user_company_id(auth.uid()) 
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);

CREATE POLICY "System admins can manage all goals"
ON public.company_goals FOR ALL
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));

-- RLS policies for setup_wizard_progress
CREATE POLICY "Users can view their company wizard progress"
ON public.setup_wizard_progress FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can manage their wizard progress"
ON public.setup_wizard_progress FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
)
WITH CHECK (
  company_id = get_user_company_id(auth.uid()) 
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);

CREATE POLICY "System admins can manage all wizard progress"
ON public.setup_wizard_progress FOR ALL
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_company_goals_updated_at
BEFORE UPDATE ON public.company_goals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_setup_wizard_progress_updated_at
BEFORE UPDATE ON public.setup_wizard_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();