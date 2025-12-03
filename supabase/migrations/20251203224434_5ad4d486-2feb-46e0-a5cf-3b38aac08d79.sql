-- Create enum for access levels
CREATE TYPE public.ks_module2_access_level AS ENUM ('none', 'guest', 'full_ue');

-- Create table for project access
CREATE TABLE public.ks_module2_project_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.ks_module2_projects(id) ON DELETE CASCADE,
  subcontractor_id UUID REFERENCES public.ks_module2_subcontractors(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  company_name TEXT,
  role_in_project TEXT NOT NULL DEFAULT 'UE',
  access_level public.ks_module2_access_level NOT NULL DEFAULT 'none',
  invited_by UUID REFERENCES auth.users(id),
  invited_by_name TEXT,
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  temp_password TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE,
  login_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'expired', 'revoked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_ks_module2_project_access_project ON public.ks_module2_project_access(project_id);
CREATE INDEX idx_ks_module2_project_access_email ON public.ks_module2_project_access(email);
CREATE INDEX idx_ks_module2_project_access_user ON public.ks_module2_project_access(user_id);

-- Enable RLS
ALTER TABLE public.ks_module2_project_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view project access for their company projects"
ON public.ks_module2_project_access
FOR SELECT
USING (
  project_id IN (
    SELECT p.id FROM public.ks_module2_projects p
    WHERE p.company_id = get_user_company_id(auth.uid())
  )
  OR user_id = auth.uid()
);

CREATE POLICY "Company users can manage project access"
ON public.ks_module2_project_access
FOR ALL
USING (
  project_id IN (
    SELECT p.id FROM public.ks_module2_projects p
    WHERE p.company_id = get_user_company_id(auth.uid())
  )
)
WITH CHECK (
  project_id IN (
    SELECT p.id FROM public.ks_module2_projects p
    WHERE p.company_id = get_user_company_id(auth.uid())
  )
);

-- Create login log table
CREATE TABLE public.ks_module2_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_id UUID NOT NULL REFERENCES public.ks_module2_project_access(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.ks_module2_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('login', 'logout', 'view', 'checklist_complete', 'deviation_created')),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_ks_module2_access_log_access ON public.ks_module2_access_log(access_id);
CREATE INDEX idx_ks_module2_access_log_project ON public.ks_module2_access_log(project_id);

ALTER TABLE public.ks_module2_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view access logs for their company projects"
ON public.ks_module2_access_log
FOR SELECT
USING (
  project_id IN (
    SELECT p.id FROM public.ks_module2_projects p
    WHERE p.company_id = get_user_company_id(auth.uid())
  )
);

CREATE POLICY "System can insert access logs"
ON public.ks_module2_access_log
FOR INSERT
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_ks_module2_project_access_updated_at
BEFORE UPDATE ON public.ks_module2_project_access
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();