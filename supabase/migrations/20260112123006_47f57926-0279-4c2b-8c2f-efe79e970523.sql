-- Allow users to add company_admin role to themselves when creating their first company
-- This is needed during signup flow when user doesn't have any role yet
CREATE POLICY "Users can add company_admin role to themselves during signup"
ON public.user_roles
FOR INSERT
WITH CHECK (
  user_id = auth.uid() 
  AND role = 'company_admin'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid()
  )
);