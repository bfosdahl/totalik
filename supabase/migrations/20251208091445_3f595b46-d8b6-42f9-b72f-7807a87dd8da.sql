-- Create table for HMS self-declarations (Egenerklæring om HMS)
CREATE TABLE public.hms_self_declarations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_address TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT DEFAULT 'Norge',
  declaration_date DATE NOT NULL DEFAULT CURRENT_DATE,
  manager_name TEXT,
  manager_signature TEXT,
  manager_signed_at TIMESTAMPTZ,
  employee_rep_name TEXT,
  employee_rep_signature TEXT,
  employee_rep_signed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hms_self_declarations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their company's HMS declarations"
ON public.hms_self_declarations
FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can create HMS declarations for their company"
ON public.hms_self_declarations
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update their company's HMS declarations"
ON public.hms_self_declarations
FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete their company's HMS declarations"
ON public.hms_self_declarations
FOR DELETE
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_hms_self_declarations_updated_at
BEFORE UPDATE ON public.hms_self_declarations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();