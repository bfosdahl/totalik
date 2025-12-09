-- Drop and recreate the INSERT policy with simpler logic
DROP POLICY IF EXISTS "Users can create audit form responses for their company" ON public.audit_form_responses;

CREATE POLICY "Users can create audit form responses for their company"
ON public.audit_form_responses
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT p.company_id 
    FROM profiles p 
    WHERE p.id = auth.uid()
  )
);