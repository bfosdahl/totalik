-- Create ks_module2_change_orders table for endringsmeldinger
CREATE TABLE public.ks_module2_change_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.ks_module2_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  change_order_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  reason TEXT,
  requested_by TEXT,
  requested_date DATE DEFAULT CURRENT_DATE,
  estimated_hours NUMERIC(10,2),
  hourly_rate NUMERIC(10,2),
  material_cost NUMERIC(10,2) DEFAULT 0,
  total_cost NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'draft',
  customer_approved BOOLEAN DEFAULT FALSE,
  customer_approved_at TIMESTAMP WITH TIME ZONE,
  customer_approved_by TEXT,
  customer_signature TEXT,
  internal_notes TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  created_by_name TEXT
);

-- Create sequence for change order numbers
CREATE SEQUENCE IF NOT EXISTS ks_module2_change_order_number_seq START 1;

-- Function to generate change order number
CREATE OR REPLACE FUNCTION public.generate_ks_module2_change_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
  order_num TEXT;
BEGIN
  next_num := nextval('ks_module2_change_order_number_seq');
  order_num := 'EM-' || LPAD(next_num::TEXT, 4, '0');
  RETURN order_num;
END;
$$;

-- Trigger to auto-generate change order number
CREATE OR REPLACE FUNCTION public.set_ks_module2_change_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.change_order_number IS NULL OR NEW.change_order_number = '' THEN
    NEW.change_order_number := generate_ks_module2_change_order_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_ks_module2_change_order_number_trigger
  BEFORE INSERT ON public.ks_module2_change_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_ks_module2_change_order_number();

-- Enable RLS
ALTER TABLE public.ks_module2_change_orders ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view change orders for their company"
  ON public.ks_module2_change_orders
  FOR SELECT
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
    OR public.is_system_admin(auth.uid())
  );

CREATE POLICY "Users can create change orders for their company"
  ON public.ks_module2_change_orders
  FOR INSERT
  WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
    OR public.is_system_admin(auth.uid())
  );

CREATE POLICY "Users can update change orders for their company"
  ON public.ks_module2_change_orders
  FOR UPDATE
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
    OR public.is_system_admin(auth.uid())
  );

CREATE POLICY "Users can delete change orders for their company"
  ON public.ks_module2_change_orders
  FOR DELETE
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
    OR public.is_system_admin(auth.uid())
  );

-- Index for faster queries
CREATE INDEX idx_ks_module2_change_orders_project ON public.ks_module2_change_orders(project_id);
CREATE INDEX idx_ks_module2_change_orders_company ON public.ks_module2_change_orders(company_id);
CREATE INDEX idx_ks_module2_change_orders_status ON public.ks_module2_change_orders(status);