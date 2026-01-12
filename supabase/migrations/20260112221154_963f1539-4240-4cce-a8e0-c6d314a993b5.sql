-- Create table for verneombud (safety representative) election/establishment
CREATE TABLE public.verneombud_agreements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  verneombud_name TEXT NOT NULL,
  verneombud_email TEXT,
  verneombud_phone TEXT,
  election_date DATE,
  election_method TEXT, -- e.g. 'election', 'appointment', 'volunteer'
  term_start DATE,
  term_end DATE,
  verneombud_signature TEXT,
  verneombud_signed_at TIMESTAMP WITH TIME ZONE,
  employer_name TEXT,
  employer_signature TEXT,
  employer_signed_at TIMESTAMP WITH TIME ZONE,
  training_completed BOOLEAN DEFAULT false,
  training_date DATE,
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.verneombud_agreements ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view verneombud agreements for their company"
ON public.verneombud_agreements
FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Company admins can insert verneombud agreements"
ON public.verneombud_agreements
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Company admins can update verneombud agreements"
ON public.verneombud_agreements
FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Company admins can delete verneombud agreements"
ON public.verneombud_agreements
FOR DELETE
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_verneombud_agreements_updated_at
BEFORE UPDATE ON public.verneombud_agreements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();