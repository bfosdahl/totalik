-- Allow employees to insert their own documents
CREATE POLICY "Users can insert their own documents"
ON public.employee_documents
FOR INSERT
TO authenticated
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND employee_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

-- Allow employees to delete their own documents
CREATE POLICY "Users can delete their own documents"
ON public.employee_documents
FOR DELETE
TO authenticated
USING (
  employee_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

-- Allow employees to upload their own documents to storage
CREATE POLICY "Users can upload own employee documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'employee-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT p.company_id::text FROM profiles p WHERE p.user_id = auth.uid()
  )
  AND (storage.foldername(name))[2] IN (
    SELECT p.id::text FROM profiles p WHERE p.user_id = auth.uid()
  )
);

-- Allow employees to view their own documents in storage
CREATE POLICY "Users can view own employee documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'employee-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT p.company_id::text FROM profiles p WHERE p.user_id = auth.uid()
  )
  AND (storage.foldername(name))[2] IN (
    SELECT p.id::text FROM profiles p WHERE p.user_id = auth.uid()
  )
);

-- Allow employees to delete their own documents from storage
CREATE POLICY "Users can delete own employee documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'employee-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT p.company_id::text FROM profiles p WHERE p.user_id = auth.uid()
  )
  AND (storage.foldername(name))[2] IN (
    SELECT p.id::text FROM profiles p WHERE p.user_id = auth.uid()
  )
);