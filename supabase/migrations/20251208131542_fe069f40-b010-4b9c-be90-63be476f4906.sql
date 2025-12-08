-- Create table for company-specific IK HMS documents
CREATE TABLE public.ik_hms_company_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Generelt',
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_by_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ik_hms_company_documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their company documents"
  ON public.ik_hms_company_documents
  FOR SELECT
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert documents for their company"
  ON public.ik_hms_company_documents
  FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete their company documents"
  ON public.ik_hms_company_documents
  FOR DELETE
  USING (company_id = public.get_user_company_id(auth.uid()));

-- Create storage bucket for IK HMS documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('ik-hms-documents', 'ik-hms-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for ik-hms-documents bucket
CREATE POLICY "Users can upload to their company folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ik-hms-documents' 
    AND (storage.foldername(name))[1] = public.get_user_company_id(auth.uid())::text
  );

CREATE POLICY "Users can view their company documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ik-hms-documents' 
    AND (storage.foldername(name))[1] = public.get_user_company_id(auth.uid())::text
  );

CREATE POLICY "Users can delete their company documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'ik-hms-documents' 
    AND (storage.foldername(name))[1] = public.get_user_company_id(auth.uid())::text
  );

-- Add update trigger
CREATE TRIGGER update_ik_hms_company_documents_updated_at
  BEFORE UPDATE ON public.ik_hms_company_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();