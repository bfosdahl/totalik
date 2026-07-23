
-- 1) ks_module2_project_access: prevent self-escalation via UPDATE
DROP POLICY IF EXISTS "Users can update their own access" ON public.ks_module2_project_access;

CREATE POLICY "Users can update their own access last_login"
ON public.ks_module2_project_access
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.prevent_ks_project_access_self_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the caller is the row owner (not a company admin path), only allow
  -- updating last_login / login_count. Block changes to sensitive fields.
  IF auth.uid() IS NOT NULL AND NEW.user_id = auth.uid() THEN
    IF NEW.access_level IS DISTINCT FROM OLD.access_level
       OR NEW.status IS DISTINCT FROM OLD.status
       OR NEW.role_in_project IS DISTINCT FROM OLD.role_in_project
       OR NEW.project_id IS DISTINCT FROM OLD.project_id
       OR NEW.subcontractor_id IS DISTINCT FROM OLD.subcontractor_id
       OR NEW.email IS DISTINCT FROM OLD.email
       OR NEW.expires_at IS DISTINCT FROM OLD.expires_at
       OR NEW.invited_by IS DISTINCT FROM OLD.invited_by
       OR NEW.user_id IS DISTINCT FROM OLD.user_id
    THEN
      -- Allow when the caller is also a company admin (admin path)
      IF NOT (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid())) THEN
        RAISE EXCEPTION 'Not allowed to modify privileged fields on your own project access row';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_ks_project_access_self_escalation ON public.ks_module2_project_access;
CREATE TRIGGER trg_prevent_ks_project_access_self_escalation
BEFORE UPDATE ON public.ks_module2_project_access
FOR EACH ROW EXECUTE FUNCTION public.prevent_ks_project_access_self_escalation();

-- 2) time_entries self-update: add WITH CHECK preventing tenant/owner tampering
DROP POLICY IF EXISTS "Users can update their own time entries" ON public.time_entries;
CREATE POLICY "Users can update their own time entries"
ON public.time_entries
FOR UPDATE
USING (
  user_id = auth.uid()
  AND status = ANY (ARRAY['draft'::text, 'submitted'::text, 'rejected'::text])
)
WITH CHECK (
  user_id = auth.uid()
  AND company_id = get_user_company_id(auth.uid())
  AND status = ANY (ARRAY['draft'::text, 'submitted'::text, 'rejected'::text])
);

-- 3) travel_expense_reports self-update: add WITH CHECK
DROP POLICY IF EXISTS "Users can update own draft travel reports" ON public.travel_expense_reports;
CREATE POLICY "Users can update own draft travel reports"
ON public.travel_expense_reports
FOR UPDATE
USING (
  user_id = auth.uid()
  OR (
    company_id = get_user_company_id(auth.uid())
    AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
  )
)
WITH CHECK (
  (
    user_id = auth.uid()
    AND company_id = get_user_company_id(auth.uid())
  )
  OR (
    company_id = get_user_company_id(auth.uid())
    AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
  )
);
