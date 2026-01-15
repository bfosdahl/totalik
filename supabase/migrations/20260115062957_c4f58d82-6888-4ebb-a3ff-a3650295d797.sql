-- Create table for user-uploaded documents per module
CREATE TABLE public.company_module_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  module_type TEXT NOT NULL CHECK (module_type IN ('ik-mat', 'ik-alkohol', 'ik-hms')),
  folder_name TEXT,
  document_name TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by_id UUID REFERENCES public.profiles(id),
  uploaded_by_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_module_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for company members
CREATE POLICY "Users can view their company documents"
  ON public.company_module_documents FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert documents for their company"
  ON public.company_module_documents FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company documents"
  ON public.company_module_documents FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company documents"
  ON public.company_module_documents FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- System admins full access
CREATE POLICY "System admins have full access to module documents"
  ON public.company_module_documents FOR ALL
  USING (public.is_system_admin(auth.uid()));

-- Create storage bucket for module documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-module-documents', 'company-module-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the bucket
CREATE POLICY "Users can view their company module documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'company-module-documents' 
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.companies 
      WHERE id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can upload module documents to their company"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'company-module-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.companies 
      WHERE id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can delete their company module documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'company-module-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.companies 
      WHERE id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
    )
  );

-- Create index for faster queries
CREATE INDEX idx_company_module_documents_company_module 
  ON public.company_module_documents(company_id, module_type);

-- Update trigger for updated_at
CREATE TRIGGER update_company_module_documents_updated_at
  BEFORE UPDATE ON public.company_module_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();