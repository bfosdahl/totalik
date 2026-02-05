-- Drop and recreate check_company_admin_role as SECURITY DEFINER to prevent RLS recursion
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