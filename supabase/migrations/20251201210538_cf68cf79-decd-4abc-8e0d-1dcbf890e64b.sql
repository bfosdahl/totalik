-- Create table for IK-MAT checklist responses
CREATE TABLE IF NOT EXISTS public.ik_mat_checklist_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  checklist_type TEXT NOT NULL,
  checklist_name TEXT NOT NULL,
  completed_by_id UUID REFERENCES profiles(id),
  completed_by_name TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'draft',
  responses JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ik_mat_checklist_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their company checklist responses"
  ON public.ik_mat_checklist_responses
  FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create checklist responses for their company"
  ON public.ik_mat_checklist_responses
  FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update their company checklist responses"
  ON public.ik_mat_checklist_responses
  FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can delete checklist responses"
  ON public.ik_mat_checklist_responses
  FOR DELETE
  USING (
    company_id = get_user_company_id(auth.uid()) 
    AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
  );

-- Create index for performance
CREATE INDEX idx_ik_mat_checklist_responses_company 
  ON public.ik_mat_checklist_responses(company_id);

CREATE INDEX idx_ik_mat_checklist_responses_type 
  ON public.ik_mat_checklist_responses(checklist_type);