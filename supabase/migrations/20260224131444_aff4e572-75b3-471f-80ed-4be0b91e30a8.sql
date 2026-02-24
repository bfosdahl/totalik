
-- Fix RLS policy: employee_id references profiles.id, not auth.uid()
-- We need to compare employee_id with the profile id of the current user

DROP POLICY IF EXISTS "Users can view their own or admin can view all contracts" ON public.employment_contracts;

CREATE POLICY "Users can view their own or admin can view all contracts" 
ON public.employment_contracts 
FOR SELECT 
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (
    -- HR Admins can see all contracts in their company
    is_company_admin(auth.uid()) 
    OR is_system_admin(auth.uid())
    -- Employees can only see their own contract (employee_id references profiles.id)
    OR employee_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- Also fix UPDATE policy if it has the same issue
DROP POLICY IF EXISTS "Employees can sign their own contract" ON public.employment_contracts;

CREATE POLICY "Employees can sign their own contract"
ON public.employment_contracts
FOR UPDATE
USING (
  employee_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
)
WITH CHECK (
  employee_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);
