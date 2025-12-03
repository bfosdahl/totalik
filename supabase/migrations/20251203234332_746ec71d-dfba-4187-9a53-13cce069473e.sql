-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Users with project access can view projects" ON public.ks_module2_projects;

-- Create a SECURITY DEFINER function to check guest access without recursion
CREATE OR REPLACE FUNCTION public.has_guest_project_access(project_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM ks_module2_project_access
    WHERE project_id = project_uuid
    AND user_id = auth.uid()
    AND status IN ('invited', 'active')
    AND access_level != 'none'
  );
$$;

-- Create a non-recursive policy using the SECURITY DEFINER function
CREATE POLICY "Guest users can view their accessible projects" 
ON public.ks_module2_projects 
FOR SELECT 
USING (
  has_guest_project_access(id)
);