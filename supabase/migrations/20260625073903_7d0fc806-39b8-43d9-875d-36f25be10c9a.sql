DROP POLICY IF EXISTS "Admins can delete daily reports" ON public.ks_daily_reports;
DROP POLICY IF EXISTS "Users can update own daily reports" ON public.ks_daily_reports;

CREATE POLICY "Admins can delete daily reports"
ON public.ks_daily_reports
FOR DELETE
USING (
  is_system_admin(auth.uid())
  OR (is_company_admin(auth.uid()) AND company_id = get_user_company_id(auth.uid()))
);

CREATE POLICY "Users can update own daily reports"
ON public.ks_daily_reports
FOR UPDATE
USING (
  user_id = auth.uid()
  OR is_system_admin(auth.uid())
  OR (is_company_admin(auth.uid()) AND company_id = get_user_company_id(auth.uid()))
);