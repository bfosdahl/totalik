-- Tighten SELECT on nabovarsel recipients to project-scoped users only
DROP POLICY IF EXISTS "Users can view nabovarsel recipients" ON public.ks_module2_nabovarsel_recipients;

CREATE POLICY "Project members can view nabovarsel recipients"
ON public.ks_module2_nabovarsel_recipients
FOR SELECT
USING (
  is_system_admin(auth.uid())
  OR has_guest_project_access(project_id)
  OR (
    company_id = get_user_company_id(auth.uid())
    AND (
      is_company_admin(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.ks_module2_projects p
        WHERE p.id = ks_module2_nabovarsel_recipients.project_id
          AND p.company_id = get_user_company_id(auth.uid())
          AND (
            p.project_leader_id = auth.uid()
            OR p.created_by = auth.uid()
          )
      )
      OR EXISTS (
        SELECT 1 FROM public.ks_module2_project_access a
        WHERE a.project_id = ks_module2_nabovarsel_recipients.project_id
          AND a.user_id = auth.uid()
          AND a.status IN ('invited','active')
          AND a.access_level <> 'none'
      )
    )
  )
);

-- Also tighten INSERT/UPDATE/DELETE to the same scoping (writers should be project members too)
DROP POLICY IF EXISTS "Users can insert nabovarsel recipients" ON public.ks_module2_nabovarsel_recipients;
DROP POLICY IF EXISTS "Users can update nabovarsel recipients" ON public.ks_module2_nabovarsel_recipients;
DROP POLICY IF EXISTS "Users can delete nabovarsel recipients" ON public.ks_module2_nabovarsel_recipients;

CREATE POLICY "Project members can insert nabovarsel recipients"
ON public.ks_module2_nabovarsel_recipients
FOR INSERT
WITH CHECK (
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

CREATE POLICY "Project members can update nabovarsel recipients"
ON public.ks_module2_nabovarsel_recipients
FOR UPDATE
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

CREATE POLICY "Project members can delete nabovarsel recipients"
ON public.ks_module2_nabovarsel_recipients
FOR DELETE
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