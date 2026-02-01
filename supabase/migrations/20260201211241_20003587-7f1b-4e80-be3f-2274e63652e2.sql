-- Fix RLS policies for ergonomic_risk_assessments to use correct column (user_id instead of id)

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view ergonomic assessments in their company" ON public.ergonomic_risk_assessments;
DROP POLICY IF EXISTS "Users can create ergonomic assessments in their company" ON public.ergonomic_risk_assessments;
DROP POLICY IF EXISTS "Users can update ergonomic assessments in their company" ON public.ergonomic_risk_assessments;
DROP POLICY IF EXISTS "Users can delete ergonomic assessments in their company" ON public.ergonomic_risk_assessments;

-- Recreate policies with correct user_id reference
CREATE POLICY "Users can view ergonomic assessments in their company" 
ON public.ergonomic_risk_assessments FOR SELECT 
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create ergonomic assessments in their company" 
ON public.ergonomic_risk_assessments FOR INSERT 
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update ergonomic assessments in their company" 
ON public.ergonomic_risk_assessments FOR UPDATE 
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete ergonomic assessments in their company" 
ON public.ergonomic_risk_assessments FOR DELETE 
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));