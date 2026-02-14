
-- Create calculations table for KS Bygg project estimates
CREATE TABLE public.ks_calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.ks_module2_projects(id) ON DELETE SET NULL,
  calculation_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  client_name TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by_id UUID REFERENCES public.profiles(id),
  created_by_name TEXT NOT NULL DEFAULT '',
  markup_percent NUMERIC DEFAULT 0,
  vat_percent NUMERIC DEFAULT 25,
  total_hours_cost NUMERIC DEFAULT 0,
  total_materials_cost NUMERIC DEFAULT 0,
  total_equipment_cost NUMERIC DEFAULT 0,
  total_other_cost NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create line items table
CREATE TABLE public.ks_calculation_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  calculation_id UUID NOT NULL REFERENCES public.ks_calculations(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'materials',
  description TEXT NOT NULL,
  unit TEXT DEFAULT 'stk',
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC GENERATED ALWAYS AS (quantity * unit_price) STORED,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ks_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ks_calculation_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for ks_calculations
CREATE POLICY "Users can view calculations in their company"
  ON public.ks_calculations FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create calculations in their company"
  ON public.ks_calculations FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update calculations in their company"
  ON public.ks_calculations FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete calculations in their company"
  ON public.ks_calculations FOR DELETE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- RLS policies for ks_calculation_items
CREATE POLICY "Users can view calculation items"
  ON public.ks_calculation_items FOR SELECT
  USING (calculation_id IN (
    SELECT id FROM public.ks_calculations WHERE company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can create calculation items"
  ON public.ks_calculation_items FOR INSERT
  WITH CHECK (calculation_id IN (
    SELECT id FROM public.ks_calculations WHERE company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can update calculation items"
  ON public.ks_calculation_items FOR UPDATE
  USING (calculation_id IN (
    SELECT id FROM public.ks_calculations WHERE company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can delete calculation items"
  ON public.ks_calculation_items FOR DELETE
  USING (calculation_id IN (
    SELECT id FROM public.ks_calculations WHERE company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  ));

-- Updated_at trigger
CREATE TRIGGER update_ks_calculations_updated_at
  BEFORE UPDATE ON public.ks_calculations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
