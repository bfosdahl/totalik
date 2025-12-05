-- Add storage policies for ks-module2-files bucket to allow file access
CREATE POLICY "Public read access for ks-module2-files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ks-module2-files');

CREATE POLICY "Authenticated users can upload to ks-module2-files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ks-module2-files');

CREATE POLICY "Authenticated users can update their files in ks-module2-files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'ks-module2-files');

CREATE POLICY "Authenticated users can delete their files in ks-module2-files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'ks-module2-files');