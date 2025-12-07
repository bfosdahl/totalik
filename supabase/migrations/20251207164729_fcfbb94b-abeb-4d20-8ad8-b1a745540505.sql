
-- Create table for project finances/budget
CREATE TABLE public.ks_module2_finances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.ks_module2_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  -- Budget
  contract_sum NUMERIC(14,2) DEFAULT 0,
  budget_materials NUMERIC(14,2) DEFAULT 0,
  budget_labor NUMERIC(14,2) DEFAULT 0,
  budget_subcontractors NUMERIC(14,2) DEFAULT 0,
  budget_other NUMERIC(14,2) DEFAULT 0,
  -- Actuals (updated periodically)
  actual_materials NUMERIC(14,2) DEFAULT 0,
  actual_labor NUMERIC(14,2) DEFAULT 0,
  actual_subcontractors NUMERIC(14,2) DEFAULT 0,
  actual_other NUMERIC(14,2) DEFAULT 0,
  -- Invoice tracking
  invoiced_amount NUMERIC(14,2) DEFAULT 0,
  paid_amount NUMERIC(14,2) DEFAULT 0,
  -- Change orders sum (calculated from endringsmeldinger)
  change_orders_sum NUMERIC(14,2) DEFAULT 0,
  -- Notes
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id)
);

-- Create table for individual cost entries
CREATE TABLE public.ks_module2_cost_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.ks_module2_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  supplier TEXT,
  invoice_number TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for invoices
CREATE TABLE public.ks_module2_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.ks_module2_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(14,2) NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.ks_module2_finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ks_module2_cost_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ks_module2_invoices ENABLE ROW LEVEL SECURITY;

-- RLS policies for finances
CREATE POLICY "Users can view finances for their company" 
ON public.ks_module2_finances FOR SELECT 
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage finances for their company" 
ON public.ks_module2_finances FOR ALL 
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- RLS policies for cost_entries
CREATE POLICY "Users can view cost entries for their company" 
ON public.ks_module2_cost_entries FOR SELECT 
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage cost entries for their company" 
ON public.ks_module2_cost_entries FOR ALL 
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- RLS policies for invoices
CREATE POLICY "Users can view invoices for their company" 
ON public.ks_module2_invoices FOR SELECT 
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage invoices for their company" 
ON public.ks_module2_invoices FOR ALL 
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- Indexes
CREATE INDEX idx_ks_module2_finances_project ON public.ks_module2_finances(project_id);
CREATE INDEX idx_ks_module2_cost_entries_project ON public.ks_module2_cost_entries(project_id);
CREATE INDEX idx_ks_module2_invoices_project ON public.ks_module2_invoices(project_id);

-- Updated at triggers
CREATE TRIGGER update_ks_module2_finances_updated_at
BEFORE UPDATE ON public.ks_module2_finances
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ks_module2_cost_entries_updated_at
BEFORE UPDATE ON public.ks_module2_cost_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ks_module2_invoices_updated_at
BEFORE UPDATE ON public.ks_module2_invoices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
