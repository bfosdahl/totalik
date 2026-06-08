
-- 1) Tighten nabovarsel SELECT to match INSERT/DELETE scoping
DROP POLICY IF EXISTS "Company admins can view nabovarsel recipients" ON public.ks_module2_nabovarsel_recipients;

CREATE POLICY "Project members can view nabovarsel recipients"
ON public.ks_module2_nabovarsel_recipients
FOR SELECT
TO authenticated
USING (
  is_system_admin(auth.uid())
  OR (
    company_id = get_user_company_id(auth.uid())
    AND (
      is_company_admin(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.ks_module2_projects p
        WHERE p.id = ks_module2_nabovarsel_recipients.project_id
          AND p.company_id = get_user_company_id(auth.uid())
          AND (p.project_leader_id = auth.uid() OR p.created_by = auth.uid())
      )
    )
  )
);

-- 2) Restrict access-log INSERT to projects in the user's company
DROP POLICY IF EXISTS "Authenticated users can insert access logs" ON public.ks_module2_access_log;

CREATE POLICY "Users can insert access logs for own company projects"
ON public.ks_module2_access_log
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id IS NOT NULL
  AND auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.ks_module2_projects p
    WHERE p.id = ks_module2_access_log.project_id
      AND p.company_id = get_user_company_id(auth.uid())
  )
);

-- 3) Allow company admins to view their assigned seller
CREATE POLICY "Company admins can view their assigned seller"
ON public.sellers
FOR SELECT
TO authenticated
USING (
  is_company_admin(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.seller_id = sellers.id
      AND c.id = get_user_company_id(auth.uid())
  )
);
