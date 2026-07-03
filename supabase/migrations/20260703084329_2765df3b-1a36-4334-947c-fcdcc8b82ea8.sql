CREATE POLICY "Company admins can create time entries for anyone in company"
ON public.time_entries
FOR INSERT
TO authenticated
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);