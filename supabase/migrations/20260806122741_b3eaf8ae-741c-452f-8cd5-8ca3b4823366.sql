CREATE OR REPLACE FUNCTION public.enforce_employment_contract_signature_only()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_caller_profile_id uuid;
  v_allowed text[] := ARRAY['employee_signature','signed_by_employee','signed_date','updated_at','status'];
  v_old jsonb;
  v_new jsonb;
  k text;
BEGIN
  IF public.is_system_admin(auth.uid())
     OR (public.is_company_admin(auth.uid()) AND NEW.company_id = public.get_user_company_id(auth.uid()))
  THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_caller_profile_id FROM public.profiles WHERE user_id = auth.uid();

  IF v_caller_profile_id IS NOT NULL AND NEW.employee_id = v_caller_profile_id THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    FOR k IN SELECT jsonb_object_keys(v_new) LOOP
      IF NOT (k = ANY(v_allowed)) AND (v_new -> k) IS DISTINCT FROM (v_old -> k) THEN
        RAISE EXCEPTION 'Employees may only sign their contract; field % requires admin role', k;
      END IF;
    END LOOP;

    -- Employees may only move status into signature states, and cannot un-sign
    IF NEW.status IS DISTINCT FROM OLD.status
       AND NEW.status NOT IN ('pending_signature','active') THEN
      RAISE EXCEPTION 'Employees may only set contract status to pending_signature or active';
    END IF;

    IF OLD.signed_by_employee IS TRUE AND NEW.signed_by_employee IS DISTINCT FROM TRUE THEN
      RAISE EXCEPTION 'Employees cannot remove their signature';
    END IF;

    IF NEW.status = 'active' AND NEW.signed_by_employer IS NOT TRUE THEN
      RAISE EXCEPTION 'Contract cannot be activated before the employer has signed';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;