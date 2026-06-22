
-- 1) driving_log_expenses
CREATE POLICY "Company admins view company expenses"
  ON public.driving_log_expenses FOR SELECT
  USING (
    company_id IS NOT NULL
    AND public.is_company_admin(auth.uid())
    AND company_id = public.get_user_company_id(auth.uid())
  );

CREATE POLICY "System admins view all expenses"
  ON public.driving_log_expenses FOR SELECT
  USING (public.is_system_admin(auth.uid()));

-- 2) ik_alkohol_organization
DROP POLICY IF EXISTS "Users can insert organization for their company" ON public.ik_alkohol_organization;
DROP POLICY IF EXISTS "Users can update organization in their company" ON public.ik_alkohol_organization;
DROP POLICY IF EXISTS "Users can delete organization from their company" ON public.ik_alkohol_organization;

CREATE POLICY "Admins can insert organization for their company"
  ON public.ik_alkohol_organization FOR INSERT
  WITH CHECK (
    (public.is_company_admin(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()))
    OR public.is_system_admin(auth.uid())
  );

CREATE POLICY "Admins can update organization in their company"
  ON public.ik_alkohol_organization FOR UPDATE
  USING (
    (public.is_company_admin(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()))
    OR public.is_system_admin(auth.uid())
  );

CREATE POLICY "Admins can delete organization from their company"
  ON public.ik_alkohol_organization FOR DELETE
  USING (
    (public.is_company_admin(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()))
    OR public.is_system_admin(auth.uid())
  );

-- 4) profiles: column-level restriction on sensitive HR fields
REVOKE SELECT ON public.profiles FROM authenticated;

GRANT SELECT (
  id, user_id, company_id, first_name, last_name, email, phone, avatar_url,
  is_active, created_at, updated_at,
  hms_card_required, hms_card_obtained, hms_card_expiry_date,
  hms_card_reminder_sent_30_days, hms_card_reminder_sent_7_days,
  hms_card_reminder_sent_90_days, hms_card_reminder_sent_60_days,
  is_verneombud, is_hms_responsible, primary_department_id, status,
  is_assigned_to_main, preferred_language, deleted_at
) ON public.profiles TO authenticated;

-- Owners and admins still need the sensitive columns — provide via secure RPC
CREATE OR REPLACE FUNCTION public.get_profile_sensitive_hr(p_profile_id uuid)
RETURNS TABLE(hourly_rate numeric, signature_data text, hms_card_number text, employee_number text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_company uuid;
BEGIN
  SELECT user_id, company_id INTO v_owner, v_company
  FROM public.profiles WHERE id = p_profile_id;

  IF v_owner IS NULL THEN RETURN; END IF;

  IF v_owner = auth.uid()
     OR public.is_system_admin(auth.uid())
     OR (public.is_company_admin(auth.uid()) AND v_company = public.get_user_company_id(auth.uid()))
  THEN
    RETURN QUERY
      SELECT p.hourly_rate, p.signature_data, p.hms_card_number, p.employee_number
      FROM public.profiles p WHERE p.id = p_profile_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_profile_sensitive_hr(uuid) TO authenticated;
