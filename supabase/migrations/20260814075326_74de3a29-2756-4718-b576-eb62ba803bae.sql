-- Column-restricted self-update for employment_contracts
CREATE OR REPLACE FUNCTION public.employment_contract_self_update_columns_ok(
  _id uuid,
  _company_id uuid,
  _employee_id uuid,
  _contract_type text,
  _position text,
  _employment_percentage integer,
  _start_date date,
  _end_date date,
  _salary_amount numeric,
  _salary_type text,
  _vacation_days integer,
  _holiday_pay_percentage numeric,
  _working_hours_per_week numeric,
  _working_hours_per_day numeric,
  _notice_period_employee_months integer,
  _notice_period_employer_months integer,
  _signed_by_employer boolean,
  _employer_signature text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employment_contracts c
    WHERE c.id = _id
      AND c.company_id IS NOT DISTINCT FROM _company_id
      AND c.employee_id IS NOT DISTINCT FROM _employee_id
      AND c.contract_type IS NOT DISTINCT FROM _contract_type
      AND c.position IS NOT DISTINCT FROM _position
      AND c.employment_percentage IS NOT DISTINCT FROM _employment_percentage
      AND c.start_date IS NOT DISTINCT FROM _start_date
      AND c.end_date IS NOT DISTINCT FROM _end_date
      AND c.salary_amount IS NOT DISTINCT FROM _salary_amount
      AND c.salary_type IS NOT DISTINCT FROM _salary_type
      AND c.vacation_days IS NOT DISTINCT FROM _vacation_days
      AND c.holiday_pay_percentage IS NOT DISTINCT FROM _holiday_pay_percentage
      AND c.working_hours_per_week IS NOT DISTINCT FROM _working_hours_per_week
      AND c.working_hours_per_day IS NOT DISTINCT FROM _working_hours_per_day
      AND c.notice_period_employee_months IS NOT DISTINCT FROM _notice_period_employee_months
      AND c.notice_period_employer_months IS NOT DISTINCT FROM _notice_period_employer_months
      AND c.signed_by_employer IS NOT DISTINCT FROM _signed_by_employer
      AND c.employer_signature IS NOT DISTINCT FROM _employer_signature
  )
$$;

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
  AND public.employment_contract_self_update_allowed(id)
  AND status = ANY (ARRAY['pending_signature'::text, 'active'::text])
  AND public.employment_contract_self_update_columns_ok(
    id, company_id, employee_id, contract_type, "position", employment_percentage,
    start_date, end_date, salary_amount, salary_type, vacation_days,
    holiday_pay_percentage, working_hours_per_week, working_hours_per_day,
    notice_period_employee_months, notice_period_employer_months,
    signed_by_employer, employer_signature
  )
);

-- Column-restricted self-update for ks_module2_project_access
CREATE OR REPLACE FUNCTION public.ks_project_access_self_update_columns_ok(
  _id uuid,
  _project_id uuid,
  _subcontractor_id uuid,
  _user_id uuid,
  _email text,
  _access_level text,
  _role_in_project text,
  _status text,
  _expires_at timestamptz,
  _invited_by uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ks_module2_project_access a
    WHERE a.id = _id
      AND a.project_id IS NOT DISTINCT FROM _project_id
      AND a.subcontractor_id IS NOT DISTINCT FROM _subcontractor_id
      AND a.user_id IS NOT DISTINCT FROM _user_id
      AND a.email IS NOT DISTINCT FROM _email
      AND a.access_level::text IS NOT DISTINCT FROM _access_level
      AND a.role_in_project IS NOT DISTINCT FROM _role_in_project
      AND a.status::text IS NOT DISTINCT FROM _status
      AND a.expires_at IS NOT DISTINCT FROM _expires_at
      AND a.invited_by IS NOT DISTINCT FROM _invited_by
  )
$$;

DROP POLICY IF EXISTS "Users can update their own access last_login" ON public.ks_module2_project_access;
CREATE POLICY "Users can update their own access last_login"
ON public.ks_module2_project_access
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND public.ks_project_access_self_update_columns_ok(
    id, project_id, subcontractor_id, user_id, email,
    access_level::text, role_in_project, status::text, expires_at, invited_by
  )
);