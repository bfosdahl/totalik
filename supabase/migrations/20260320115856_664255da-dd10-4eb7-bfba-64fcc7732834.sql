
-- Create the missing storage bucket for company KS documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-documents', 'company-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for authenticated users to manage their company's documents
CREATE POLICY "Company members can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-documents');

CREATE POLICY "Company members can view documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'company-documents');

CREATE POLICY "Company members can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'company-documents');
