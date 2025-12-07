
-- Create table for project milestones/tasks for Gantt chart
CREATE TABLE public.ks_module2_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.ks_module2_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started',
  progress INTEGER DEFAULT 0,
  responsible_name TEXT,
  responsible_id UUID REFERENCES public.profiles(id),
  color TEXT DEFAULT '#3B82F6',
  sort_order INTEGER DEFAULT 0,
  parent_id UUID REFERENCES public.ks_module2_milestones(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ks_module2_milestones ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view milestones for their company" 
ON public.ks_module2_milestones 
FOR SELECT 
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create milestones for their company" 
ON public.ks_module2_milestones 
FOR INSERT 
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update milestones for their company" 
ON public.ks_module2_milestones 
FOR UPDATE 
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete milestones for their company" 
ON public.ks_module2_milestones 
FOR DELETE 
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- Guest access policy
CREATE POLICY "Guests can view milestones for their projects"
ON public.ks_module2_milestones
FOR SELECT
USING (has_guest_project_access(project_id));

-- Indexes
CREATE INDEX idx_ks_module2_milestones_project ON public.ks_module2_milestones(project_id);
CREATE INDEX idx_ks_module2_milestones_company ON public.ks_module2_milestones(company_id);

-- Updated at trigger
CREATE TRIGGER update_ks_module2_milestones_updated_at
BEFORE UPDATE ON public.ks_module2_milestones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
