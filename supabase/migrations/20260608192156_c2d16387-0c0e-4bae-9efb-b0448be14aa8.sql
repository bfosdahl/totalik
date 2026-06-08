
-- =====================================================================
-- Security hardening: lock down SECURITY DEFINER function execution
-- =====================================================================
-- Default is GRANT EXECUTE ON FUNCTIONS TO PUBLIC, which makes every
-- SECURITY DEFINER function callable by anon and authenticated.
-- We revoke from PUBLIC and anon, then re-grant EXECUTE TO authenticated
-- only for:
--   (a) helpers used inside RLS policies (must be callable by caller role)
--   (b) RPCs intentionally called from the client
-- All trigger functions, sequence generators and server-only utilities
-- end up with NO grant to anon/authenticated (service_role keeps access
-- via its bypass).
-- =====================================================================

-- 1) Trigger functions and internal sequence generators
--    (never called directly from client; triggers run as table owner)
DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'generate_ks_module2_vernerunde_number()',
    'generate_audit_number()',
    'set_audit_number()',
    'invoke_cron_edge_function(text)',
    'set_ks_module2_routine_number()',
    'set_ks_module2_vernerunde_number()',
    'set_ks_module2_sja_number()',
    'cleanup_audit_and_snapshots()',
    'generate_ks_module2_sja_number()',
    'set_project_number()',
    'set_ks_module2_project_number()',
    'update_hms_vernerunde_templates_updated_at()',
    'update_user_departments_updated_at()',
    'check_org_chart_circular_reference()',
    'generate_project_number()',
    'generate_routine_template_number(text)',
    'generate_ks_module2_change_order_number()',
    'generate_ks_module2_claim_number()',
    'set_ks_module2_claim_number()',
    'generate_ks_module2_meeting_number()',
    'set_ks_module2_meeting_number()',
    'set_ks_daily_report_number()',
    'set_travel_expense_report_number()',
    'log_audit_change()',
    'generate_document_template_number(text)',
    'set_checklist_template_number()',
    'set_document_template_number()',
    'set_routine_template_number()',
    'sync_company_employee_count()',
    'generate_travel_expense_report_number()',
    'generate_ks_daily_report_number()',
    'generate_ks_module2_uk_number()',
    'set_ks_module2_uk_number()',
    'generate_ks_module2_routine_number()',
    'set_forsvarlighetsvurdering_number()',
    'generate_ks_module2_project_number()',
    'generate_hms_sja_number()',
    'cleanup_old_rate_limits()',
    'generate_checklist_template_number(text)',
    'log_audit_change_generic()',
    'update_updated_at_column()',
    'set_ks_module2_avvik_number()',
    'set_ks_module2_change_order_number()',
    'set_hms_sja_number()',
    'generate_inspection_number(uuid)',
    'generate_ks_module2_avvik_number()',
    'handle_new_company_allowances()',
    'handle_new_user()',
    'enforce_employment_contract_signature_only()',
    'seed_default_allowance_types(uuid)',
    'generate_anonymous_message_number(uuid)',
    'update_global_chemical_search_vector()',
    'generate_forsvarlighetsvurdering_number()',
    'copy_inspection_template_seeds(uuid)',
    'snapshot_before_update()',
    'attach_audit_trigger(text)',
    'cleanup_soft_deleted_records()',
    'generate_deviation_number(text)',
    'set_deviation_number()',
    'check_rate_limit(uuid, text, integer, integer)',
    'seed_hr_meeting_templates_for_company(uuid)',
    'restore_snapshot(uuid)',
    'restore_deleted_record(uuid)'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    BEGIN
      EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC', fn);
      EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM anon', fn);
      EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM authenticated', fn);
      EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role', fn);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipped %: %', fn, SQLERRM;
    END;
  END LOOP;
END $$;

-- 2) RLS helper functions: must be callable by authenticated
--    (policies evaluate as the caller role and call these)
DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'has_role(uuid, app_role)',
    'is_company_admin(uuid)',
    'is_system_admin(uuid)',
    'check_company_admin_role(uuid)',
    'user_has_any_role(uuid)',
    'get_user_company_id(uuid)',
    'is_hms_responsible(uuid)',
    'user_can_manage_fdv(uuid, uuid)',
    'user_has_fdv_access(uuid, uuid)',
    'user_owns_ks2_project(uuid, text)',
    'is_department_admin_for(uuid, uuid)',
    'is_any_department_admin(uuid)',
    'get_admin_department_ids(uuid)',
    'is_leader_or_verneombud(uuid)',
    'has_guest_project_access(uuid)'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    BEGIN
      EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC', fn);
      EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM anon', fn);
      EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', fn);
      EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role', fn);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipped %: %', fn, SQLERRM;
    END;
  END LOOP;
END $$;

-- 3) Client RPCs: callable by authenticated, not by anon
DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'get_profile_private(uuid)',
    'restore_soft_deleted(text, uuid)',
    'soft_delete_record(text, uuid)',
    'complete_fdv_control(uuid, uuid, uuid, uuid, text, text, text, text, date)',
    'get_trash_items(uuid)'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    BEGIN
      EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC', fn);
      EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM anon', fn);
      EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', fn);
      EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role', fn);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipped %: %', fn, SQLERRM;
    END;
  END LOOP;
END $$;

-- 4) Tighten default privileges for future functions in public schema
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon;
