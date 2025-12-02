-- Opprett storage bucket for inspeksjonsbilder
INSERT INTO storage.buckets (id, name, public)
VALUES ('inspection-photos', 'inspection-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for inspection-photos bucket
CREATE POLICY "Users can upload inspection photos for their company"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'inspection-photos' AND
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE company_id IN (
      SELECT company_id FROM ks_project_inspections WHERE id::text = (storage.foldername(name))[1]
    )
  )
);

CREATE POLICY "Users can view inspection photos for their company"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'inspection-photos' AND
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE company_id IN (
      SELECT company_id FROM ks_project_inspections WHERE id::text = (storage.foldername(name))[1]
    )
  )
);

CREATE POLICY "Users can delete inspection photos for their company"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'inspection-photos' AND
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE company_id IN (
      SELECT company_id FROM ks_project_inspections WHERE id::text = (storage.foldername(name))[1]
    )
  )
);