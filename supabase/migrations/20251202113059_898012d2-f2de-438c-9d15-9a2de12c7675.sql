-- Add file_path column to ks_routines table for uploaded documents
ALTER TABLE ks_routines ADD COLUMN file_path TEXT;

-- Create storage bucket for routine documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('ks-routine-documents', 'ks-routine-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for ks-routine-documents bucket
CREATE POLICY "Users can view their company's routine documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ks-routine-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT company_id::text FROM profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can upload routine documents for their company"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ks-routine-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT company_id::text FROM profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their company's routine documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'ks-routine-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT company_id::text FROM profiles WHERE user_id = auth.uid()
  )
);