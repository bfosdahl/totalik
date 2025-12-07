-- Drop existing INSERT policy and recreate with better handling
DROP POLICY IF EXISTS "Users can create audit form responses for their company" ON public.audit_form_responses;

-- Create improved INSERT policy that properly handles the WITH CHECK
CREATE POLICY "Users can create audit form responses for their company" 
ON public.audit_form_responses 
FOR INSERT 
WITH CHECK (
  company_id IS NOT NULL 
  AND company_id IN (
    SELECT p.company_id 
    FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.company_id IS NOT NULL
  )
);