-- Add SELECT policy for ks-module2-checklist-photos bucket
CREATE POLICY "Users can view checklist photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'ks-module2-checklist-photos' AND auth.uid() IS NOT NULL);

-- Also add UPDATE policy in case users need to update photos
CREATE POLICY "Users can update checklist photos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'ks-module2-checklist-photos' AND auth.uid() IS NOT NULL);