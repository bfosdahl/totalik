-- Create table for simple project photos
CREATE TABLE public.ks_module2_project_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.ks_module2_projects(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ks_module2_project_photos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view photos for their company's projects"
  ON public.ks_module2_project_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.company_id = ks_module2_project_photos.company_id
    )
  );

CREATE POLICY "Users can create photos for their company's projects"
  ON public.ks_module2_project_photos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.company_id = ks_module2_project_photos.company_id
    )
  );

CREATE POLICY "Users can delete photos for their company's projects"
  ON public.ks_module2_project_photos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.company_id = ks_module2_project_photos.company_id
    )
  );

-- Create index
CREATE INDEX idx_ks_module2_project_photos_project ON public.ks_module2_project_photos(project_id);