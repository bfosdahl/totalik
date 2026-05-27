
-- 1) PROFILES: revoke sensitive columns from authenticated/anon; expose via SECURITY DEFINER RPC
REVOKE SELECT (next_of_kin_name, next_of_kin_phone, next_of_kin_relation, signature_data)
  ON public.profiles FROM authenticated;
REVOKE SELECT (next_of_kin_name, next_of_kin_phone, next_of_kin_relation, signature_data)
  ON public.profiles FROM anon;

CREATE OR REPLACE FUNCTION public.get_profile_private(p_profile_id uuid)
RETURNS TABLE (
  next_of_kin_name text,
  next_of_kin_phone text,
  next_of_kin_relation text,
  signature_data text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_uid uuid;
  v_company uuid;
BEGIN
  SELECT user_id, company_id INTO v_owner_uid, v_company
  FROM public.profiles WHERE id = p_profile_id;

  IF v_owner_uid IS NULL THEN
    RETURN;
  END IF;

  -- Allow if: owner, system admin, or company admin in the same company
  IF v_owner_uid = auth.uid()
     OR public.is_system_admin(auth.uid())
     OR (public.is_company_admin(auth.uid()) AND v_company = public.get_user_company_id(auth.uid()))
  THEN
    RETURN QUERY
      SELECT p.next_of_kin_name, p.next_of_kin_phone, p.next_of_kin_relation, p.signature_data
      FROM public.profiles p WHERE p.id = p_profile_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_profile_private(uuid) TO authenticated;

-- 2) EMPLOYMENT_CONTRACTS: trigger restricts employee self-update to signature columns only
CREATE OR REPLACE FUNCTION public.enforce_employment_contract_signature_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_profile_id uuid;
BEGIN
  -- Admins bypass
  IF public.is_system_admin(auth.uid())
     OR (public.is_company_admin(auth.uid()) AND NEW.company_id = public.get_user_company_id(auth.uid()))
  THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_caller_profile_id FROM public.profiles WHERE user_id = auth.uid();

  -- If caller is the contract employee (non-admin), only signature fields may change
  IF NEW.employee_id = v_caller_profile_id THEN
    IF NEW.salary_amount IS DISTINCT FROM OLD.salary_amount
       OR NEW.position IS DISTINCT FROM OLD.position
       OR NEW.contract_type IS DISTINCT FROM OLD.contract_type
       OR NEW.start_date IS DISTINCT FROM OLD.start_date
       OR NEW.end_date IS DISTINCT FROM OLD.end_date
       OR NEW.weekly_hours IS DISTINCT FROM OLD.weekly_hours
       OR NEW.employee_id IS DISTINCT FROM OLD.employee_id
       OR NEW.company_id IS DISTINCT FROM OLD.company_id
       OR NEW.contract_content IS DISTINCT FROM OLD.contract_content
    THEN
      RAISE EXCEPTION 'Employees may only sign their contract; other fields require admin role';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_employment_contract_signature_only ON public.employment_contracts;
CREATE TRIGGER trg_employment_contract_signature_only
  BEFORE UPDATE ON public.employment_contracts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_employment_contract_signature_only();

-- 3) NABOVARSEL RECIPIENTS: restrict PII to company admins only
DROP POLICY IF EXISTS "Internal company members can view nabovarsel recipients" ON public.ks_module2_nabovarsel_recipients;
CREATE POLICY "Company admins can view nabovarsel recipients"
  ON public.ks_module2_nabovarsel_recipients
  FOR SELECT
  TO authenticated
  USING (
    public.is_system_admin(auth.uid())
    OR (company_id = public.get_user_company_id(auth.uid()) AND public.is_company_admin(auth.uid()))
  );

-- 4) AUDIT_LOG: remove client INSERT policy (triggers use SECURITY DEFINER and bypass RLS)
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_log;
