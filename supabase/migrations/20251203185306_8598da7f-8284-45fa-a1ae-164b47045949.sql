-- Create storage bucket for KS Module 2 documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ks-module2-documents',
  'ks-module2-documents',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for ks-module2-documents bucket
CREATE POLICY "Authenticated users can view ks module2 documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'ks-module2-documents');

CREATE POLICY "Company admins can upload ks module2 documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ks-module2-documents' AND
  (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);

CREATE POLICY "Company admins can delete ks module2 documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'ks-module2-documents' AND
  (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);