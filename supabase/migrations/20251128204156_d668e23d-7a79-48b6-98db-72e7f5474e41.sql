-- Create table for storing completed audit form responses
CREATE TABLE public.audit_form_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  audit_id UUID REFERENCES public.audits(id) ON DELETE SET NULL,
  form_type TEXT NOT NULL CHECK (form_type IN ('annual_hms', 'elkontroll', 'fysiske_forhold', 'daglig_drift')),
  form_data JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  completed_by_name TEXT,
  revision_date DATE,
  participants TEXT,
  auditor_name TEXT,
  manager_name TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_form_responses ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their company audit form responses"
  ON public.audit_form_responses FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create audit form responses for their company"
  ON public.audit_form_responses FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their company audit form responses"
  ON public.audit_form_responses FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete their company audit form responses"
  ON public.audit_form_responses FOR DELETE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_audit_form_responses_company ON public.audit_form_responses(company_id);
CREATE INDEX idx_audit_form_responses_form_type ON public.audit_form_responses(form_type);

-- Add form_type column to audits table to link planned audits to form types
ALTER TABLE public.audits ADD COLUMN form_type TEXT CHECK (form_type IN ('annual_hms', 'elkontroll', 'fysiske_forhold', 'daglig_drift'));

-- Create trigger for updated_at
CREATE TRIGGER update_audit_form_responses_updated_at
  BEFORE UPDATE ON public.audit_form_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();