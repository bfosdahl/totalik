-- Create admin_documents table for system-wide document storage
CREATE TABLE public.admin_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'other',
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  description TEXT,
  uploaded_by_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Only system admins can view documents
CREATE POLICY "System admins can view admin documents"
ON public.admin_documents
FOR SELECT
USING (public.is_system_admin(auth.uid()));

-- Policy: Only system admins can insert documents
CREATE POLICY "System admins can insert admin documents"
ON public.admin_documents
FOR INSERT
WITH CHECK (public.is_system_admin(auth.uid()));

-- Policy: Only system admins can delete documents
CREATE POLICY "System admins can delete admin documents"
ON public.admin_documents
FOR DELETE
USING (public.is_system_admin(auth.uid()));

-- Create storage bucket for admin documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-documents', 'admin-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "System admins can view admin document files"
ON storage.objects FOR SELECT
USING (bucket_id = 'admin-documents' AND public.is_system_admin(auth.uid()));

CREATE POLICY "System admins can upload admin document files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'admin-documents' AND public.is_system_admin(auth.uid()));

CREATE POLICY "System admins can delete admin document files"
ON storage.objects FOR DELETE
USING (bucket_id = 'admin-documents' AND public.is_system_admin(auth.uid()));