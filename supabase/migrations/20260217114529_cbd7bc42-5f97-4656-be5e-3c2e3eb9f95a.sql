
-- Create KS Self Declarations table (same pattern as hms_self_declarations)
CREATE TABLE public.ks_self_declarations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  company_name TEXT NOT NULL,
  company_address TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT DEFAULT 'Norge',
  declaration_date DATE,
  manager_name TEXT,
  manager_signature TEXT,
  manager_signed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ks_self_declarations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own company KS declarations"
  ON public.ks_self_declarations FOR SELECT
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert own company KS declarations"
  ON public.ks_self_declarations FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Users can update own company KS declarations"
  ON public.ks_self_declarations FOR UPDATE
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete own company KS declarations"
  ON public.ks_self_declarations FOR DELETE
  USING (company_id = public.get_user_company_id(auth.uid()));

-- Updated_at trigger
CREATE TRIGGER update_ks_self_declarations_updated_at
  BEFORE UPDATE ON public.ks_self_declarations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
