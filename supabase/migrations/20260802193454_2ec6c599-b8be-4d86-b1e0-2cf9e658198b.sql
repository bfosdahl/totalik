-- 1. employment_contracts: whitelist only signature fields for the employee
CREATE OR REPLACE FUNCTION public.enforce_employment_contract_signature_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_profile_id uuid;
  v_allowed text[] := ARRAY['employee_signature','signed_by_employee','signed_date','updated_at'];
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
  END IF;

  RETURN NEW;
END;
$$;

-- 2. profiles: block self-update of all privileged / financial / HR-controlled fields
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_protected text[] := ARRAY[
    'is_hms_responsible','is_verneombud','hms_card_required',
    'hms_card_obtained','hms_card_number','hms_card_expiry_date',
    'hourly_rate','employee_number','is_active','status',
    'primary_department_id','is_assigned_to_main',
    'accommodation_provided','accommodation_address',
    'company_id','user_id','email'
  ];
  v_old jsonb;
  v_new jsonb;
  k text;
BEGIN
  IF public.is_system_admin(auth.uid())
     OR (public.is_company_admin(auth.uid())
         AND NEW.company_id = public.get_user_company_id(auth.uid()))
  THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NOT NULL AND auth.uid() = OLD.user_id THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    FOREACH k IN ARRAY v_protected LOOP
      IF (v_new -> k) IS DISTINCT FROM (v_old -> k) THEN
        RAISE EXCEPTION 'Not allowed to change protected profile field: %', k;
      END IF;
    END LOOP;
  ELSE
    -- non-owner, non-admin may not change role flags either
    IF NEW.is_hms_responsible IS DISTINCT FROM OLD.is_hms_responsible
       OR NEW.is_verneombud IS DISTINCT FROM OLD.is_verneombud THEN
      RAISE EXCEPTION 'Only admins can change is_hms_responsible or is_verneombud';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. profiles_next_of_kin: add missing WITH CHECK
DROP POLICY IF EXISTS "Users update own next of kin" ON public.profiles_next_of_kin;
CREATE POLICY "Users update own next of kin"
ON public.profiles_next_of_kin
FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profiles_next_of_kin.profile_id AND p.user_id = auth.uid()))
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profiles_next_of_kin.profile_id AND p.user_id = auth.uid())
  AND company_id = public.get_user_company_id(auth.uid())
);

-- 4. ks_module2_project_access: scope self-update policy WITH CHECK to owner only
DROP POLICY IF EXISTS "Users can update their own access last_login" ON public.ks_module2_project_access;
CREATE POLICY "Users can update their own access last_login"
ON public.ks_module2_project_access
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
