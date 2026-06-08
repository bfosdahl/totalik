-- ============================================================
-- FASE 1: Soft-delete på bruker-genererte tabeller
-- ============================================================

-- Helper: add soft-delete columns + index + audit trigger to a table
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'admin_checklist_templates',
    'admin_routine_templates_v2',
    'company_ks_checklist_templates',
    'company_routines',
    'ks_module2_routines',
    'ks_module2_checklists',
    'ks_module2_sja',
    'ks_module2_meetings',
    'ks_module2_change_orders',
    'ks_daily_reports',
    'hms_sja',
    'ks_module2_avvik',
    'admin_documents',
    'company_module_documents'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- Add columns if missing
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false', t);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS deleted_at timestamptz', t);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS deleted_by uuid', t);

    -- Partial index for fast active-row filtering
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON public.%I (is_deleted) WHERE is_deleted = false',
      'idx_' || t || '_active', t
    );

    -- Attach generic audit trigger (logs SOFT_DELETE actions and full row data)
    PERFORM public.attach_audit_trigger(t);
  END LOOP;
END$$;

-- ============================================================
-- soft_delete_record(table_name, record_id)
-- Callable RPC for the app/UI
-- ============================================================
CREATE OR REPLACE FUNCTION public.soft_delete_record(p_table_name text, p_record_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sql text;
  v_result jsonb;
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

GRANT EXECUTE ON FUNCTION public.soft_delete_record(text, uuid) TO authenticated;

-- ============================================================
-- cleanup_soft_deleted_records()
-- Hard-deletes rows soft-deleted > 90 days ago. Runs via cron.
-- ============================================================
CREATE OR REPLACE FUNCTION public.cleanup_soft_deleted_records()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  t text;
  v_count bigint;
  v_total bigint := 0;
  v_report jsonb := '{}'::jsonb;
  tables text[] := ARRAY[
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
  FOREACH t IN ARRAY tables LOOP
    BEGIN
      EXECUTE format(
        'WITH d AS (DELETE FROM public.%I WHERE is_deleted = true AND deleted_at < now() - interval ''90 days'' RETURNING 1)
         SELECT count(*) FROM d', t
      ) INTO v_count;
      v_total := v_total + v_count;
      v_report := v_report || jsonb_build_object(t, v_count);
    EXCEPTION WHEN OTHERS THEN
      v_report := v_report || jsonb_build_object(t, 'error: ' || SQLERRM);
    END;
  END LOOP;

  RETURN jsonb_build_object('total_deleted', v_total, 'per_table', v_report, 'ran_at', now());
END;
$$;

-- ============================================================
-- get_trash_items(): list all soft-deleted items for admin UI
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_trash_items(p_company_id uuid DEFAULT NULL)
RETURNS TABLE(
  table_name text,
  record_id uuid,
  company_id uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  deleted_by_name text,
  display_label text,
  raw_data jsonb
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  t text;
  v_sql text;
  v_is_admin boolean;
  tables text[] := ARRAY[
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
  v_is_admin := public.is_system_admin(auth.uid());
  IF NOT v_is_admin AND p_company_id IS NULL THEN
    p_company_id := public.get_user_company_id(auth.uid());
  END IF;

  FOREACH t IN ARRAY tables LOOP
    v_sql := format($q$
      SELECT
        %L::text AS table_name,
        (to_jsonb(x.*)->>'id')::uuid AS record_id,
        NULLIF(to_jsonb(x.*)->>'company_id','')::uuid AS company_id,
        (to_jsonb(x.*)->>'deleted_at')::timestamptz AS deleted_at,
        NULLIF(to_jsonb(x.*)->>'deleted_by','')::uuid AS deleted_by,
        (SELECT COALESCE(p.first_name || ' ' || p.last_name, p.email)
           FROM public.profiles p WHERE p.user_id = NULLIF(to_jsonb(x.*)->>'deleted_by','')::uuid) AS deleted_by_name,
        COALESCE(
          to_jsonb(x.*)->>'template_name',
          to_jsonb(x.*)->>'title',
          to_jsonb(x.*)->>'name',
          to_jsonb(x.*)->>'subject',
          to_jsonb(x.*)->>'description',
          to_jsonb(x.*)->>'project_number',
          'Uten navn'
        ) AS display_label,
        to_jsonb(x.*) AS raw_data
      FROM public.%I x
      WHERE x.is_deleted = true
        AND (%L::uuid IS NULL OR NULLIF(to_jsonb(x.*)->>'company_id','')::uuid = %L::uuid)
    $q$, t, t, p_company_id, p_company_id);

    RETURN QUERY EXECUTE v_sql;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_trash_items(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_soft_deleted_records() TO service_role;

-- ============================================================
-- restore_soft_deleted(table, id): un-mark as deleted
-- ============================================================
CREATE OR REPLACE FUNCTION public.restore_soft_deleted(p_table_name text, p_record_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sql text;
  v_result jsonb;
BEGIN
  IF NOT (public.is_system_admin(auth.uid()) OR public.is_company_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Only admins can restore deleted records';
  END IF;

  v_sql := format(
    'UPDATE public.%I SET is_deleted = false, deleted_at = NULL, deleted_by = NULL
     WHERE id = %L RETURNING to_jsonb(%I.*)',
    p_table_name, p_record_id, p_table_name
  );
  EXECUTE v_sql INTO v_result;

  INSERT INTO public.audit_log (table_name, record_id, action, new_data, changed_by, company_id)
  VALUES (p_table_name, p_record_id, 'RESTORE', v_result, auth.uid(),
          NULLIF(v_result->>'company_id','')::uuid);

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.restore_soft_deleted(text, uuid) TO authenticated;