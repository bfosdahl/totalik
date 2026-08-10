DROP INDEX IF EXISTS public.idx_audit_log_changed_by;

CREATE OR REPLACE FUNCTION public.log_audit_change_generic()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_action text;
  v_old_data jsonb;
  v_new_data jsonb;
  v_old_full jsonb;
  v_new_full jsonb;
  v_record_id uuid;
  v_company_id uuid;
  v_user_id uuid;
  v_old_is_deleted boolean := false;
  v_new_is_deleted boolean := false;
  k text;
BEGIN
  v_user_id := auth.uid();
  v_action := TG_OP;

  IF TG_OP = 'DELETE' THEN
    v_old_full := to_jsonb(OLD);
    v_old_data := v_old_full;
    v_record_id := (v_old_full->>'id')::uuid;
    v_company_id := NULLIF(v_old_full->>'company_id','')::uuid;

  ELSIF TG_OP = 'UPDATE' THEN
    v_old_full := to_jsonb(OLD);
    v_new_full := to_jsonb(NEW);
    v_record_id := (v_new_full->>'id')::uuid;
    v_company_id := NULLIF(v_new_full->>'company_id','')::uuid;

    IF v_old_full ? 'is_deleted' THEN
      v_old_is_deleted := COALESCE(NULLIF(v_old_full->>'is_deleted','')::boolean, false);
    END IF;
    IF v_new_full ? 'is_deleted' THEN
      v_new_is_deleted := COALESCE(NULLIF(v_new_full->>'is_deleted','')::boolean, false);
    END IF;
    IF v_new_is_deleted IS TRUE AND v_old_is_deleted IS DISTINCT FROM TRUE THEN
      v_action := 'SOFT_DELETE';
    END IF;

    IF v_action = 'SOFT_DELETE' THEN
      v_old_data := v_old_full;
      v_new_data := v_new_full;
    ELSE
      v_old_data := '{}'::jsonb;
      v_new_data := '{}'::jsonb;
      FOR k IN SELECT jsonb_object_keys(v_new_full) LOOP
        IF v_new_full->k IS DISTINCT FROM v_old_full->k THEN
          v_old_data := v_old_data || jsonb_build_object(k, v_old_full->k);
          v_new_data := v_new_data || jsonb_build_object(k, v_new_full->k);
        END IF;
      END LOOP;
      FOR k IN SELECT jsonb_object_keys(v_old_full) LOOP
        IF NOT (v_new_full ? k) THEN
          v_old_data := v_old_data || jsonb_build_object(k, v_old_full->k);
        END IF;
      END LOOP;

      IF v_new_data = '{}'::jsonb AND v_old_data = '{}'::jsonb THEN
        RETURN NEW;
      END IF;

      v_old_data := v_old_data || jsonb_build_object('id', v_old_full->'id');
      v_new_data := v_new_data || jsonb_build_object('id', v_new_full->'id');
    END IF;

  ELSIF TG_OP = 'INSERT' THEN
    v_new_full := to_jsonb(NEW);
    v_new_data := v_new_full;
    v_record_id := (v_new_full->>'id')::uuid;
    v_company_id := NULLIF(v_new_full->>'company_id','')::uuid;
  END IF;

  INSERT INTO public.audit_log (table_name, record_id, action, old_data, new_data, changed_by, company_id)
  VALUES (TG_TABLE_NAME, v_record_id, v_action, v_old_data, v_new_data, v_user_id, v_company_id);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.cleanup_audit_and_snapshots()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn2$
DECLARE
  v_deleted integer;
BEGIN
  LOOP
    DELETE FROM public.audit_log
    WHERE id IN (
      SELECT id FROM public.audit_log
      WHERE created_at < now() - interval '90 days'
        AND action NOT IN ('RESTORE','RESTORE_SNAPSHOT')
      LIMIT 5000
    );
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    EXIT WHEN v_deleted = 0;
  END LOOP;

  DELETE FROM public.content_snapshots
  WHERE created_at < now() - interval '90 days';
END;
$fn2$;

DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'audit-log-retention-cleanup') THEN
    PERFORM cron.unschedule('audit-log-retention-cleanup');
  END IF;
  PERFORM cron.schedule('audit-log-retention-cleanup', '15 3 * * *', 'SELECT public.cleanup_audit_and_snapshots();');
END
$do$;

ALTER TABLE public.audit_log SET (
  autovacuum_vacuum_scale_factor = 0.02,
  autovacuum_analyze_scale_factor = 0.02
);