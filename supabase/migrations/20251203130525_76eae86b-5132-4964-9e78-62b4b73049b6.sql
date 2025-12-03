-- Fix storage bucket for admin documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-documents', 'admin-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "System admins can upload admin documents" ON storage.objects;
DROP POLICY IF EXISTS "System admins can read admin documents" ON storage.objects;
DROP POLICY IF EXISTS "System admins can delete admin documents" ON storage.objects;
DROP POLICY IF EXISTS "System admins can update admin documents" ON storage.objects;

-- Create storage policies using is_system_admin function
CREATE POLICY "System admins can upload admin documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'admin-documents' 
  AND public.is_system_admin(auth.uid())
);

CREATE POLICY "System admins can read admin documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'admin-documents' 
  AND public.is_system_admin(auth.uid())
);

CREATE POLICY "System admins can update admin documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'admin-documents' 
  AND public.is_system_admin(auth.uid())
);

CREATE POLICY "System admins can delete admin documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'admin-documents' 
  AND public.is_system_admin(auth.uid())
);