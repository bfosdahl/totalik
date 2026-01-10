-- Allow authenticated users to create a company when they don't have one yet
-- This is needed for the signup flow where users create their company
CREATE POLICY "Users without company can create one"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (
  -- User must not already have a company
  get_user_company_id(auth.uid()) IS NULL
);

-- Also fix the sus@dal.no user - delete the broken profile so they can re-register
-- Or update to active with proper company (we'll handle this in code)