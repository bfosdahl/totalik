-- Drop the existing INSERT policy that has no WITH CHECK clause
DROP POLICY IF EXISTS "Users can create ergonomic assessments in their company" ON public.ergonomic_risk_assessments;

-- Create a new INSERT policy with proper WITH CHECK clause
CREATE POLICY "Users can create ergonomic assessments in their company" 
ON public.ergonomic_risk_assessments 
FOR INSERT 
WITH CHECK (
  company_id IN (
    SELECT profiles.company_id
    FROM profiles
    WHERE profiles.id = auth.uid()
  )
);