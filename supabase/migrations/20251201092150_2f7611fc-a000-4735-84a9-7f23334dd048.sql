-- Add certificate file path column to employee_courses
ALTER TABLE public.employee_courses
ADD COLUMN IF NOT EXISTS certificate_file_path text;

-- Create storage bucket for course certificates if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-certificates', 'course-certificates', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for course certificates bucket
CREATE POLICY "Users can view course certificates in their company"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'course-certificates' AND
  (storage.foldername(name))[1] IN (
    SELECT p.company_id::text FROM profiles p WHERE p.id = auth.uid()
  )
);

CREATE POLICY "Company admins can upload course certificates"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-certificates' AND
  (storage.foldername(name))[1] IN (
    SELECT p.company_id::text FROM profiles p WHERE p.id = auth.uid()
  ) AND
  (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);

CREATE POLICY "Company admins can delete course certificates"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-certificates' AND
  (storage.foldername(name))[1] IN (
    SELECT p.company_id::text FROM profiles p WHERE p.id = auth.uid()
  ) AND
  (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);