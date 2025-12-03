-- Allow users with project access to view those projects
CREATE POLICY "Users with project access can view projects"
ON public.ks_module2_projects
FOR SELECT
USING (
  id IN (
    SELECT project_id 
    FROM ks_module2_project_access 
    WHERE user_id = auth.uid() 
    AND status IN ('invited', 'active')
  )
);