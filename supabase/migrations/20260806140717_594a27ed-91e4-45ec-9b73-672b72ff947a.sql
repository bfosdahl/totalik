
-- 1) time_clock_entries: block self-approval and tampering with approval/company fields
CREATE OR REPLACE FUNCTION public.prevent_time_clock_self_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.is_system_admin(auth.uid())
     OR (public.is_company_admin(auth.uid()) AND NEW.company_id = public.get_user_company_id(auth.uid()))
  THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NOT NULL AND auth.uid() = OLD.user_id THEN
    IF NEW.approval_status IS DISTINCT FROM OLD.approval_status
       OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
       OR NEW.approved_by_name IS DISTINCT FROM OLD.approved_by_name
       OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
       OR NEW.edited_by IS DISTINCT FROM OLD.edited_by
       OR NEW.edited_at IS DISTINCT FROM OLD.edited_at
       OR NEW.edit_reason IS DISTINCT FROM OLD.edit_reason
       OR NEW.company_id IS DISTINCT FROM OLD.company_id
       OR NEW.user_id IS DISTINCT FROM OLD.user_id
    THEN
      RAISE EXCEPTION 'Not allowed to change approval or ownership fields on your own time clock entry';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_time_clock_self_approval ON public.time_clock_entries;
CREATE TRIGGER trg_prevent_time_clock_self_approval
BEFORE UPDATE ON public.time_clock_entries
FOR EACH ROW EXECUTE FUNCTION public.prevent_time_clock_self_approval();

-- Tighten the self-update policy so approval state must stay untouched
DROP POLICY IF EXISTS "Users can update their own active clock entries" ON public.time_clock_entries;
CREATE POLICY "Users can update their own active clock entries"
ON public.time_clock_entries
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND status = 'active')
WITH CHECK (
  user_id = auth.uid()
  AND approval_status IS NOT DISTINCT FROM (
    SELECT t.approval_status FROM public.time_clock_entries t WHERE t.id = time_clock_entries.id
  )
  AND approved_by IS NOT DISTINCT FROM (
    SELECT t.approved_by FROM public.time_clock_entries t WHERE t.id = time_clock_entries.id
  )
);

-- 2) employment_contracts: employees may only sign, never change terms
DROP POLICY IF EXISTS "Employees can sign their own contract" ON public.employment_contracts;
CREATE POLICY "Employees can sign their own contract"
ON public.employment_contracts
FOR UPDATE
TO authenticated
USING (employee_id = (SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()))
WITH CHECK (
  employee_id = (SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid())
  AND salary_amount IS NOT DISTINCT FROM (
    SELECT c.salary_amount FROM public.employment_contracts c WHERE c.id = employment_contracts.id
  )
  AND signed_by_employer IS NOT DISTINCT FROM (
    SELECT c.signed_by_employer FROM public.employment_contracts c WHERE c.id = employment_contracts.id
  )
  AND company_id IS NOT DISTINCT FROM (
    SELECT c.company_id FROM public.employment_contracts c WHERE c.id = employment_contracts.id
  )
);

-- 3) ks_module2_project_access: self-update limited to login tracking
DROP POLICY IF EXISTS "Users can update their own access last_login" ON public.ks_module2_project_access;
CREATE POLICY "Users can update their own access last_login"
ON public.ks_module2_project_access
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND access_level IS NOT DISTINCT FROM (
    SELECT a.access_level FROM public.ks_module2_project_access a WHERE a.id = ks_module2_project_access.id
  )
  AND status IS NOT DISTINCT FROM (
    SELECT a.status FROM public.ks_module2_project_access a WHERE a.id = ks_module2_project_access.id
  )
  AND project_id IS NOT DISTINCT FROM (
    SELECT a.project_id FROM public.ks_module2_project_access a WHERE a.id = ks_module2_project_access.id
  )
);

-- 4) profiles: self-update may not touch privileged flags
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND company_id IS NOT DISTINCT FROM (
    SELECT p.company_id FROM public.profiles p WHERE p.id = profiles.id
  )
  AND is_verneombud IS NOT DISTINCT FROM (
    SELECT p.is_verneombud FROM public.profiles p WHERE p.id = profiles.id
  )
  AND is_hms_responsible IS NOT DISTINCT FROM (
    SELECT p.is_hms_responsible FROM public.profiles p WHERE p.id = profiles.id
  )
  AND hourly_rate IS NOT DISTINCT FROM (
    SELECT p.hourly_rate FROM public.profiles p WHERE p.id = profiles.id
  )
  AND is_active IS NOT DISTINCT FROM (
    SELECT p.is_active FROM public.profiles p WHERE p.id = profiles.id
  )
);
