
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS industries text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.admin_checklist_templates ADD COLUMN IF NOT EXISTS industries text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.admin_routine_templates ADD COLUMN IF NOT EXISTS industries text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.admin_routine_templates_v2 ADD COLUMN IF NOT EXISTS industries text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.admin_documents ADD COLUMN IF NOT EXISTS industries text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_admin_checklist_templates_industries ON public.admin_checklist_templates USING gin (industries);
CREATE INDEX IF NOT EXISTS idx_admin_routine_templates_industries ON public.admin_routine_templates USING gin (industries);
CREATE INDEX IF NOT EXISTS idx_admin_routine_templates_v2_industries ON public.admin_routine_templates_v2 USING gin (industries);
CREATE INDEX IF NOT EXISTS idx_admin_documents_industries ON public.admin_documents USING gin (industries);
CREATE INDEX IF NOT EXISTS idx_companies_industries ON public.companies USING gin (industries);
