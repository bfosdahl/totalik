-- =============================================================
-- IK/KS Module Tables: Bedriftens KS-grunnlag
-- =============================================================

-- 1. Company KS Routines - Bedriftens egne KS-rutiner
CREATE TABLE public.company_ks_routines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  routine_name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  admin_template_id UUID REFERENCES public.admin_routine_templates(id) ON DELETE SET NULL,
  file_path TEXT,
  version TEXT DEFAULT '1.0',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Company KS Goals - Bedriftens kvalitetsmål
CREATE TABLE public.company_ks_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  goal_text TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  status TEXT DEFAULT 'active',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Company KS Checklist Templates - Bedriftens egne sjekklistemaler
CREATE TABLE public.company_ks_checklist_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  checkpoints JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  trade TEXT,
  version TEXT DEFAULT '1.0',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Company KS Selected Admin Templates - Admin-maler bedriften har valgt å bruke
CREATE TABLE public.company_ks_selected_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  template_type TEXT NOT NULL,
  admin_template_id UUID NOT NULL,
  selected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  selected_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  UNIQUE(company_id, template_type, admin_template_id)
);

-- 5. Company KS Documents - Bedriftens KS-dokumenter med prosjekt-kobling
CREATE TABLE public.company_ks_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  folder_id UUID,
  project_id UUID REFERENCES public.ks_module2_projects(id) ON DELETE SET NULL,
  uploaded_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  uploaded_by_name TEXT NOT NULL,
  is_template BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Company KS Document Folders - Mappestruktur for dokumenter
CREATE TABLE public.company_ks_document_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  parent_folder_id UUID REFERENCES public.company_ks_document_folders(id) ON DELETE CASCADE,
  color TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add folder reference to documents
ALTER TABLE public.company_ks_documents
  ADD CONSTRAINT company_ks_documents_folder_id_fkey
  FOREIGN KEY (folder_id) REFERENCES public.company_ks_document_folders(id) ON DELETE SET NULL;

-- =============================================================
-- Enable RLS on all tables
-- =============================================================

ALTER TABLE public.company_ks_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_ks_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_ks_checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_ks_selected_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_ks_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_ks_document_folders ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- RLS Policies using existing helper functions
-- =============================================================

-- company_ks_routines
CREATE POLICY "Users can view their company KS routines"
  ON public.company_ks_routines FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can manage KS routines"
  ON public.company_ks_routines FOR ALL
  USING ((company_id = get_user_company_id(auth.uid())) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));

-- company_ks_goals
CREATE POLICY "Users can view their company KS goals"
  ON public.company_ks_goals FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can manage KS goals"
  ON public.company_ks_goals FOR ALL
  USING ((company_id = get_user_company_id(auth.uid())) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));

-- company_ks_checklist_templates
CREATE POLICY "Users can view their company checklist templates"
  ON public.company_ks_checklist_templates FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can manage checklist templates"
  ON public.company_ks_checklist_templates FOR ALL
  USING ((company_id = get_user_company_id(auth.uid())) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));

-- company_ks_selected_templates
CREATE POLICY "Users can view selected templates"
  ON public.company_ks_selected_templates FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can manage selected templates"
  ON public.company_ks_selected_templates FOR ALL
  USING ((company_id = get_user_company_id(auth.uid())) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));

-- company_ks_documents
CREATE POLICY "Users can view their company KS documents"
  ON public.company_ks_documents FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can manage KS documents"
  ON public.company_ks_documents FOR ALL
  USING ((company_id = get_user_company_id(auth.uid())) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));

-- company_ks_document_folders
CREATE POLICY "Users can view their company document folders"
  ON public.company_ks_document_folders FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can manage document folders"
  ON public.company_ks_document_folders FOR ALL
  USING ((company_id = get_user_company_id(auth.uid())) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));

-- =============================================================
-- Indexes for performance
-- =============================================================

CREATE INDEX idx_company_ks_routines_company ON public.company_ks_routines(company_id);
CREATE INDEX idx_company_ks_goals_company ON public.company_ks_goals(company_id);
CREATE INDEX idx_company_ks_checklist_templates_company ON public.company_ks_checklist_templates(company_id);
CREATE INDEX idx_company_ks_selected_templates_company ON public.company_ks_selected_templates(company_id);
CREATE INDEX idx_company_ks_documents_company ON public.company_ks_documents(company_id);
CREATE INDEX idx_company_ks_documents_project ON public.company_ks_documents(project_id);
CREATE INDEX idx_company_ks_document_folders_company ON public.company_ks_document_folders(company_id);

-- =============================================================
-- Updated_at triggers
-- =============================================================

CREATE TRIGGER update_company_ks_routines_updated_at
  BEFORE UPDATE ON public.company_ks_routines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_ks_goals_updated_at
  BEFORE UPDATE ON public.company_ks_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_ks_checklist_templates_updated_at
  BEFORE UPDATE ON public.company_ks_checklist_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_ks_documents_updated_at
  BEFORE UPDATE ON public.company_ks_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_ks_document_folders_updated_at
  BEFORE UPDATE ON public.company_ks_document_folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();