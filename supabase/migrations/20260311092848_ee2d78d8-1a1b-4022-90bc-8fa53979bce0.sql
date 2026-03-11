-- Allow employees to upload their own course certificates
CREATE POLICY "Users can upload own course certificates"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-certificates'
  AND (storage.foldername(name))[1] IN (
    SELECT p.company_id::text FROM profiles p WHERE p.user_id = auth.uid()
  )
  AND (storage.foldername(name))[2] IN (
    SELECT p.id::text FROM profiles p WHERE p.user_id = auth.uid()
  )
);

-- Allow employees to delete their own course certificates
CREATE POLICY "Users can delete own course certificates"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-certificates'
  AND (storage.foldername(name))[1] IN (
    SELECT p.company_id::text FROM profiles p WHERE p.user_id = auth.uid()
  )
  AND (storage.foldername(name))[2] IN (
    SELECT p.id::text FROM profiles p WHERE p.user_id = auth.uid()
  )
);