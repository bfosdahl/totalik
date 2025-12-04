-- Add approved_by and linked_checklists fields to project templates
ALTER TABLE public.ks_module2_project_templates 
ADD COLUMN IF NOT EXISTS approved_by text,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS linked_checklist_ids jsonb DEFAULT '[]'::jsonb;