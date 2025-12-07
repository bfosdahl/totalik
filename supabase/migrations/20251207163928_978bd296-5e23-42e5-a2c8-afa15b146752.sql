
-- Create table for project claims/reklamasjoner
CREATE TABLE public.ks_module2_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.ks_module2_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  claim_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  reported_by TEXT,
  reported_date DATE NOT NULL DEFAULT CURRENT_DATE,
  deadline DATE,
  responsible_name TEXT,
  responsible_id UUID REFERENCES public.profiles(id),
  resolution TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  cost_estimate NUMERIC(12,2),
  actual_cost NUMERIC(12,2),
  photos TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sequence for claim numbers
CREATE SEQUENCE IF NOT EXISTS ks_module2_claim_number_seq START 1;

-- Function to generate claim number
CREATE OR REPLACE FUNCTION public.generate_ks_module2_claim_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
  claim_num TEXT;
BEGIN
  next_num := nextval('ks_module2_claim_number_seq');
  claim_num := 'REK-' || LPAD(next_num::TEXT, 4, '0');
  RETURN claim_num;
END;
$$;

-- Trigger to auto-set claim number
CREATE OR REPLACE FUNCTION public.set_ks_module2_claim_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.claim_number IS NULL OR NEW.claim_number = '' THEN
    NEW.claim_number := generate_ks_module2_claim_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_claim_number
BEFORE INSERT ON public.ks_module2_claims
FOR EACH ROW
EXECUTE FUNCTION public.set_ks_module2_claim_number();

-- Enable RLS
ALTER TABLE public.ks_module2_claims ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view claims for their company" 
ON public.ks_module2_claims 
FOR SELECT 
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create claims for their company" 
ON public.ks_module2_claims 
FOR INSERT 
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update claims for their company" 
ON public.ks_module2_claims 
FOR UPDATE 
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete claims for their company" 
ON public.ks_module2_claims 
FOR DELETE 
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- Guest access policy
CREATE POLICY "Guests can view claims for their projects"
ON public.ks_module2_claims
FOR SELECT
USING (has_guest_project_access(project_id));

-- Indexes
CREATE INDEX idx_ks_module2_claims_project ON public.ks_module2_claims(project_id);
CREATE INDEX idx_ks_module2_claims_company ON public.ks_module2_claims(company_id);
CREATE INDEX idx_ks_module2_claims_status ON public.ks_module2_claims(status);

-- Updated at trigger
CREATE TRIGGER update_ks_module2_claims_updated_at
BEFORE UPDATE ON public.ks_module2_claims
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
