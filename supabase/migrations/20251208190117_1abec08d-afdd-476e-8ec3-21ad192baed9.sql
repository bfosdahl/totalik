-- Add include_in_pdf and signature tracking fields to ik_hms_company_documents
ALTER TABLE public.ik_hms_company_documents
ADD COLUMN IF NOT EXISTS include_in_pdf boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS requires_signature boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS upload_deadline_days integer,
ADD COLUMN IF NOT EXISTS original_document_id uuid REFERENCES public.ik_hms_company_documents(id) ON DELETE SET NULL;