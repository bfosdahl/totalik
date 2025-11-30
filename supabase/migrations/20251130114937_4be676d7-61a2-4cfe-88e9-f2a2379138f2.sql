-- Create table for client (byggherre) information per project
CREATE TABLE public.ks_project_client (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ks_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Basic client information
  client_name TEXT NOT NULL,
  client_type TEXT NOT NULL DEFAULT 'privatperson', -- privatperson, organisasjon, representant
  address TEXT,
  postal_code TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  project_manager TEXT, -- Prosjektleder på BH-side
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create table for byggherreforskriften coordinators (KP/KU)
CREATE TABLE public.ks_project_coordinators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ks_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  role_type TEXT NOT NULL, -- 'KP' (koordinator prosjektering) or 'KU' (koordinator utførelse)
  coordinator_name TEXT NOT NULL,
  coordinator_company TEXT,
  phone TEXT,
  email TEXT,
  contract_document_path TEXT, -- Path to koordinatoravtale document
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create table for client approvals and signatures
CREATE TABLE public.ks_project_client_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ks_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  approval_type TEXT NOT NULL, -- 'project_start', 'change_order', 'completion'
  approval_description TEXT,
  approved_by_name TEXT NOT NULL,
  signature_data TEXT, -- Digital signature or confirmation
  approval_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create table for client communication log
CREATE TABLE public.ks_project_client_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ks_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  message_type TEXT NOT NULL DEFAULT 'message', -- message, notification, alert
  subject TEXT NOT NULL,
  message_content TEXT NOT NULL,
  sent_by_user_id UUID REFERENCES profiles(id),
  sent_by_name TEXT NOT NULL,
  attachment_paths TEXT[], -- Array of file paths
  is_read BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create table for client follow-up checklist
CREATE TABLE public.ks_project_client_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ks_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  checklist_item TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_date TIMESTAMPTZ,
  completed_by_name TEXT,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ks_project_client ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ks_project_coordinators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ks_project_client_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ks_project_client_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ks_project_client_checklist ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ks_project_client
CREATE POLICY "Users can manage client info for their company projects"
ON ks_project_client
FOR ALL
USING (company_id = get_user_company_id(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- RLS Policies for ks_project_coordinators
CREATE POLICY "Users can manage coordinators for their company projects"
ON ks_project_coordinators
FOR ALL
USING (company_id = get_user_company_id(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- RLS Policies for ks_project_client_approvals
CREATE POLICY "Users can view approvals for their company projects"
ON ks_project_client_approvals
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create approvals for their company projects"
ON ks_project_client_approvals
FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- RLS Policies for ks_project_client_messages
CREATE POLICY "Users can manage messages for their company projects"
ON ks_project_client_messages
FOR ALL
USING (company_id = get_user_company_id(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- RLS Policies for ks_project_client_checklist
CREATE POLICY "Users can manage checklist for their company projects"
ON ks_project_client_checklist
FOR ALL
USING (company_id = get_user_company_id(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_ks_project_client_updated_at
BEFORE UPDATE ON ks_project_client
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ks_project_coordinators_updated_at
BEFORE UPDATE ON ks_project_coordinators
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ks_project_client_checklist_updated_at
BEFORE UPDATE ON ks_project_client_checklist
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();