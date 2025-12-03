-- Create routines table for project-level quality assurance routines
CREATE TABLE public.ks_module2_routines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.ks_module2_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  routine_number TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  content TEXT, -- Structured content for in-app created routines
  document_path TEXT, -- Path for uploaded documents
  document_name TEXT, -- Original filename
  category TEXT DEFAULT 'general',
  responsible_role TEXT, -- Who is responsible for following this routine
  is_document BOOLEAN DEFAULT false, -- true if uploaded document, false if structured
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create link table connecting routines to checklist templates
CREATE TABLE public.ks_module2_routine_checklist_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  routine_id UUID NOT NULL REFERENCES public.ks_module2_routines(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.ks_module2_checklist_templates(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(routine_id, template_id)
);

-- Enable RLS
ALTER TABLE public.ks_module2_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ks_module2_routine_checklist_links ENABLE ROW LEVEL SECURITY;

-- RLS policies for routines
CREATE POLICY "Users can view their company routines"
  ON public.ks_module2_routines
  FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create routines in their company"
  ON public.ks_module2_routines
  FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update their company routines"
  ON public.ks_module2_routines
  FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete their company routines"
  ON public.ks_module2_routines
  FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()));

-- RLS policies for routine-checklist links
CREATE POLICY "Users can view routine links for their company"
  ON public.ks_module2_routine_checklist_links
  FOR SELECT
  USING (
    routine_id IN (
      SELECT id FROM public.ks_module2_routines 
      WHERE company_id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "Users can create routine links for their company"
  ON public.ks_module2_routine_checklist_links
  FOR INSERT
  WITH CHECK (
    routine_id IN (
      SELECT id FROM public.ks_module2_routines 
      WHERE company_id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "Users can delete routine links for their company"
  ON public.ks_module2_routine_checklist_links
  FOR DELETE
  USING (
    routine_id IN (
      SELECT id FROM public.ks_module2_routines 
      WHERE company_id = get_user_company_id(auth.uid())
    )
  );

-- Create storage bucket for routine documents
INSERT INTO storage.buckets (id, name, public) VALUES ('ks-module2-routines', 'ks-module2-routines', false);

-- Storage policies
CREATE POLICY "Users can view routine documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ks-module2-routines' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can upload routine documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'ks-module2-routines' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete routine documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'ks-module2-routines' AND auth.uid() IS NOT NULL);

-- Sequence for routine numbers
CREATE SEQUENCE IF NOT EXISTS ks_module2_routine_number_seq START 1;

-- Function to generate routine number
CREATE OR REPLACE FUNCTION public.generate_ks_module2_routine_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
  routine_num TEXT;
BEGIN
  next_num := nextval('ks_module2_routine_number_seq');
  routine_num := 'RUT-' || LPAD(next_num::TEXT, 4, '0');
  RETURN routine_num;
END;
$$;

-- Trigger to auto-generate routine number
CREATE OR REPLACE FUNCTION public.set_ks_module2_routine_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.routine_number IS NULL OR NEW.routine_number = '' THEN
    NEW.routine_number := generate_ks_module2_routine_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_routine_number
  BEFORE INSERT ON public.ks_module2_routines
  FOR EACH ROW
  EXECUTE FUNCTION public.set_ks_module2_routine_number();