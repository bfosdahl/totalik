-- Create stoffkartotek table for chemical products
CREATE TABLE public.ks_module2_stoffkartotek (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.ks_module2_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  manufacturer TEXT,
  danger_classes TEXT[] DEFAULT '{}',
  location TEXT,
  sds_file_path TEXT,
  notes TEXT,
  last_updated DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ks_module2_stoffkartotek ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view stoffkartotek in their company"
ON public.ks_module2_stoffkartotek
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create stoffkartotek in their company"
ON public.ks_module2_stoffkartotek
FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update stoffkartotek in their company"
ON public.ks_module2_stoffkartotek
FOR UPDATE
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete stoffkartotek in their company"
ON public.ks_module2_stoffkartotek
FOR DELETE
USING (company_id = get_user_company_id(auth.uid()));