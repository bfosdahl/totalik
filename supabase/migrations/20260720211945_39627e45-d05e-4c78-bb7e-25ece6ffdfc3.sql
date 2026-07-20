CREATE OR REPLACE FUNCTION public.log_audit_change_generic()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_action text;
  v_old_data jsonb;
  v_new_data jsonb;
  v_record_id uuid;
  v_company_id uuid;
  v_user_id uuid;
  v_old_is_deleted boolean := false;
  v_new_is_deleted boolean := false;
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

    IF v_old_data ? 'is_deleted' THEN
      v_old_is_deleted := COALESCE(NULLIF(v_old_data->>'is_deleted','')::boolean, false);
    END IF;

    IF v_new_data ? 'is_deleted' THEN
      v_new_is_deleted := COALESCE(NULLIF(v_new_data->>'is_deleted','')::boolean, false);
    END IF;

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
$function$;

CREATE OR REPLACE FUNCTION public.protect_time_entry_overtime_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_admin boolean;
  v_is_admin_edit boolean;
BEGIN
  -- Admins may correct anything (they use the edit dialog intentionally)
  v_is_admin := (auth.uid() IS NOT NULL)
             AND (public.is_system_admin(auth.uid())
                  OR public.is_company_admin(auth.uid()));

  -- Admin-drevet edit via edge function (kjører som service role, auth.uid() = NULL,
  -- men edge-funksjonen stempler admin_edited_by med den verifiserte admin-brukeren).
  v_is_admin_edit := NEW.admin_edited_by IS NOT NULL
                 AND NEW.admin_edited_at IS NOT NULL
                 AND (
                   OLD.admin_edited_at IS NULL
                   OR NEW.admin_edited_at IS DISTINCT FROM OLD.admin_edited_at
                 );

  IF v_is_admin_edit THEN
    v_is_admin := true;
  END IF;

  -- 1) Never allow overtime_segments to be cleared while hour_type still says overtime
  IF NEW.hour_type IS NOT NULL
     AND NEW.hour_type LIKE 'overtime%'
     AND OLD.overtime_segments IS NOT NULL
     AND jsonb_typeof(OLD.overtime_segments::jsonb) = 'array'
     AND jsonb_array_length(OLD.overtime_segments::jsonb) > 0
     AND (
       NEW.overtime_segments IS NULL
       OR jsonb_typeof(NEW.overtime_segments::jsonb) <> 'array'
       OR jsonb_array_length(NEW.overtime_segments::jsonb) = 0
     )
  THEN
    IF NOT v_is_admin THEN
      RAISE EXCEPTION 'Kan ikke fjerne overtidsdetaljer fra en overtidsføring (id=%). Endre hour_type til normal først, eller be admin gjøre korrigeringen.', NEW.id;
    END IF;
  END IF;

  -- 2) Never allow start_time/end_time to silently disappear on update
  IF OLD.start_time IS NOT NULL AND NEW.start_time IS NULL AND NOT v_is_admin THEN
    RAISE EXCEPTION 'Kan ikke fjerne fra-tidspunkt på timeføring (id=%). Endre til nytt tidspunkt eller be admin.', NEW.id;
  END IF;
  IF OLD.end_time IS NOT NULL AND NEW.end_time IS NULL AND NOT v_is_admin THEN
    RAISE EXCEPTION 'Kan ikke fjerne til-tidspunkt på timeføring (id=%). Endre til nytt tidspunkt eller be admin.', NEW.id;
  END IF;

  -- 3) Never allow total hours to be zeroed out on an existing active entry
  IF COALESCE(OLD.hours, 0) > 0
     AND COALESCE(NEW.hours, 0) = 0
     AND COALESCE(NEW.status, '') <> 'deleted'
     AND NOT v_is_admin
  THEN
    RAISE EXCEPTION 'Kan ikke sette timer til 0 på en aktiv timeføring (id=%). Slett føringen i stedet.', NEW.id;
  END IF;

  RETURN NEW;
END;
$function$;