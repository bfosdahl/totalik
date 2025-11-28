-- Add subcontractor role to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'subcontractor';

-- Create table for subcontractors in projects
CREATE TABLE ks_project_subcontractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ks_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Subcontractor info
  subcontractor_name TEXT NOT NULL,
  org_number TEXT,
  contact_person TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  
  -- Work scope
  work_scope TEXT NOT NULL, -- e.g., "Rørlegger", "Elektriker"
  work_description TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active', -- active, completed, terminated
  
  -- Linked user (if UE has login access)
  user_id UUID REFERENCES profiles(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table for subcontractor contracts
CREATE TABLE ks_subcontractor_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_id UUID NOT NULL REFERENCES ks_project_subcontractors(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  contract_name TEXT NOT NULL,
  contract_number TEXT,
  contract_date DATE,
  contract_value NUMERIC,
  
  -- File storage
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  
  description TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_by_name TEXT NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table for subcontractor competence documentation
CREATE TABLE ks_subcontractor_competence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_id UUID NOT NULL REFERENCES ks_project_subcontractors(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  document_type TEXT NOT NULL, -- 'hms_card', 'certificate', 'insurance', 'other'
  document_name TEXT NOT NULL,
  document_number TEXT,
  issue_date DATE,
  expiry_date DATE,
  
  -- File storage
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  
  notes TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_by_name TEXT NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table for subcontractor inspections
CREATE TABLE ks_subcontractor_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_id UUID NOT NULL REFERENCES ks_project_subcontractors(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES ks_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  inspection_date DATE NOT NULL,
  inspector_name TEXT NOT NULL,
  work_area TEXT NOT NULL,
  
  -- Inspection result
  status TEXT NOT NULL, -- 'approved', 'approved_with_remarks', 'rejected'
  findings TEXT,
  corrective_actions TEXT,
  
  -- Photos
  photo_paths TEXT[], -- Array of file paths
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add UE-specific fields to ks_project_deviations if not exists
ALTER TABLE ks_project_deviations ADD COLUMN IF NOT EXISTS subcontractor_id UUID REFERENCES ks_project_subcontractors(id);
ALTER TABLE ks_project_deviations ADD COLUMN IF NOT EXISTS is_subcontractor_deviation BOOLEAN DEFAULT false;

-- Enable RLS on all tables
ALTER TABLE ks_project_subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ks_subcontractor_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ks_subcontractor_competence ENABLE ROW LEVEL SECURITY;
ALTER TABLE ks_subcontractor_inspections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ks_project_subcontractors
CREATE POLICY "Users can view subcontractors in their company projects"
ON ks_project_subcontractors FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM ks_projects
    WHERE ks_projects.id = ks_project_subcontractors.project_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
);

CREATE POLICY "Subcontractors can view their own record"
ON ks_project_subcontractors FOR SELECT
USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage subcontractors in their company projects"
ON ks_project_subcontractors FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM ks_projects
    WHERE ks_projects.id = ks_project_subcontractors.project_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
);

-- RLS Policies for ks_subcontractor_contracts
CREATE POLICY "Users can view contracts for their company subcontractors"
ON ks_subcontractor_contracts FOR SELECT
USING (
  company_id = get_user_company_id(auth.uid())
  OR EXISTS (
    SELECT 1 FROM ks_project_subcontractors
    WHERE ks_project_subcontractors.id = ks_subcontractor_contracts.subcontractor_id
    AND ks_project_subcontractors.user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Users can manage contracts in their company"
ON ks_subcontractor_contracts FOR ALL
USING (company_id = get_user_company_id(auth.uid()));

-- RLS Policies for ks_subcontractor_competence
CREATE POLICY "Users can view competence for their company subcontractors"
ON ks_subcontractor_competence FOR SELECT
USING (
  company_id = get_user_company_id(auth.uid())
  OR EXISTS (
    SELECT 1 FROM ks_project_subcontractors
    WHERE ks_project_subcontractors.id = ks_subcontractor_competence.subcontractor_id
    AND ks_project_subcontractors.user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Users can manage competence in their company"
ON ks_subcontractor_competence FOR ALL
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Subcontractors can upload their own competence"
ON ks_subcontractor_competence FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ks_project_subcontractors
    WHERE ks_project_subcontractors.id = ks_subcontractor_competence.subcontractor_id
    AND ks_project_subcontractors.user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

-- RLS Policies for ks_subcontractor_inspections
CREATE POLICY "Users can view inspections for their company subcontractors"
ON ks_subcontractor_inspections FOR SELECT
USING (
  company_id = get_user_company_id(auth.uid())
  OR EXISTS (
    SELECT 1 FROM ks_project_subcontractors
    WHERE ks_project_subcontractors.id = ks_subcontractor_inspections.subcontractor_id
    AND ks_project_subcontractors.user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Users can manage inspections in their company"
ON ks_subcontractor_inspections FOR ALL
USING (company_id = get_user_company_id(auth.uid()));

-- Create storage bucket for subcontractor files
INSERT INTO storage.buckets (id, name, public)
VALUES ('subcontractor-files', 'subcontractor-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for subcontractor-files bucket
CREATE POLICY "Users can view subcontractor files from their company"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'subcontractor-files' AND
  (
    -- Company members can view
    EXISTS (
      SELECT 1 FROM ks_subcontractor_contracts
      WHERE ks_subcontractor_contracts.file_path = storage.objects.name
      AND ks_subcontractor_contracts.company_id = get_user_company_id(auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM ks_subcontractor_competence
      WHERE ks_subcontractor_competence.file_path = storage.objects.name
      AND ks_subcontractor_competence.company_id = get_user_company_id(auth.uid())
    )
    -- Subcontractors can view their own files
    OR EXISTS (
      SELECT 1 FROM ks_subcontractor_contracts sc
      JOIN ks_project_subcontractors ps ON ps.id = sc.subcontractor_id
      WHERE sc.file_path = storage.objects.name
      AND ps.user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM ks_subcontractor_competence sc
      JOIN ks_project_subcontractors ps ON ps.id = sc.subcontractor_id
      WHERE sc.file_path = storage.objects.name
      AND ps.user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  )
);

CREATE POLICY "Users can upload subcontractor files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'subcontractor-files');

CREATE POLICY "Users can update subcontractor files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'subcontractor-files');

CREATE POLICY "Users can delete subcontractor files"
ON storage.objects FOR DELETE
USING (bucket_id = 'subcontractor-files');

-- Create indexes
CREATE INDEX idx_ks_project_subcontractors_project_id ON ks_project_subcontractors(project_id);
CREATE INDEX idx_ks_project_subcontractors_user_id ON ks_project_subcontractors(user_id);
CREATE INDEX idx_ks_subcontractor_contracts_subcontractor_id ON ks_subcontractor_contracts(subcontractor_id);
CREATE INDEX idx_ks_subcontractor_competence_subcontractor_id ON ks_subcontractor_competence(subcontractor_id);
CREATE INDEX idx_ks_subcontractor_inspections_subcontractor_id ON ks_subcontractor_inspections(subcontractor_id);

-- Triggers for updated_at
CREATE TRIGGER update_ks_project_subcontractors_updated_at
BEFORE UPDATE ON ks_project_subcontractors
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ks_subcontractor_contracts_updated_at
BEFORE UPDATE ON ks_subcontractor_contracts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ks_subcontractor_competence_updated_at
BEFORE UPDATE ON ks_subcontractor_competence
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ks_subcontractor_inspections_updated_at
BEFORE UPDATE ON ks_subcontractor_inspections
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();