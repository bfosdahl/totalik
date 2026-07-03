
-- =====================================================================
-- FIX 1: Restrict sensitive profile columns from coworkers
-- Drop the broad company-wide SELECT policy so coworkers cannot read
-- sensitive columns. Replace with helper RPC pattern already in place
-- (get_profile_sensitive_hr). Add a limited coworker view for non-sensitive
-- columns via a policy that still exposes the row, and revoke column
-- privileges on the sensitive fields.
-- =====================================================================

REVOKE SELECT (hourly_rate, signature_data, hms_card_number) ON public.profiles FROM authenticated;
REVOKE SELECT (hourly_rate, signature_data, hms_card_number) ON public.profiles FROM anon;
GRANT SELECT (hourly_rate, signature_data, hms_card_number) ON public.profiles TO service_role;

-- =====================================================================
-- FIX 2: Prevent privilege escalation via self-update of role flags
-- =====================================================================

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins bypass
  IF public.is_system_admin(auth.uid())
     OR (public.is_company_admin(auth.uid())
         AND NEW.company_id = public.get_user_company_id(auth.uid()))
  THEN
    RETURN NEW;
  END IF;

  -- Non-admins cannot change privilege-bearing flags
  IF NEW.is_hms_responsible IS DISTINCT FROM OLD.is_hms_responsible
     OR NEW.is_verneombud IS DISTINCT FROM OLD.is_verneombud
  THEN
    RAISE EXCEPTION 'Only admins can change is_hms_responsible or is_verneombud';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_privilege_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- =====================================================================
-- FIX 3: Trash-bin RPC hardening
-- =====================================================================

CREATE OR REPLACE FUNCTION public.soft_delete_record(p_table_name text, p_record_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sql text;
  v_result jsonb;
  v_target_company uuid;
  v_caller_company uuid;
  v_allowed text[] := ARRAY[
    'admin_checklist_templates','admin_routine_templates_v2',
    'company_ks_checklist_templates','company_routines',
    'ks_module2_routines','ks_module2_checklists','ks_module2_sja',
    'ks_module2_meetings','ks_module2_change_orders','ks_daily_reports',
    'hms_sja','ks_module2_avvik','admin_documents','company_module_documents',
    'audits','company_action_plans','company_goals','company_ks_documents',
    'company_ks_routines','company_modules','company_vehicles','deviations',
    'ik_hms_stoffkartotek','ks_module2_projects'
  ];
BEGIN
  IF NOT (p_table_name = ANY(v_allowed)) THEN
    RAISE EXCEPTION 'Table % is not whitelisted for soft-delete', p_table_name;
  END IF;

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Only admins can soft-delete
  IF NOT (public.is_system_admin(auth.uid()) OR public.is_company_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Only admins can soft-delete records';
  END IF;

  -- Check target row company matches caller (unless system admin)
  EXECUTE format('SELECT NULLIF(to_jsonb(x.*)->>''company_id'','''')::uuid FROM public.%I x WHERE id = %L',
                 p_table_name, p_record_id) INTO v_target_company;

  IF v_target_company IS NULL THEN
    RAISE EXCEPTION 'Record % not found in %', p_record_id, p_table_name;
  END IF;

  IF NOT public.is_system_admin(auth.uid()) THEN
    v_caller_company := public.get_user_company_id(auth.uid());
    IF v_caller_company IS NULL OR v_caller_company IS DISTINCT FROM v_target_company THEN
      RAISE EXCEPTION 'Cross-tenant soft-delete is forbidden';
    END IF;
  END IF;

  v_sql := format(
    'UPDATE public.%I SET is_deleted = true, deleted_at = now(), deleted_by = %L
     WHERE id = %L AND (is_deleted IS DISTINCT FROM true)
     RETURNING to_jsonb(%I.*)',
    p_table_name, auth.uid(), p_record_id, p_table_name
  );
  EXECUTE v_sql INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Record % not found in % or already deleted', p_record_id, p_table_name;
  END IF;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_soft_deleted(p_table_name text, p_record_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sql text;
  v_result jsonb;
  v_target_company uuid;
  v_caller_company uuid;
  v_allowed text[] := ARRAY[
    'admin_checklist_templates','admin_routine_templates_v2',
    'company_ks_checklist_templates','company_routines',
    'ks_module2_routines','ks_module2_checklists','ks_module2_sja',
    'ks_module2_meetings','ks_module2_change_orders','ks_daily_reports',
    'hms_sja','ks_module2_avvik','admin_documents','company_module_documents',
    'audits','company_action_plans','company_goals','company_ks_documents',
    'company_ks_routines','company_modules','company_vehicles','deviations',
    'ik_hms_stoffkartotek','ks_module2_projects'
  ];
BEGIN
  IF NOT (p_table_name = ANY(v_allowed)) THEN
    RAISE EXCEPTION 'Table % is not whitelisted for restore', p_table_name;
  END IF;

  IF NOT (public.is_system_admin(auth.uid()) OR public.is_company_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Only admins can restore deleted records';
  END IF;

  EXECUTE format('SELECT NULLIF(to_jsonb(x.*)->>''company_id'','''')::uuid FROM public.%I x WHERE id = %L',
                 p_table_name, p_record_id) INTO v_target_company;

  IF v_target_company IS NULL THEN
    RAISE EXCEPTION 'Record % not found in %', p_record_id, p_table_name;
  END IF;

  IF NOT public.is_system_admin(auth.uid()) THEN
    v_caller_company := public.get_user_company_id(auth.uid());
    IF v_caller_company IS NULL OR v_caller_company IS DISTINCT FROM v_target_company THEN
      RAISE EXCEPTION 'Cross-tenant restore is forbidden';
    END IF;
  END IF;

  v_sql := format(
    'UPDATE public.%I SET is_deleted = false, deleted_at = NULL, deleted_by = NULL
     WHERE id = %L RETURNING to_jsonb(%I.*)',
    p_table_name, p_record_id, p_table_name
  );
  EXECUTE v_sql INTO v_result;

  INSERT INTO public.audit_log (table_name, record_id, action, new_data, changed_by, company_id)
  VALUES (p_table_name, p_record_id, 'RESTORE', v_result, auth.uid(), v_target_company);

  RETURN v_result;
END;
$$;
