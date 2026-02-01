
-- Fix RLS policies for chemical_risk_assessments to use correct column (user_id instead of id)

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view chemical risk assessments for their company" ON public.chemical_risk_assessments;
DROP POLICY IF EXISTS "Users can create chemical risk assessments for their company" ON public.chemical_risk_assessments;
DROP POLICY IF EXISTS "Users can update chemical risk assessments for their company" ON public.chemical_risk_assessments;
DROP POLICY IF EXISTS "Users can delete chemical risk assessments for their company" ON public.chemical_risk_assessments;

-- Recreate policies with correct user_id reference
CREATE POLICY "Users can view chemical risk assessments for their company" 
ON public.chemical_risk_assessments FOR SELECT 
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create chemical risk assessments for their company" 
ON public.chemical_risk_assessments FOR INSERT 
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update chemical risk assessments for their company" 
ON public.chemical_risk_assessments FOR UPDATE 
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete chemical risk assessments for their company" 
ON public.chemical_risk_assessments FOR DELETE 
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
