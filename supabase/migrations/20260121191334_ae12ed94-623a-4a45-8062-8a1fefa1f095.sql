-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view contracts in their company" ON public.employment_contracts;

-- Create a more restrictive SELECT policy: employees see only their own, admins see all
CREATE POLICY "Users can view their own or admin can view all contracts" 
ON public.employment_contracts 
FOR SELECT 
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (
    -- HR Admins can see all contracts in their company
    is_company_admin(auth.uid()) 
    OR is_system_admin(auth.uid())
    -- Employees can only see their own contract
    OR employee_id = auth.uid()
  )
);