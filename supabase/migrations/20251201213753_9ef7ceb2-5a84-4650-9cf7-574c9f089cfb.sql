-- Tabell for leverandører og serviceavtaler i IK/MAT
CREATE TABLE IF NOT EXISTS public.ik_mat_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  service_type TEXT NOT NULL, -- f.eks. "Skadedyrkontroll", "Renhold", "Vedlikehold kjøl/frys"
  contract_start_date DATE,
  contract_end_date DATE,
  contract_document_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies for ik_mat_suppliers
ALTER TABLE public.ik_mat_suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company suppliers"
  ON public.ik_mat_suppliers
  FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create suppliers for their company"
  ON public.ik_mat_suppliers
  FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update their company suppliers"
  ON public.ik_mat_suppliers
  FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can delete suppliers"
  ON public.ik_mat_suppliers
  FOR DELETE
  USING (
    company_id = get_user_company_id(auth.uid()) 
    AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
  );

-- Trigger for updated_at
CREATE TRIGGER update_ik_mat_suppliers_updated_at
  BEFORE UPDATE ON public.ik_mat_suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();