
-- Create a security definer function to check if user has any roles (avoids recursion)
CREATE OR REPLACE FUNCTION public.user_has_any_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id
  )
$$;

-- Drop the problematic INSERT policy that self-references user_roles
DROP POLICY IF EXISTS "Users can add company_admin role to themselves during signup" ON public.user_roles;

-- Recreate without self-referencing subquery
CREATE POLICY "Users can add company_admin role to themselves during signup"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND role = 'company_admin'::app_role
  AND NOT public.user_has_any_role(auth.uid())
);
