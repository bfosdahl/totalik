-- Allow users to view their OWN profile regardless of company_id
-- This fixes the issue where new users without a company can't see their profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (user_id = auth.uid());