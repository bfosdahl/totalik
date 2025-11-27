-- Create storage bucket for deviation attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('deviation-attachments', 'deviation-attachments', true);

-- Create deviation_attachments table to track files
CREATE TABLE public.deviation_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deviation_id UUID NOT NULL REFERENCES public.deviations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by UUID REFERENCES public.profiles(id),
  uploaded_by_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deviation_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for deviation_attachments
CREATE POLICY "Users can view attachments in their company"
ON public.deviation_attachments
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can upload attachments in their company"
ON public.deviation_attachments
FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can delete attachments"
ON public.deviation_attachments
FOR DELETE
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);

CREATE POLICY "System admins can manage all attachments"
ON public.deviation_attachments
FOR ALL
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));

-- Storage policies for deviation-attachments bucket
CREATE POLICY "Users can view deviation attachments in their company"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'deviation-attachments'
  AND EXISTS (
    SELECT 1 FROM public.deviation_attachments da
    WHERE da.file_path = name
    AND da.company_id = get_user_company_id(auth.uid())
  )
);

CREATE POLICY "Users can upload deviation attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'deviation-attachments'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Company admins can delete deviation attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'deviation-attachments'
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);

-- Create index for faster queries
CREATE INDEX idx_deviation_attachments_deviation_id ON public.deviation_attachments(deviation_id);
CREATE INDEX idx_deviation_attachments_company_id ON public.deviation_attachments(company_id);