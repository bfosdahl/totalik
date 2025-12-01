-- Create storage bucket for traceability documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('ik-mat-traceability', 'ik-mat-traceability', false)
ON CONFLICT (id) DO NOTHING;

-- Create traceability records table
CREATE TABLE IF NOT EXISTS public.ik_mat_traceability_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  batch_number TEXT,
  production_date DATE,
  receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  receipt_temperature NUMERIC,
  document_path TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Add indexes
CREATE INDEX idx_ik_mat_traceability_company ON public.ik_mat_traceability_records(company_id);
CREATE INDEX idx_ik_mat_traceability_batch ON public.ik_mat_traceability_records(batch_number);
CREATE INDEX idx_ik_mat_traceability_receipt_date ON public.ik_mat_traceability_records(receipt_date DESC);

-- Enable RLS
ALTER TABLE public.ik_mat_traceability_records ENABLE ROW LEVEL SECURITY;

-- RLS policies for traceability records
CREATE POLICY "Users can view their company traceability records"
  ON public.ik_mat_traceability_records
  FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create traceability records for their company"
  ON public.ik_mat_traceability_records
  FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update their company traceability records"
  ON public.ik_mat_traceability_records
  FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can delete traceability records"
  ON public.ik_mat_traceability_records
  FOR DELETE
  USING (
    company_id = get_user_company_id(auth.uid()) 
    AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
  );

-- RLS policies for storage bucket
CREATE POLICY "Users can view their company traceability documents"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'ik-mat-traceability' 
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.companies WHERE id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "Users can upload traceability documents for their company"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'ik-mat-traceability' 
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.companies WHERE id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "Users can update their company traceability documents"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'ik-mat-traceability' 
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.companies WHERE id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "Company admins can delete traceability documents"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'ik-mat-traceability' 
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.companies WHERE id = get_user_company_id(auth.uid())
    )
    AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
  );

-- Add updated_at trigger
CREATE TRIGGER update_ik_mat_traceability_updated_at
  BEFORE UPDATE ON public.ik_mat_traceability_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();