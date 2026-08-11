-- 1. employment_contracts: replace fragile self-referential WITH CHECK with trigger-enforced rule
DROP POLICY IF EXISTS "Employees can sign their own contract" ON public.employment_contracts;

CREATE POLICY "Employees can sign their own contract"
ON public.employment_contracts
FOR UPDATE
TO authenticated
USING (
  employee_id = (SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid())
)
WITH CHECK (
  employee_id = (SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid())
);

-- 2. ks_module2_project_access: remove fragile self-referential WITH CHECK, rely on triggers
DROP POLICY IF EXISTS "Users can update their own access last_login" ON public.ks_module2_project_access;

CREATE POLICY "Users can update their own access last_login"
ON public.ks_module2_project_access
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 3. global_chemicals: keep admin-only writes explicit and add input validation
DROP POLICY IF EXISTS "Only system admins can add global chemicals" ON public.global_chemicals;
CREATE POLICY "Only system admins can add global chemicals"
ON public.global_chemicals
FOR INSERT
TO authenticated
WITH CHECK (public.is_system_admin(auth.uid()));

DROP POLICY IF EXISTS "Only system admins can delete global chemicals" ON public.global_chemicals;
CREATE POLICY "Only system admins can delete global chemicals"
ON public.global_chemicals
FOR DELETE
TO authenticated
USING (public.is_system_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.validate_global_chemical()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  k text;
  v jsonb;
  j jsonb := to_jsonb(NEW);
BEGIN
  FOR k IN SELECT jsonb_object_keys(j) LOOP
    v := j -> k;
    IF jsonb_typeof(v) = 'string' AND length(v #>> '{}') > 5000 THEN
      RAISE EXCEPTION 'Value for % exceeds maximum allowed length', k;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_global_chemical ON public.global_chemicals;
CREATE TRIGGER trg_validate_global_chemical
BEFORE INSERT OR UPDATE ON public.global_chemicals
FOR EACH ROW EXECUTE FUNCTION public.validate_global_chemical();