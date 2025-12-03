-- Create ks_module2_checklists table for storing completed/in-progress checklists
CREATE TABLE public.ks_module2_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.ks_module2_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  template_name TEXT NOT NULL,
  responsible_user_id UUID REFERENCES public.profiles(id),
  responsible_user_name TEXT,
  deadline_date DATE,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'rejected')),
  progress_percent INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  is_paper_version BOOLEAN NOT NULL DEFAULT false,
  paper_uploaded BOOLEAN NOT NULL DEFAULT false,
  paper_file_path TEXT,
  checklist_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  signatures JSONB NOT NULL DEFAULT '[]'::jsonb,
  pdf_file_path TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ks_module2_checklists ENABLE ROW LEVEL SECURITY;

-- RLS policies - company isolation
CREATE POLICY "Users can view checklists from their company"
ON public.ks_module2_checklists
FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create checklists for their company"
ON public.ks_module2_checklists
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update checklists from their company"
ON public.ks_module2_checklists
FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete checklists from their company"
ON public.ks_module2_checklists
FOR DELETE
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_ks_module2_checklists_updated_at
BEFORE UPDATE ON public.ks_module2_checklists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_ks_module2_checklists_project_id ON public.ks_module2_checklists(project_id);
CREATE INDEX idx_ks_module2_checklists_company_id ON public.ks_module2_checklists(company_id);