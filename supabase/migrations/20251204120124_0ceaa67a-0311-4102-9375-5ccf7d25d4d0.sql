-- Add missing columns to existing ks_module2_checklist_templates table
ALTER TABLE public.ks_module2_checklist_templates 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.ks_module2_projects(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS approved_by TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Create index for project_id
CREATE INDEX IF NOT EXISTS idx_ks_module2_checklist_templates_project ON public.ks_module2_checklist_templates(project_id);