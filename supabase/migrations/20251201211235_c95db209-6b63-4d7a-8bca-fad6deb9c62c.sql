-- Create table for cleaning plan responses/history
CREATE TABLE public.ik_mat_cleaning_plan_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  completed_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  completed_by_name TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'completed',
  cleaning_records JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.ik_mat_cleaning_plan_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company cleaning plan responses"
  ON public.ik_mat_cleaning_plan_responses
  FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create cleaning plan responses for their company"
  ON public.ik_mat_cleaning_plan_responses
  FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update their company cleaning plan responses"
  ON public.ik_mat_cleaning_plan_responses
  FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can delete cleaning plan responses"
  ON public.ik_mat_cleaning_plan_responses
  FOR DELETE
  USING (
    company_id = get_user_company_id(auth.uid()) 
    AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
  );

-- Add index for performance
CREATE INDEX idx_ik_mat_cleaning_plan_responses_company_id 
  ON public.ik_mat_cleaning_plan_responses(company_id);

CREATE INDEX idx_ik_mat_cleaning_plan_responses_completed_at 
  ON public.ik_mat_cleaning_plan_responses(completed_at DESC);