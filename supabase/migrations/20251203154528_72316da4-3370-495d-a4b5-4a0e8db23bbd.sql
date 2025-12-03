-- Create KS Module 2 Projects table
CREATE TABLE public.ks_module2_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Basic info
  project_name TEXT NOT NULL,
  project_number TEXT NOT NULL,
  address TEXT,
  gnr_bnr TEXT, -- Gårds-/bruksnummer
  
  -- Client (Byggherre)
  client_name TEXT,
  client_org_number TEXT,
  client_contact_person TEXT,
  client_phone TEXT,
  client_email TEXT,
  
  -- Project details
  contractor_type TEXT CHECK (contractor_type IN ('total', 'hoved', 'under')),
  project_leader_id UUID REFERENCES public.profiles(id),
  project_leader_name TEXT,
  sha_coordinator_kp TEXT,
  sha_coordinator_ku TEXT,
  
  -- Dates and financials
  planned_start_date DATE,
  planned_end_date DATE,
  contract_sum DECIMAL(15, 2),
  
  -- Description
  description TEXT,
  
  -- Status and progress
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'handover', 'warranty', 'completed')),
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  
  -- Favorites and activity
  is_favorite BOOLEAN DEFAULT false,
  last_activity_date TIMESTAMPTZ DEFAULT now(),
  last_activity_description TEXT,
  
  -- Metadata
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create sequence for project numbers
CREATE SEQUENCE IF NOT EXISTS ks_module2_project_number_seq START 1;

-- Function to generate project number
CREATE OR REPLACE FUNCTION public.generate_ks_module2_project_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num integer;
  project_num text;
  current_year text;
BEGIN
  next_num := nextval('ks_module2_project_number_seq');
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::text;
  project_num := 'PRJ-' || current_year || '-' || LPAD(next_num::text, 3, '0');
  RETURN project_num;
END;
$$;

-- Trigger to auto-set project number
CREATE OR REPLACE FUNCTION public.set_ks_module2_project_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.project_number IS NULL OR NEW.project_number = '' THEN
    NEW.project_number := generate_ks_module2_project_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_ks_module2_project_number
  BEFORE INSERT ON public.ks_module2_projects
  FOR EACH ROW
  EXECUTE FUNCTION set_ks_module2_project_number();

-- Updated at trigger
CREATE TRIGGER update_ks_module2_projects_updated_at
  BEFORE UPDATE ON public.ks_module2_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.ks_module2_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view projects in their company"
  ON public.ks_module2_projects
  FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()) OR is_system_admin(auth.uid()));

CREATE POLICY "Users can create projects in their company"
  ON public.ks_module2_projects
  FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()) OR is_system_admin(auth.uid()));

CREATE POLICY "Users can update projects in their company"
  ON public.ks_module2_projects
  FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()) OR is_system_admin(auth.uid()));

CREATE POLICY "Users can delete projects in their company"
  ON public.ks_module2_projects
  FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()) OR is_system_admin(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_ks_module2_projects_company_id ON public.ks_module2_projects(company_id);
CREATE INDEX idx_ks_module2_projects_status ON public.ks_module2_projects(status);
CREATE INDEX idx_ks_module2_projects_is_favorite ON public.ks_module2_projects(is_favorite);