-- Create IK/HMS stoffkartotek table
CREATE TABLE IF NOT EXISTS public.ik_hms_stoffkartotek (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  manufacturer TEXT,
  danger_classes TEXT[] DEFAULT '{}',
  location TEXT,
  sds_file_path TEXT,
  notes TEXT,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ik_hms_stoffkartotek ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their company's stoffkartotek"
  ON public.ik_hms_stoffkartotek
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create stoffkartotek for their company"
  ON public.ik_hms_stoffkartotek
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company's stoffkartotek"
  ON public.ik_hms_stoffkartotek
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company's stoffkartotek"
  ON public.ik_hms_stoffkartotek
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Create index for faster queries
CREATE INDEX idx_ik_hms_stoffkartotek_company_id ON public.ik_hms_stoffkartotek(company_id);
CREATE INDEX idx_ik_hms_stoffkartotek_product_name ON public.ik_hms_stoffkartotek(product_name);