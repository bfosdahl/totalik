-- Create inspection templates table
CREATE TABLE IF NOT EXISTS public.ks_inspection_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  inspection_type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create inspection template items (checkpoints)
CREATE TABLE IF NOT EXISTS public.ks_inspection_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.ks_inspection_templates(id) ON DELETE CASCADE,
  checkpoint_text TEXT NOT NULL,
  help_text TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create inspection results table (filled inspections)
CREATE TABLE IF NOT EXISTS public.ks_inspection_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES public.ks_project_inspections(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.ks_inspection_templates(id),
  checkpoint_results JSONB DEFAULT '[]'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_by_user_id UUID,
  completed_by_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ks_inspection_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ks_inspection_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ks_inspection_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for templates
CREATE POLICY "Users can view their company templates"
  ON public.ks_inspection_templates FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create templates for their company"
  ON public.ks_inspection_templates FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update their company templates"
  ON public.ks_inspection_templates FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete their company templates"
  ON public.ks_inspection_templates FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()));

-- RLS Policies for template items
CREATE POLICY "Users can view template items for their company templates"
  ON public.ks_inspection_template_items FOR SELECT
  USING (template_id IN (
    SELECT id FROM public.ks_inspection_templates 
    WHERE company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Users can create template items for their company templates"
  ON public.ks_inspection_template_items FOR INSERT
  WITH CHECK (template_id IN (
    SELECT id FROM public.ks_inspection_templates 
    WHERE company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Users can update template items for their company templates"
  ON public.ks_inspection_template_items FOR UPDATE
  USING (template_id IN (
    SELECT id FROM public.ks_inspection_templates 
    WHERE company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Users can delete template items for their company templates"
  ON public.ks_inspection_template_items FOR DELETE
  USING (template_id IN (
    SELECT id FROM public.ks_inspection_templates 
    WHERE company_id = get_user_company_id(auth.uid())
  ));

-- RLS Policies for inspection results
CREATE POLICY "Users can view results for their company inspections"
  ON public.ks_inspection_results FOR SELECT
  USING (inspection_id IN (
    SELECT id FROM public.ks_project_inspections 
    WHERE company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Users can create results for their company inspections"
  ON public.ks_inspection_results FOR INSERT
  WITH CHECK (inspection_id IN (
    SELECT id FROM public.ks_project_inspections 
    WHERE company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Users can update results for their company inspections"
  ON public.ks_inspection_results FOR UPDATE
  USING (inspection_id IN (
    SELECT id FROM public.ks_project_inspections 
    WHERE company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Users can delete results for their company inspections"
  ON public.ks_inspection_results FOR DELETE
  USING (inspection_id IN (
    SELECT id FROM public.ks_project_inspections 
    WHERE company_id = get_user_company_id(auth.uid())
  ));