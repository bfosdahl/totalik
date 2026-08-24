ALTER FUNCTION public.cleanup_old_logs() SET search_path = public, cron, net, extensions;

-- company_ks_organization: require admin for writes
DROP POLICY IF EXISTS "Company admins can insert KS organization" ON public.company_ks_organization;
DROP POLICY IF EXISTS "Company admins can update their KS organization" ON public.company_ks_organization;
DROP POLICY IF EXISTS "Company admins can delete their KS organization" ON public.company_ks_organization;

CREATE POLICY "Company admins can insert KS organization"
ON public.company_ks_organization FOR INSERT TO authenticated
WITH CHECK (
  (company_id IN (SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid())
   AND public.is_company_admin(auth.uid()))
  OR public.is_system_admin(auth.uid())
);

CREATE POLICY "Company admins can update their KS organization"
ON public.company_ks_organization FOR UPDATE TO authenticated
USING (
  (company_id IN (SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid())
   AND public.is_company_admin(auth.uid()))
  OR public.is_system_admin(auth.uid())
)
WITH CHECK (
  (company_id IN (SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid())
   AND public.is_company_admin(auth.uid()))
  OR public.is_system_admin(auth.uid())
);

CREATE POLICY "Company admins can delete their KS organization"
ON public.company_ks_organization FOR DELETE TO authenticated
USING (
  (company_id IN (SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid())
   AND public.is_company_admin(auth.uid()))
  OR public.is_system_admin(auth.uid())
);

-- company_ks_system_goals: require admin for writes
DROP POLICY IF EXISTS "Company admins can insert KS system goals" ON public.company_ks_system_goals;
DROP POLICY IF EXISTS "Company admins can update their KS system goals" ON public.company_ks_system_goals;
DROP POLICY IF EXISTS "Company admins can delete their KS system goals" ON public.company_ks_system_goals;

CREATE POLICY "Company admins can insert KS system goals"
ON public.company_ks_system_goals FOR INSERT TO authenticated
WITH CHECK (
  (company_id IN (SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid())
   AND public.is_company_admin(auth.uid()))
  OR public.is_system_admin(auth.uid())
);

CREATE POLICY "Company admins can update their KS system goals"
ON public.company_ks_system_goals FOR UPDATE TO authenticated
USING (
  (company_id IN (SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid())
   AND public.is_company_admin(auth.uid()))
  OR public.is_system_admin(auth.uid())
)
WITH CHECK (
  (company_id IN (SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid())
   AND public.is_company_admin(auth.uid()))
  OR public.is_system_admin(auth.uid())
);

CREATE POLICY "Company admins can delete their KS system goals"
ON public.company_ks_system_goals FOR DELETE TO authenticated
USING (
  (company_id IN (SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid())
   AND public.is_company_admin(auth.uid()))
  OR public.is_system_admin(auth.uid())
);