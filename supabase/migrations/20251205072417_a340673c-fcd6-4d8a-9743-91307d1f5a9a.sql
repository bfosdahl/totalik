-- Fix RLS policies for ks_module2_vernerunder - use user_id instead of id
DROP POLICY IF EXISTS "Users can view vernerunder for their company" ON public.ks_module2_vernerunder;
DROP POLICY IF EXISTS "Users can create vernerunder for their company" ON public.ks_module2_vernerunder;
DROP POLICY IF EXISTS "Users can update vernerunder for their company" ON public.ks_module2_vernerunder;
DROP POLICY IF EXISTS "Users can delete vernerunder for their company" ON public.ks_module2_vernerunder;

CREATE POLICY "Users can view vernerunder for their company" 
ON public.ks_module2_vernerunder FOR SELECT 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create vernerunder for their company" 
ON public.ks_module2_vernerunder FOR INSERT 
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update vernerunder for their company" 
ON public.ks_module2_vernerunder FOR UPDATE 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete vernerunder for their company" 
ON public.ks_module2_vernerunder FOR DELETE 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

-- Also fix RLS policies for ks_module2_sja 
DROP POLICY IF EXISTS "Users can view SJA for their company" ON public.ks_module2_sja;
DROP POLICY IF EXISTS "Users can create SJA for their company" ON public.ks_module2_sja;
DROP POLICY IF EXISTS "Users can update SJA for their company" ON public.ks_module2_sja;
DROP POLICY IF EXISTS "Users can delete SJA for their company" ON public.ks_module2_sja;

CREATE POLICY "Users can view SJA for their company" 
ON public.ks_module2_sja FOR SELECT 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create SJA for their company" 
ON public.ks_module2_sja FOR INSERT 
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update SJA for their company" 
ON public.ks_module2_sja FOR UPDATE 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete SJA for their company" 
ON public.ks_module2_sja FOR DELETE 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));