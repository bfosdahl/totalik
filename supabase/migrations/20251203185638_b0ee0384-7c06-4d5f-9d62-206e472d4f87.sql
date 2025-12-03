-- Create KS Module 2 Deviations table
CREATE TABLE public.ks_module2_avvik (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.ks_module2_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  avvik_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'kvalitet',
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  location TEXT,
  discovered_date DATE NOT NULL DEFAULT CURRENT_DATE,
  deadline DATE,
  responsible_name TEXT,
  responsible_user_id UUID REFERENCES auth.users(id),
  reported_by_name TEXT NOT NULL,
  reported_by_user_id UUID REFERENCES auth.users(id),
  root_cause TEXT,
  corrective_action TEXT,
  preventive_action TEXT,
  closed_at TIMESTAMP WITH TIME ZONE,
  closed_by_name TEXT,
  photo_paths TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sequence for avvik numbers
CREATE SEQUENCE IF NOT EXISTS ks_module2_avvik_number_seq START WITH 1;

-- Enable RLS
ALTER TABLE public.ks_module2_avvik ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their company avvik"
ON public.ks_module2_avvik FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create avvik in their company"
ON public.ks_module2_avvik FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update their company avvik"
ON public.ks_module2_avvik FOR UPDATE
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can delete avvik"
ON public.ks_module2_avvik FOR DELETE
USING (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));

-- Function to generate avvik number
CREATE OR REPLACE FUNCTION public.generate_ks_module2_avvik_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_num integer;
  avvik_num text;
BEGIN
  next_num := nextval('ks_module2_avvik_number_seq');
  avvik_num := 'AVV-' || LPAD(next_num::text, 4, '0');
  RETURN avvik_num;
END;
$$;

-- Trigger to auto-set avvik number
CREATE OR REPLACE FUNCTION public.set_ks_module2_avvik_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.avvik_number IS NULL OR NEW.avvik_number = '' THEN
    NEW.avvik_number := generate_ks_module2_avvik_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_ks_module2_avvik_number_trigger
BEFORE INSERT ON public.ks_module2_avvik
FOR EACH ROW
EXECUTE FUNCTION set_ks_module2_avvik_number();

-- Update timestamp trigger
CREATE TRIGGER update_ks_module2_avvik_updated_at
BEFORE UPDATE ON public.ks_module2_avvik
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();