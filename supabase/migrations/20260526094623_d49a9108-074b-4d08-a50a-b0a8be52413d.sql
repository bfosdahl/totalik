
-- ============================================================
-- 1. GENERIC AUDIT FUNCTION (safe for tables without is_deleted)
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_audit_change_generic()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_action text;
  v_old_data jsonb;
  v_new_data jsonb;
  v_record_id uuid;
  v_company_id uuid;
  v_user_id uuid;
  v_old_is_deleted boolean;
  v_new_is_deleted boolean;
BEGIN
  v_user_id := auth.uid();
  v_action := TG_OP;

  IF TG_OP = 'DELETE' THEN
    v_old_data := to_jsonb(OLD);
    v_record_id := (v_old_data->>'id')::uuid;
    v_company_id := NULLIF(v_old_data->>'company_id','')::uuid;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    v_record_id := (v_new_data->>'id')::uuid;
    v_company_id := NULLIF(v_new_data->>'company_id','')::uuid;
    v_old_is_deleted := (v_old_data->>'is_deleted')::boolean;
    v_new_is_deleted := (v_new_data->>'is_deleted')::boolean;
    IF v_new_is_deleted IS TRUE AND v_old_is_deleted IS DISTINCT FROM TRUE THEN
      v_action := 'SOFT_DELETE';
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    v_new_data := to_jsonb(NEW);
    v_record_id := (v_new_data->>'id')::uuid;
    v_company_id := NULLIF(v_new_data->>'company_id','')::uuid;
  END IF;

  INSERT INTO public.audit_log (table_name, record_id, action, old_data, new_data, changed_by, company_id)
  VALUES (TG_TABLE_NAME, v_record_id, v_action, v_old_data, v_new_data, v_user_id, v_company_id);

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

-- ============================================================
-- 2. HELPER to attach trigger (idempotent)
-- ============================================================
CREATE OR REPLACE FUNCTION public.attach_audit_trigger(p_table text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_trigger_name text := 'trg_audit_' || p_table;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=p_table) THEN
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', v_trigger_name, p_table);
    EXECUTE format(
      'CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_audit_change_generic()',
      v_trigger_name, p_table
    );
  END IF;
END;
$$;

-- ============================================================
-- 3. ATTACH AUDIT TRIGGERS to all relevant tables
-- ============================================================
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    -- HMS / felles
    'company_routines','customer_routine_instances','hms_sja','hms_sja_templates',
    'hms_forsvarlighetsvurderinger','hms_self_declarations','audits','audit_form_responses',
    'company_aarshjul_activities','company_risk_assessments','chemical_risk_assessments',
    'ergonomic_risk_assessments','equipment_exposure_assessments',
    -- KS Bygg
    'ks_module2_projects','ks_module2_routines','ks_module2_sja','ks_module2_meetings',
    'ks_module2_change_orders','ks_module2_claims','ks_daily_reports','ks_change_orders',
    'ks_calculations','ks_calculation_items','company_ks_routines','company_ks_documents',
    'company_ks_organization','company_ks_goals','company_ks_checklist_templates',
    -- IK MAT
    'ik_mat_custom_checklists','ik_mat_custom_cleaning_tasks','ik_mat_scheduled_tasks',
    'ik_mat_traceability_records','ik_mat_temperature_equipment','ik_mat_temperature_logs',
    'ik_mat_suppliers','ik_mat_daily_rounds',
    -- IK ALKOHOL
    'ik_alkohol_routines','ik_alkohol_controls','ik_alkohol_incidents','ik_alkohol_training',
    'ik_alkohol_training_records','ik_alkohol_risks','ik_alkohol_risk_controls',
    'ik_alkohol_licenses','ik_alkohol_organization','ik_alkohol_goals',
    'ik_alkohol_compliance_items','ik_alkohol_lovverk','ik_alkohol_attachments',
    -- FDV
    'fdv_buildings','fdv_controls','fdv_documents','fdv_floor_plans','fdv_risk_assessments',
    -- Avvik & felles
    'deviations','deviation_comments','deviation_attachments','company_action_plans',
    'action_plan_followups','company_goals','company_laws_regulations',
    'company_module_documents','ik_hms_company_documents','ik_hms_stoffkartotek',
    'company_chemical_entries',
    -- HR
    'employee_documents','employee_courses','employee_meetings','employee_absence',
    'employee_messages','employee_surveys','employment_contracts','hr_meetings',
    'hr_meeting_templates','hms_card_requests','driving_log_entries','driving_log_expenses',
    -- Setup & avdelinger
    'company_departments','department_routines','department_goals','department_risk_assessments',
    'department_action_plans','department_organization','company_organization'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    PERFORM public.attach_audit_trigger(t);
  END LOOP;
END $$;

