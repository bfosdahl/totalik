-- Fix the INSERT policy to use correct column (user_id instead of id)
DROP POLICY IF EXISTS "Users can create audit form responses for their company" ON public.audit_form_responses;

CREATE POLICY "Users can create audit form responses for their company"
ON public.audit_form_responses
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT p.company_id 
    FROM profiles p 
    WHERE p.user_id = auth.uid()
  )
);

-- Also fix the other policies to use correct column
DROP POLICY IF EXISTS "Users can view their company audit form responses" ON public.audit_form_responses;
DROP POLICY IF EXISTS "Users can update their company audit form responses" ON public.audit_form_responses;
DROP POLICY IF EXISTS "Users can delete their company audit form responses" ON public.audit_form_responses;

CREATE POLICY "Users can view their company audit form responses"
ON public.audit_form_responses
FOR SELECT
USING (
  company_id IN (
    SELECT p.company_id 
    FROM profiles p 
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their company audit form responses"
ON public.audit_form_responses
FOR UPDATE
USING (
  company_id IN (
    SELECT p.company_id 
    FROM profiles p 
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their company audit form responses"
ON public.audit_form_responses
FOR DELETE
USING (
  company_id IN (
    SELECT p.company_id 
    FROM profiles p 
    WHERE p.user_id = auth.uid()
  )
);