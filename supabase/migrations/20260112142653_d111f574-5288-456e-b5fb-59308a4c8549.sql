-- Create a security definer function that checks if user is company_admin WITHOUT triggering RLS
-- This function bypasses RLS because of SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.check_company_admin_role(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_user_id
    AND role = 'company_admin'
  )
$$;

-- Drop and recreate the policies using the new function
DROP POLICY IF EXISTS "Company admins can manage roles in their company" ON user_roles;
DROP POLICY IF EXISTS "Company admins can view roles in their company" ON user_roles;

-- Recreate with non-recursive security definer function
CREATE POLICY "Company admins can manage roles in their company" ON user_roles
FOR ALL
TO authenticated
USING (
  check_company_admin_role(auth.uid())
  AND
  EXISTS (
    SELECT 1 FROM profiles p1, profiles p2
    WHERE p1.user_id = auth.uid()
    AND p2.user_id = user_roles.user_id
    AND p1.company_id = p2.company_id
    AND p1.company_id IS NOT NULL
  )
  AND role != 'system_admin'
)
WITH CHECK (
  check_company_admin_role(auth.uid())
  AND
  EXISTS (
    SELECT 1 FROM profiles p1, profiles p2
    WHERE p1.user_id = auth.uid()
    AND p2.user_id = user_roles.user_id
    AND p1.company_id = p2.company_id
    AND p1.company_id IS NOT NULL
  )
  AND role != 'system_admin'
);

CREATE POLICY "Company admins can view roles in their company" ON user_roles
FOR SELECT
TO authenticated
USING (
  check_company_admin_role(auth.uid())
  AND
  EXISTS (
    SELECT 1 FROM profiles p1, profiles p2
    WHERE p1.user_id = auth.uid()
    AND p2.user_id = user_roles.user_id
    AND p1.company_id = p2.company_id
    AND p1.company_id IS NOT NULL
  )
);