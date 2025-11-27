-- Policy for company admins to manage roles for users in their company
CREATE POLICY "Company admins can manage roles in their company"
ON public.user_roles
FOR ALL
USING (
  is_company_admin(auth.uid()) 
  AND EXISTS (
    SELECT 1 FROM public.profiles p1, public.profiles p2
    WHERE p1.user_id = auth.uid()
    AND p2.user_id = user_roles.user_id
    AND p1.company_id = p2.company_id
    AND p1.company_id IS NOT NULL
  )
  AND role != 'system_admin'
)
WITH CHECK (
  is_company_admin(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles p1, public.profiles p2
    WHERE p1.user_id = auth.uid()
    AND p2.user_id = user_roles.user_id
    AND p1.company_id = p2.company_id
    AND p1.company_id IS NOT NULL
  )
  AND role != 'system_admin'
);

-- Policy for company admins to view roles of users in their company
CREATE POLICY "Company admins can view roles in their company"
ON public.user_roles
FOR SELECT
USING (
  is_company_admin(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles p1, public.profiles p2
    WHERE p1.user_id = auth.uid()
    AND p2.user_id = user_roles.user_id
    AND p1.company_id = p2.company_id
    AND p1.company_id IS NOT NULL
  )
);