-- Create table for company action plans linked to risks
CREATE TABLE public.company_action_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- Enable RLS
ALTER TABLE public.company_action_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their company action plans"
ON public.company_action_plans
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can manage their company action plans"
ON public.company_action_plans
FOR ALL
USING (
  (company_id = get_user_company_id(auth.uid())) 
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
)
WITH CHECK (
  (company_id = get_user_company_id(auth.uid())) 
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);

CREATE POLICY "System admins can manage all action plans"
ON public.company_action_plans
FOR ALL
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));

-- Add updated_at trigger
CREATE TRIGGER update_company_action_plans_updated_at
BEFORE UPDATE ON public.company_action_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();