-- ============================================================
-- 4. INDEXES for fast trash bin queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_audit_log_company_created ON public.audit_log (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON public.audit_log (table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action_deletes ON public.audit_log (action, created_at DESC) WHERE action IN ('DELETE','SOFT_DELETE');
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_by ON public.audit_log (changed_by, created_at DESC);

-- ============================================================
-- 5. CONTENT SNAPSHOTS for JSONB-heavy tables
-- ============================================================
CREATE TABLE IF NOT EXISTS public.content_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  snapshot_data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  reason text
);

CREATE INDEX IF NOT EXISTS idx_content_snapshots_record ON public.content_snapshots (table_name, record_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_snapshots_company ON public.content_snapshots (company_id, created_at DESC);

ALTER TABLE public.content_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "system_admin can view snapshots" ON public.content_snapshots;
CREATE POLICY "system_admin can view snapshots" ON public.content_snapshots
  FOR SELECT TO authenticated
  USING (public.is_system_admin(auth.uid()));

DROP POLICY IF EXISTS "system_admin can delete snapshots" ON public.content_snapshots;
CREATE POLICY "system_admin can delete snapshots" ON public.content_snapshots
  FOR DELETE TO authenticated
  USING (public.is_system_admin(auth.uid()));

-- Snapshot trigger function
CREATE OR REPLACE FUNCTION public.snapshot_before_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_old jsonb := to_jsonb(OLD);
BEGIN
  INSERT INTO public.content_snapshots (company_id, table_name, record_id, snapshot_data, created_by, reason)
  VALUES (
    NULLIF(v_old->>'company_id','')::uuid,
    TG_TABLE_NAME,
    (v_old->>'id')::uuid,
    v_old,
    auth.uid(),
    'pre-update'
  );
  RETURN NEW;
END;
$$;

-- Attach snapshot trigger to jsonb-heavy tables
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'company_routines','company_ks_organization','company_organization',
    'ik_hms_stoffkartotek','ik_alkohol_organization','hms_self_declarations'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_snapshot_%I ON public.%I', t, t);
      EXECUTE format('CREATE TRIGGER trg_snapshot_%I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.snapshot_before_update()', t, t);
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- 6. RESTORE RPCs (system_admin only)
-- ============================================================
CREATE OR REPLACE FUNCTION public.restore_deleted_record(p_audit_log_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_log record;
  v_columns text;
  v_values text;
  v_sql text;
  v_result jsonb;
BEGIN
  IF NOT public.is_system_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only system admins can restore deleted records';
  END IF;

  SELECT * INTO v_log FROM public.audit_log WHERE id = p_audit_log_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Audit log entry not found'; END IF;

  IF v_log.action = 'SOFT_DELETE' THEN
    v_sql := format('UPDATE public.%I SET is_deleted = false, deleted_at = NULL, deleted_by = NULL WHERE id = %L RETURNING to_jsonb(%I.*)',
                    v_log.table_name, v_log.record_id, v_log.table_name);
    EXECUTE v_sql INTO v_result;
  ELSIF v_log.action = 'DELETE' THEN
    -- Build INSERT from old_data jsonb
    SELECT string_agg(quote_ident(key), ','),
           string_agg(format('(%L::jsonb->>%L)', v_log.old_data, key), ',')
      INTO v_columns, v_values
      FROM jsonb_object_keys(v_log.old_data) AS key;
    v_sql := format('INSERT INTO public.%I (%s) SELECT %s RETURNING to_jsonb(%I.*)',
                    v_log.table_name, v_columns,
                    (SELECT string_agg(format('(%L::jsonb->>%L)', v_log.old_data, key), ',') FROM jsonb_object_keys(v_log.old_data) AS key),
                    v_log.table_name);
    EXECUTE v_sql INTO v_result;
  ELSE
    RAISE EXCEPTION 'Audit entry % is not a delete (action=%)', p_audit_log_id, v_log.action;
  END IF;

  INSERT INTO public.audit_log (table_name, record_id, action, new_data, changed_by, company_id)
  VALUES (v_log.table_name, v_log.record_id, 'RESTORE', v_result, auth.uid(), v_log.company_id);

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_snapshot(p_snapshot_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_snap record;
  v_set text;
  v_sql text;
  v_result jsonb;
BEGIN
  IF NOT public.is_system_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only system admins can restore snapshots';
  END IF;

  SELECT * INTO v_snap FROM public.content_snapshots WHERE id = p_snapshot_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Snapshot not found'; END IF;

  SELECT string_agg(format('%I = (%L::jsonb->>%L)', key, v_snap.snapshot_data, key), ',')
    INTO v_set
    FROM jsonb_object_keys(v_snap.snapshot_data) AS key
    WHERE key NOT IN ('id','created_at');

  v_sql := format('UPDATE public.%I SET %s WHERE id = %L RETURNING to_jsonb(%I.*)',
                  v_snap.table_name, v_set, v_snap.record_id, v_snap.table_name);
  EXECUTE v_sql INTO v_result;

  INSERT INTO public.audit_log (table_name, record_id, action, new_data, changed_by, company_id)
  VALUES (v_snap.table_name, v_snap.record_id, 'RESTORE_SNAPSHOT', v_result, auth.uid(), v_snap.company_id);

  RETURN v_result;
END;
$$;

-- ============================================================
-- 7. CLEANUP function for cron
-- ============================================================
CREATE OR REPLACE FUNCTION public.cleanup_audit_and_snapshots()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Keep restore-actions forever; delete normal audit > 90 days
  DELETE FROM public.audit_log
  WHERE created_at < now() - interval '90 days'
    AND action NOT IN ('RESTORE','RESTORE_SNAPSHOT');

  DELETE FROM public.content_snapshots
  WHERE created_at < now() - interval '90 days';
END;
$$;
