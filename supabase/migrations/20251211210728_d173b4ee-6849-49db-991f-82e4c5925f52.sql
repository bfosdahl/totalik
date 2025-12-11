-- Create table for project notes
CREATE TABLE public.ks_module2_project_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.ks_module2_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Notat',
  content TEXT NOT NULL,
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for project time entries
CREATE TABLE public.ks_module2_project_time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.ks_module2_projects(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.profiles(id),
  employee_name TEXT NOT NULL,
  date DATE NOT NULL,
  hours DECIMAL(5,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ks_module2_project_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ks_module2_project_time_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for project notes
CREATE POLICY "Users can view notes for their company's projects"
  ON public.ks_module2_project_notes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.company_id = ks_module2_project_notes.company_id
    )
  );

CREATE POLICY "Users can create notes for their company's projects"
  ON public.ks_module2_project_notes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.company_id = ks_module2_project_notes.company_id
    )
  );

CREATE POLICY "Users can update notes for their company's projects"
  ON public.ks_module2_project_notes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.company_id = ks_module2_project_notes.company_id
    )
  );

CREATE POLICY "Users can delete notes for their company's projects"
  ON public.ks_module2_project_notes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.company_id = ks_module2_project_notes.company_id
    )
  );

-- Create RLS policies for time entries
CREATE POLICY "Users can view time entries for their company's projects"
  ON public.ks_module2_project_time_entries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.company_id = ks_module2_project_time_entries.company_id
    )
  );

CREATE POLICY "Users can create time entries for their company's projects"
  ON public.ks_module2_project_time_entries
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.company_id = ks_module2_project_time_entries.company_id
    )
  );

CREATE POLICY "Users can update time entries for their company's projects"
  ON public.ks_module2_project_time_entries
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.company_id = ks_module2_project_time_entries.company_id
    )
  );

CREATE POLICY "Users can delete time entries for their company's projects"
  ON public.ks_module2_project_time_entries
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.company_id = ks_module2_project_time_entries.company_id
    )
  );

-- Create indexes
CREATE INDEX idx_ks_module2_project_notes_project ON public.ks_module2_project_notes(project_id);
CREATE INDEX idx_ks_module2_project_time_entries_project ON public.ks_module2_project_time_entries(project_id);
CREATE INDEX idx_ks_module2_project_time_entries_date ON public.ks_module2_project_time_entries(date);

-- Add updated_at triggers
CREATE TRIGGER update_ks_module2_project_notes_updated_at
  BEFORE UPDATE ON public.ks_module2_project_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ks_module2_project_time_entries_updated_at
  BEFORE UPDATE ON public.ks_module2_project_time_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();