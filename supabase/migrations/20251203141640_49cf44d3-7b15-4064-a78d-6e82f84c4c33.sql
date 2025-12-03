-- Create the missing ks-project-documents bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('ks-project-documents', 'ks-project-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the bucket
CREATE POLICY "Company members can view project documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ks-project-documents' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] IN (
    SELECT company_id::text FROM profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Company members can upload project documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ks-project-documents' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] IN (
    SELECT company_id::text FROM profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Company members can delete project documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'ks-project-documents' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] IN (
    SELECT company_id::text FROM profiles WHERE user_id = auth.uid()
  )
);