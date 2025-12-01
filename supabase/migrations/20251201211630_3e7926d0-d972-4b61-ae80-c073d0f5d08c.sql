-- Create table for custom cleaning tasks
CREATE TABLE public.ik_mat_custom_cleaning_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  area TEXT NOT NULL,
  frequency TEXT NOT NULL,
  method TEXT NOT NULL,
  responsible TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for custom checklists
CREATE TABLE public.ik_mat_custom_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  checklist_name TEXT NOT NULL,
  checklist_type TEXT NOT NULL DEFAULT 'custom',
  description TEXT,
  checkpoints JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for custom cleaning tasks
ALTER TABLE public.ik_mat_custom_cleaning_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company custom cleaning tasks"
  ON public.ik_mat_custom_cleaning_tasks
  FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can manage custom cleaning tasks"
  ON public.ik_mat_custom_cleaning_tasks
  FOR ALL
  USING (
    company_id = get_user_company_id(auth.uid()) 
    AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
  )
  WITH CHECK (
    company_id = get_user_company_id(auth.uid()) 
    AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
  );

-- Add RLS policies for custom checklists
ALTER TABLE public.ik_mat_custom_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company custom checklists"
  ON public.ik_mat_custom_checklists
  FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can manage custom checklists"
  ON public.ik_mat_custom_checklists
  FOR ALL
  USING (
    company_id = get_user_company_id(auth.uid()) 
    AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
  )
  WITH CHECK (
    company_id = get_user_company_id(auth.uid()) 
    AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
  );

-- Add indexes
CREATE INDEX idx_ik_mat_custom_cleaning_tasks_company_id 
  ON public.ik_mat_custom_cleaning_tasks(company_id);

CREATE INDEX idx_ik_mat_custom_checklists_company_id 
  ON public.ik_mat_custom_checklists(company_id);