-- Create table for simple project inspections/befaringer
CREATE TABLE public.simple_project_inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.ks_module2_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  inspection_number TEXT NOT NULL,
  title TEXT NOT NULL,
  inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  location TEXT,
  weather TEXT,
  participants TEXT,
  notes TEXT,
  findings JSONB DEFAULT '[]'::jsonb,
  photos TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  created_by_id UUID REFERENCES auth.users(id),
  created_by_name TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.simple_project_inspections ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view inspections for their company"
ON public.simple_project_inspections
FOR SELECT
USING (
  company_id IN (
    SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create inspections for their company"
ON public.simple_project_inspections
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update inspections for their company"
ON public.simple_project_inspections
FOR UPDATE
USING (
  company_id IN (
    SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete inspections for their company"
ON public.simple_project_inspections
FOR DELETE
USING (
  company_id IN (
    SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid()
  )
);

-- Create sequence for inspection numbers per company
CREATE OR REPLACE FUNCTION generate_inspection_number(p_company_id UUID)
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(inspection_number FROM 'BEF-(\d+)') AS INTEGER)), 0) + 1
  INTO next_num
  FROM simple_project_inspections
  WHERE company_id = p_company_id;
  
  RETURN 'BEF-' || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER update_simple_project_inspections_updated_at
BEFORE UPDATE ON public.simple_project_inspections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();