-- Table to link admin templates/routines/documents to specific projects
CREATE TABLE public.ks_module2_project_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.ks_module2_projects(id) ON DELETE CASCADE,
    template_type TEXT NOT NULL CHECK (template_type IN ('checklist', 'routine', 'document')),
    -- Reference to admin templates
    admin_checklist_template_id UUID REFERENCES public.admin_checklist_templates(id) ON DELETE CASCADE,
    admin_routine_template_id UUID REFERENCES public.admin_routine_templates(id) ON DELETE CASCADE,
    admin_document_id UUID REFERENCES public.admin_documents(id) ON DELETE CASCADE,
    -- For tracking implementation status
    is_implemented BOOLEAN DEFAULT FALSE,
    implemented_at TIMESTAMP WITH TIME ZONE,
    implemented_by_id UUID REFERENCES public.profiles(id),
    implemented_by_name TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    -- Ensure only one reference is set per type
    CONSTRAINT valid_template_reference CHECK (
        (template_type = 'checklist' AND admin_checklist_template_id IS NOT NULL AND admin_routine_template_id IS NULL AND admin_document_id IS NULL) OR
        (template_type = 'routine' AND admin_routine_template_id IS NOT NULL AND admin_checklist_template_id IS NULL AND admin_document_id IS NULL) OR
        (template_type = 'document' AND admin_document_id IS NOT NULL AND admin_checklist_template_id IS NULL AND admin_routine_template_id IS NULL)
    ),
    -- Prevent duplicate additions
    CONSTRAINT unique_checklist_per_project UNIQUE (project_id, admin_checklist_template_id),
    CONSTRAINT unique_routine_per_project UNIQUE (project_id, admin_routine_template_id),
    CONSTRAINT unique_document_per_project UNIQUE (project_id, admin_document_id)
);

-- Enable RLS
ALTER TABLE public.ks_module2_project_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view project templates in their company"
ON public.ks_module2_project_templates FOR SELECT
USING (
    project_id IN (
        SELECT id FROM public.ks_module2_projects 
        WHERE company_id = get_user_company_id(auth.uid())
    )
    OR has_guest_project_access(project_id)
);

CREATE POLICY "Company admins can manage project templates"
ON public.ks_module2_project_templates FOR ALL
USING (
    project_id IN (
        SELECT id FROM public.ks_module2_projects 
        WHERE company_id = get_user_company_id(auth.uid())
    )
    AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
)
WITH CHECK (
    project_id IN (
        SELECT id FROM public.ks_module2_projects 
        WHERE company_id = get_user_company_id(auth.uid())
    )
    AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);

CREATE POLICY "Users can add templates to projects in their company"
ON public.ks_module2_project_templates FOR INSERT
WITH CHECK (
    project_id IN (
        SELECT id FROM public.ks_module2_projects 
        WHERE company_id = get_user_company_id(auth.uid())
    )
);

CREATE POLICY "Users can update project templates in their company"
ON public.ks_module2_project_templates FOR UPDATE
USING (
    project_id IN (
        SELECT id FROM public.ks_module2_projects 
        WHERE company_id = get_user_company_id(auth.uid())
    )
);

-- Add folder structure columns to ks_module2_documents if not exists
ALTER TABLE public.ks_module2_documents 
ADD COLUMN IF NOT EXISTS include_in_report BOOLEAN DEFAULT TRUE;

-- Add more standard folders
-- Update existing documents to have proper folder codes