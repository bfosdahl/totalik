-- Create table for independent control (Uavhengig kontroll)
CREATE TABLE public.ks_module2_uk (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.ks_module2_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  uk_number TEXT NOT NULL,
  control_area TEXT NOT NULL,
  description TEXT,
  controller_name TEXT,
  controller_company TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  control_date DATE,
  deadline DATE,
  comments TEXT,
  result TEXT,
  document_paths TEXT[],
  created_by_name TEXT NOT NULL,
  created_by_user_id UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sequence for UK numbers
CREATE SEQUENCE IF NOT EXISTS ks_module2_uk_number_seq START 1;

-- Create function to generate UK number
CREATE OR REPLACE FUNCTION public.generate_ks_module2_uk_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
  uk_num TEXT;
BEGIN
  next_num := nextval('ks_module2_uk_number_seq');
  uk_num := 'UK-' || LPAD(next_num::TEXT, 4, '0');
  RETURN uk_num;
END;
$$;

-- Create trigger to auto-set UK number
CREATE OR REPLACE FUNCTION public.set_ks_module2_uk_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.uk_number IS NULL OR NEW.uk_number = '' THEN
    NEW.uk_number := generate_ks_module2_uk_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_uk_number_trigger
  BEFORE INSERT ON public.ks_module2_uk
  FOR EACH ROW
  EXECUTE FUNCTION set_ks_module2_uk_number();

-- Add updated_at trigger
CREATE TRIGGER update_ks_module2_uk_updated_at
  BEFORE UPDATE ON public.ks_module2_uk
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.ks_module2_uk ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view UK in their company"
  ON public.ks_module2_uk FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create UK in their company"
  ON public.ks_module2_uk FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update UK in their company"
  ON public.ks_module2_uk FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can delete UK in their company"
  ON public.ks_module2_uk FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));

CREATE POLICY "System admins can manage all UK"
  ON public.ks_module2_uk FOR ALL
  USING (is_system_admin(auth.uid()))
  WITH CHECK (is_system_admin(auth.uid()));