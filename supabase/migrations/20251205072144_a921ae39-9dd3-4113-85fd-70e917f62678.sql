-- Create Vernerunder table for KS Module 2
CREATE TABLE public.ks_module2_vernerunder (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.ks_module2_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  vernerunde_number TEXT NOT NULL,
  title TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  responsible_name TEXT NOT NULL,
  responsible_id UUID REFERENCES public.profiles(id),
  participants TEXT[],
  status TEXT NOT NULL DEFAULT 'planned',
  findings JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  completed_by_name TEXT,
  completed_by_id UUID REFERENCES public.profiles(id),
  signature_data TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ks_module2_vernerunder ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view vernerunder for their company" 
ON public.ks_module2_vernerunder FOR SELECT 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create vernerunder for their company" 
ON public.ks_module2_vernerunder FOR INSERT 
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update vernerunder for their company" 
ON public.ks_module2_vernerunder FOR UPDATE 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete vernerunder for their company" 
ON public.ks_module2_vernerunder FOR DELETE 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Indexes
CREATE INDEX idx_ks_module2_vernerunder_project ON public.ks_module2_vernerunder(project_id);
CREATE INDEX idx_ks_module2_vernerunder_company ON public.ks_module2_vernerunder(company_id);