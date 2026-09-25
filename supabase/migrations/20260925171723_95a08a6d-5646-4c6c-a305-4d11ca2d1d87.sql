CREATE OR REPLACE FUNCTION public.owns_profile(_profile_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _profile_id AND user_id = auth.uid())
$$;

DROP POLICY IF EXISTS "Users can create own travel reports" ON public.travel_expense_reports;
DROP POLICY IF EXISTS "Users can delete own draft travel reports" ON public.travel_expense_reports;
DROP POLICY IF EXISTS "Users can update own draft travel reports" ON public.travel_expense_reports;
DROP POLICY IF EXISTS "Users can view own travel reports" ON public.travel_expense_reports;

CREATE POLICY "Users can create own travel reports" ON public.travel_expense_reports FOR INSERT TO authenticated
  WITH CHECK (public.owns_profile(user_id) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Users can view own travel reports" ON public.travel_expense_reports FOR SELECT TO authenticated
  USING (public.owns_profile(user_id));
CREATE POLICY "Users can delete own draft travel reports" ON public.travel_expense_reports FOR DELETE TO authenticated
  USING (public.owns_profile(user_id) AND status = 'draft');
CREATE POLICY "Users can update own draft travel reports" ON public.travel_expense_reports FOR UPDATE TO authenticated
  USING ((public.owns_profile(user_id) AND company_id = public.get_user_company_id(auth.uid()))
      OR (company_id = public.get_user_company_id(auth.uid()) AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid()))));

DROP POLICY IF EXISTS "Users can delete own report items" ON public.travel_expense_items;
DROP POLICY IF EXISTS "Users can manage own report items" ON public.travel_expense_items;
DROP POLICY IF EXISTS "Users can update own report items" ON public.travel_expense_items;
DROP POLICY IF EXISTS "Users can view own report items" ON public.travel_expense_items;

CREATE POLICY "Users can manage own report items" ON public.travel_expense_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.travel_expense_reports r WHERE r.id = report_id AND public.owns_profile(r.user_id)));
CREATE POLICY "Users can update own report items" ON public.travel_expense_items FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.travel_expense_reports r WHERE r.id = report_id AND public.owns_profile(r.user_id)));
CREATE POLICY "Users can delete own report items" ON public.travel_expense_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.travel_expense_reports r WHERE r.id = report_id AND public.owns_profile(r.user_id)));
CREATE POLICY "Users can view own report items" ON public.travel_expense_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.travel_expense_reports r WHERE r.id = report_id AND (public.owns_profile(r.user_id)
    OR (r.company_id = public.get_user_company_id(auth.uid()) AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid()))))));