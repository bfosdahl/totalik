-- Create table for custom checklist templates created by users
CREATE TABLE IF NOT EXISTS public.ks_module2_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.ks_module2_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  checklist_number TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  checkpoints JSONB NOT NULL DEFAULT '[]'::jsonb,
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ks_module2_checklists ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their company's custom checklists"
  ON public.ks_module2_checklists FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create custom checklists for their company"
  ON public.ks_module2_checklists FOR INSERT
  WITH CHECK (company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update their company's custom checklists"
  ON public.ks_module2_checklists FOR UPDATE
  USING (company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete their company's custom checklists"
  ON public.ks_module2_checklists FOR DELETE
  USING (company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ));

-- Create index for faster queries
CREATE INDEX idx_ks_module2_checklists_project ON public.ks_module2_checklists(project_id);
CREATE INDEX idx_ks_module2_checklists_company ON public.ks_module2_checklists(company_id);