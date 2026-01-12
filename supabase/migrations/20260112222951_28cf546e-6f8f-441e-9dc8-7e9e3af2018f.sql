-- Fix RLS policies for verneombud_agreements to use user_id instead of id

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view verneombud agreements for their company" ON public.verneombud_agreements;
DROP POLICY IF EXISTS "Company admins can insert verneombud agreements" ON public.verneombud_agreements;
DROP POLICY IF EXISTS "Company admins can update verneombud agreements" ON public.verneombud_agreements;
DROP POLICY IF EXISTS "Company admins can delete verneombud agreements" ON public.verneombud_agreements;

-- Create corrected policies using user_id
CREATE POLICY "Users can view verneombud agreements for their company" 
ON public.verneombud_agreements 
FOR SELECT 
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Company admins can insert verneombud agreements" 
ON public.verneombud_agreements 
FOR INSERT 
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Company admins can update verneombud agreements" 
ON public.verneombud_agreements 
FOR UPDATE 
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Company admins can delete verneombud agreements" 
ON public.verneombud_agreements 
FOR DELETE 
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));