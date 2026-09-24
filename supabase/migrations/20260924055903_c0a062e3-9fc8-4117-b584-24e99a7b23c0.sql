CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_protected text[] := ARRAY[
    'is_hms_responsible','is_verneombud','hms_card_required',
    'hms_card_obtained','hms_card_number','hms_card_expiry_date',
    'hourly_rate','employee_number','is_active','status',
    'primary_department_id','is_assigned_to_main',
    'accommodation_provided','accommodation_address',
    'company_id','user_id','email'
  ];
  v_old jsonb; v_new jsonb; k text;
BEGIN
  -- Trusted server-side calls (service role, no end-user JWT)
  IF auth.uid() IS NULL AND coalesce(auth.role(), current_setting('role', true)) = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF public.is_system_admin(auth.uid())
     OR (public.is_company_admin(auth.uid())
         AND NEW.company_id = public.get_user_company_id(auth.uid()))
  THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NOT NULL AND auth.uid() = OLD.user_id THEN
    v_old := to_jsonb(OLD); v_new := to_jsonb(NEW);
    FOREACH k IN ARRAY v_protected LOOP
      IF (v_new -> k) IS DISTINCT FROM (v_old -> k) THEN
        RAISE EXCEPTION 'Not allowed to change protected profile field: %', k;
      END IF;
    END LOOP;
  ELSE
    IF NEW.is_hms_responsible IS DISTINCT FROM OLD.is_hms_responsible
       OR NEW.is_verneombud IS DISTINCT FROM OLD.is_verneombud THEN
      RAISE EXCEPTION 'Only admins can change is_hms_responsible or is_verneombud';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;