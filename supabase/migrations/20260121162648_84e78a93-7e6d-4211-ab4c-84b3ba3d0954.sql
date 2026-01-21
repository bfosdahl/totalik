-- Fix INSERT RLS policies for KS Bygg tables to allow system admins to create seed data

-- ks_module2_avvik
DROP POLICY IF EXISTS "Users can create avvik in their company" ON public.ks_module2_avvik;
CREATE POLICY "Users can create avvik in their company" 
ON public.ks_module2_avvik 
FOR INSERT 
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid()) 
  OR public.is_system_admin(auth.uid())
);

-- ks_module2_checklists (drop both conflicting policies)
DROP POLICY IF EXISTS "Users can create checklists for their company" ON public.ks_module2_checklists;
DROP POLICY IF EXISTS "Users can create custom checklists for their company" ON public.ks_module2_checklists;
CREATE POLICY "Users can create checklists for their company" 
ON public.ks_module2_checklists 
FOR INSERT 
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid()) 
  OR public.is_system_admin(auth.uid())
);

-- ks_module2_subcontractors
DROP POLICY IF EXISTS "Users can create subcontractors" ON public.ks_module2_subcontractors;
CREATE POLICY "Users can create subcontractors" 
ON public.ks_module2_subcontractors 
FOR INSERT 
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid()) 
  OR public.is_system_admin(auth.uid())
);

-- ks_module2_claims
DROP POLICY IF EXISTS "Users can create claims for their company" ON public.ks_module2_claims;
CREATE POLICY "Users can create claims for their company" 
ON public.ks_module2_claims 
FOR INSERT 
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid()) 
  OR public.is_system_admin(auth.uid())
);

-- ks_module2_milestones
DROP POLICY IF EXISTS "Users can create milestones for their company" ON public.ks_module2_milestones;
CREATE POLICY "Users can create milestones for their company" 
ON public.ks_module2_milestones 
FOR INSERT 
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid()) 
  OR public.is_system_admin(auth.uid())
);

-- ks_module2_sja
DROP POLICY IF EXISTS "Users can create SJA for their company" ON public.ks_module2_sja;
CREATE POLICY "Users can create SJA for their company" 
ON public.ks_module2_sja 
FOR INSERT 
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid()) 
  OR public.is_system_admin(auth.uid())
);

-- ks_module2_vernerunder
DROP POLICY IF EXISTS "Users can create vernerunder for their company" ON public.ks_module2_vernerunder;
CREATE POLICY "Users can create vernerunder for their company" 
ON public.ks_module2_vernerunder 
FOR INSERT 
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid()) 
  OR public.is_system_admin(auth.uid())
);

-- ks_module2_finances
DROP POLICY IF EXISTS "Users can manage finances for their company" ON public.ks_module2_finances;
CREATE POLICY "Users can manage finances for their company" 
ON public.ks_module2_finances 
FOR INSERT 
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid()) 
  OR public.is_system_admin(auth.uid())
);

-- ks_module2_cost_entries
DROP POLICY IF EXISTS "Users can create cost entries for their company" ON public.ks_module2_cost_entries;
CREATE POLICY "Users can create cost entries for their company" 
ON public.ks_module2_cost_entries 
FOR INSERT 
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid()) 
  OR public.is_system_admin(auth.uid())
);

-- ks_module2_invoices
DROP POLICY IF EXISTS "Users can create invoices for their company" ON public.ks_module2_invoices;
CREATE POLICY "Users can create invoices for their company" 
ON public.ks_module2_invoices 
FOR INSERT 
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid()) 
  OR public.is_system_admin(auth.uid())
);

-- ks_module2_stoffkartotek
DROP POLICY IF EXISTS "Users can create stoffkartotek entries for their company" ON public.ks_module2_stoffkartotek;
CREATE POLICY "Users can create stoffkartotek entries for their company" 
ON public.ks_module2_stoffkartotek 
FOR INSERT 
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid()) 
  OR public.is_system_admin(auth.uid())
);