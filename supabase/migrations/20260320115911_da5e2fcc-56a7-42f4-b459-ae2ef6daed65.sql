
-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Company members can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Company members can delete documents" ON storage.objects;

-- Recreate with proper scoping: users can only upload/delete in their own company's path
CREATE POLICY "Company members can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-documents'
  AND (storage.foldername(name))[1] = (SELECT company_id::text FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Company members can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-documents'
  AND (storage.foldername(name))[1] = (SELECT company_id::text FROM public.profiles WHERE user_id = auth.uid())
);
