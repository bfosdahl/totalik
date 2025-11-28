-- Create storage bucket for project documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-documents', 'project-documents', false);

-- Create table for project documents
CREATE TABLE ks_project_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ks_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Document metadata
  document_name TEXT NOT NULL,
  document_number TEXT, -- e.g., "Tegning 123" or "Rev A"
  category TEXT NOT NULL, -- 'tegninger', 'beskrivelser', 'sha_plan', 'bilder', 'endringsmeldinger', 'fdv', 'samsvar'
  
  -- Version control
  version INTEGER NOT NULL DEFAULT 1,
  is_latest_version BOOLEAN NOT NULL DEFAULT true,
  supersedes_document_id UUID REFERENCES ks_project_documents(id),
  
  -- File info
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  
  -- Metadata
  description TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_by_name TEXT NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE ks_project_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view documents for their company projects"
ON ks_project_documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM ks_projects
    WHERE ks_projects.id = ks_project_documents.project_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
);

CREATE POLICY "Users can upload documents to their company projects"
ON ks_project_documents FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ks_projects
    WHERE ks_projects.id = ks_project_documents.project_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
);

CREATE POLICY "Users can update documents in their company projects"
ON ks_project_documents FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM ks_projects
    WHERE ks_projects.id = ks_project_documents.project_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
);

CREATE POLICY "Users can delete documents from their company projects"
ON ks_project_documents FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM ks_projects
    WHERE ks_projects.id = ks_project_documents.project_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
);

-- Storage policies for project-documents bucket
CREATE POLICY "Users can view project documents from their company"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-documents' AND
  EXISTS (
    SELECT 1 FROM ks_project_documents
    WHERE ks_project_documents.file_path = storage.objects.name
    AND EXISTS (
      SELECT 1 FROM ks_projects
      WHERE ks_projects.id = ks_project_documents.project_id
      AND ks_projects.company_id = get_user_company_id(auth.uid())
    )
  )
);

CREATE POLICY "Users can upload documents to their company projects"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-documents'
);

CREATE POLICY "Users can update their company project documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'project-documents'
);

CREATE POLICY "Users can delete their company project documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-documents'
);

-- Create index for faster queries
CREATE INDEX idx_ks_project_documents_project_id ON ks_project_documents(project_id);
CREATE INDEX idx_ks_project_documents_category ON ks_project_documents(category);
CREATE INDEX idx_ks_project_documents_latest_version ON ks_project_documents(project_id, category, is_latest_version);

-- Trigger for updated_at
CREATE TRIGGER update_ks_project_documents_updated_at
BEFORE UPDATE ON ks_project_documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();