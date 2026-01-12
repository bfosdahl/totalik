-- Fix the infinite recursion issue in user_roles RLS policies
-- The problem is that is_company_admin() calls has_role() which queries user_roles, causing recursion

-- Drop the problematic policies and recreate with non-recursive checks
DROP POLICY IF EXISTS "Company admins can manage roles in their company" ON user_roles;
DROP POLICY IF EXISTS "Company admins can view roles in their company" ON user_roles;

-- Create simple, non-recursive policies for company admins
-- Instead of checking is_company_admin (which queries user_roles), we directly check the role
CREATE POLICY "Company admins can manage roles in their company" ON user_roles
FOR ALL
TO authenticated
USING (
  -- Check if current user has company_admin role by direct lookup (avoiding function call)
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'company_admin'
  )
  AND
  -- Ensure target user is in same company
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
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'company_admin'
  )
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
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'company_admin'
  )
  AND
  EXISTS (
    SELECT 1 FROM profiles p1, profiles p2
    WHERE p1.user_id = auth.uid()
    AND p2.user_id = user_roles.user_id
    AND p1.company_id = p2.company_id
    AND p1.company_id IS NOT NULL
  )
);