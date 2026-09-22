
CREATE POLICY "Company admins can delete company clock entries"
ON public.time_clock_entries FOR DELETE TO authenticated
USING (
  company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid())
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);

CREATE POLICY "Users can delete their own unapproved clock entries"
ON public.time_clock_entries FOR DELETE TO authenticated
USING (user_id = auth.uid() AND COALESCE(status, '') <> 'approved');

DROP POLICY IF EXISTS "Users can delete their own draft time entries" ON public.time_entries;
CREATE POLICY "Users can delete their own unapproved time entries"
ON public.time_entries FOR DELETE TO authenticated
USING (user_id = auth.uid() AND status IN ('draft','submitted','rejected'));
