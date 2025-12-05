-- Create SJA table for KS Module 2
CREATE TABLE public.ks_module2_sja (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.ks_module2_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sja_number TEXT NOT NULL,
  title TEXT NOT NULL,
  work_description TEXT,
  location TEXT,
  planned_date DATE NOT NULL,
  responsible_name TEXT NOT NULL,
  responsible_id UUID REFERENCES public.profiles(id),
  participants TEXT[],
  identified_risks JSONB DEFAULT '[]'::jsonb,
  risk_reducing_measures JSONB DEFAULT '[]'::jsonb,
  overall_risk_level TEXT DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'draft',
  completed_at TIMESTAMPTZ,
  completed_by_name TEXT,
  completed_by_id UUID REFERENCES public.profiles(id),
  signature_data TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ks_module2_sja ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view SJA for their company" 
ON public.ks_module2_sja FOR SELECT 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create SJA for their company" 
ON public.ks_module2_sja FOR INSERT 
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update SJA for their company" 
ON public.ks_module2_sja FOR UPDATE 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete SJA for their company" 
ON public.ks_module2_sja FOR DELETE 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Index for faster lookups
CREATE INDEX idx_ks_module2_sja_project ON public.ks_module2_sja(project_id);
CREATE INDEX idx_ks_module2_sja_company ON public.ks_module2_sja(company_id);