CREATE OR REPLACE FUNCTION public.employment_contract_self_update_allowed(_contract_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employment_contracts c
    JOIN public.profiles p ON p.id = c.employee_id
    WHERE c.id = _contract_id
      AND p.user_id = auth.uid()
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
  AND status IN ('pending_signature','active')
);