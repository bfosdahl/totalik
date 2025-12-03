-- Add RLS policy to allow users to read their own access records
CREATE POLICY "Users can view their own access"
ON public.ks_module2_project_access
FOR SELECT
USING (user_id = auth.uid());

-- Add RLS policy to allow users to update their own access records (for login tracking)
CREATE POLICY "Users can update their own access"
ON public.ks_module2_project_access
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());