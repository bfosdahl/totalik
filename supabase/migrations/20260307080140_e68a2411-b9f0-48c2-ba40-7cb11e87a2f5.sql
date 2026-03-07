
-- Travel expense reports (Reiseregninger)
CREATE TABLE public.travel_expense_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  report_number TEXT NOT NULL,
  
  -- Travel details
  purpose TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_date DATE NOT NULL,
  return_date DATE NOT NULL,
  departure_location TEXT NOT NULL DEFAULT '',
  
  -- Mileage allowance
  total_km NUMERIC(10,1) NOT NULL DEFAULT 0,
  mileage_rate NUMERIC(6,2) NOT NULL DEFAULT 3.50,
  mileage_amount NUMERIC(10,2) GENERATED ALWAYS AS (total_km * mileage_rate) STORED,
  passenger_supplement NUMERIC(10,2) NOT NULL DEFAULT 0,
  
  -- Diet/accommodation
  diet_days INTEGER NOT NULL DEFAULT 0,
  diet_rate NUMERIC(8,2) NOT NULL DEFAULT 0,
  diet_amount NUMERIC(10,2) GENERATED ALWAYS AS (diet_days * diet_rate) STORED,
  accommodation_days INTEGER NOT NULL DEFAULT 0,
  accommodation_rate NUMERIC(8,2) NOT NULL DEFAULT 0,
  accommodation_amount NUMERIC(10,2) GENERATED ALWAYS AS (accommodation_days * accommodation_rate) STORED,
  
  -- Totals
  other_expenses_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  
  -- Linked driving log trips
  linked_trip_ids UUID[] DEFAULT '{}',
  
  -- Approval
  status TEXT NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  approved_by_id UUID REFERENCES public.profiles(id),
  approved_by_name TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Expense line items for a travel report
CREATE TABLE public.travel_expense_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.travel_expense_reports(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  receipt_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sequence for report numbers
CREATE SEQUENCE IF NOT EXISTS travel_expense_report_number_seq START 1;

-- Function to generate report number
CREATE OR REPLACE FUNCTION public.generate_travel_expense_report_number()
  RETURNS TEXT
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  next_num INTEGER;
  report_num TEXT;
  current_year TEXT;
BEGIN
  next_num := nextval('travel_expense_report_number_seq');
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  report_num := 'RR-' || current_year || '-' || LPAD(next_num::TEXT, 4, '0');
  RETURN report_num;
END;
$$;

-- Trigger to auto-set report number
CREATE OR REPLACE FUNCTION public.set_travel_expense_report_number()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.report_number IS NULL OR NEW.report_number = '' THEN
    NEW.report_number := generate_travel_expense_report_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_travel_expense_report_number_trigger
  BEFORE INSERT ON public.travel_expense_reports
  FOR EACH ROW EXECUTE FUNCTION set_travel_expense_report_number();

-- Updated_at trigger
CREATE TRIGGER update_travel_expense_reports_updated_at
  BEFORE UPDATE ON public.travel_expense_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.travel_expense_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_expense_items ENABLE ROW LEVEL SECURITY;

-- Users can see their own reports
CREATE POLICY "Users can view own travel reports"
  ON public.travel_expense_reports FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Company admins can see all reports in their company
CREATE POLICY "Company admins can view all travel reports"
  ON public.travel_expense_reports FOR SELECT
  TO authenticated
  USING (
    company_id = get_user_company_id(auth.uid()) 
    AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
  );

-- Users can insert their own reports
CREATE POLICY "Users can create own travel reports"
  ON public.travel_expense_reports FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update own draft reports; admins can update for approval
CREATE POLICY "Users can update own draft travel reports"
  ON public.travel_expense_reports FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())))
  );

-- Users can delete own draft reports
CREATE POLICY "Users can delete own draft travel reports"
  ON public.travel_expense_reports FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'draft');

-- Items policies follow parent report access
CREATE POLICY "Users can view own report items"
  ON public.travel_expense_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.travel_expense_reports r 
      WHERE r.id = report_id 
      AND (r.user_id = auth.uid() OR (r.company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))))
    )
  );

CREATE POLICY "Users can manage own report items"
  ON public.travel_expense_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.travel_expense_reports r 
      WHERE r.id = report_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own report items"
  ON public.travel_expense_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.travel_expense_reports r 
      WHERE r.id = report_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own report items"
  ON public.travel_expense_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.travel_expense_reports r 
      WHERE r.id = report_id AND r.user_id = auth.uid()
    )
  );
