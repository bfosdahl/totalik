
-- Set default for project_type
ALTER TABLE public.ks_module2_projects 
  ALTER COLUMN project_type SET DEFAULT 'standard';

-- Update existing nulls
UPDATE public.ks_module2_projects 
SET project_type = 'standard' 
WHERE project_type IS NULL;

-- Table for project notes (small projects)
CREATE TABLE public.simple_project_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.ks_module2_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  created_by_id UUID REFERENCES auth.users(id),
  created_by_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.simple_project_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notes in their company" ON public.simple_project_notes
  FOR SELECT USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create notes in their company" ON public.simple_project_notes
  FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update notes in their company" ON public.simple_project_notes
  FOR UPDATE USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete notes in their company" ON public.simple_project_notes
  FOR DELETE USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE TRIGGER update_simple_project_notes_updated_at
  BEFORE UPDATE ON public.simple_project_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table for project photos (small projects)
CREATE TABLE public.simple_project_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.ks_module2_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  file_path TEXT NOT NULL,
  caption TEXT,
  created_by_id UUID REFERENCES auth.users(id),
  created_by_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.simple_project_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view photos in their company" ON public.simple_project_photos
  FOR SELECT USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create photos in their company" ON public.simple_project_photos
  FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete photos in their company" ON public.simple_project_photos
  FOR DELETE USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
