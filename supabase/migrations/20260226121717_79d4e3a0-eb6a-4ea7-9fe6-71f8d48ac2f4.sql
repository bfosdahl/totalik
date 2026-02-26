
-- Table for tracking employee training confirmations for IK Alkohol
CREATE TABLE public.ik_alkohol_training_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  employee_name TEXT NOT NULL,
  training_topic TEXT NOT NULL DEFAULT 'Alkohollovgivning og internkontroll',
  training_description TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  signature_data TEXT,
  signed_digitally BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ik_alkohol_training_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view training records for their company"
  ON public.ik_alkohol_training_records FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert training records for their company"
  ON public.ik_alkohol_training_records FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update training records for their company"
  ON public.ik_alkohol_training_records FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete training records for their company"
  ON public.ik_alkohol_training_records FOR DELETE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));
