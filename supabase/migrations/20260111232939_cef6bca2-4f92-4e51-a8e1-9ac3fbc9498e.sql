-- Drop the conflicting policy first
DROP POLICY IF EXISTS "Users can create deviations in their company" ON public.deviations;
DROP POLICY IF EXISTS "Users can update deviations in their company/department" ON public.deviations;
DROP POLICY IF EXISTS "Admins can delete deviations" ON public.deviations;
DROP POLICY IF EXISTS "Users can view deviations in their company/department" ON public.deviations;

-- Recreate all department-aware policies for deviations

-- SELECT: Department-aware viewing
CREATE POLICY "Users can view deviations in their company/department"
ON public.deviations
FOR SELECT
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND (
    public.is_company_admin(auth.uid()) = true
    OR public.is_system_admin(auth.uid()) = true
    OR department_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND department_id IS NOT NULL
    )
    OR department_id = (
      SELECT department_id FROM public.profiles WHERE user_id = auth.uid()
    )
    OR public.is_department_admin_for(auth.uid(), department_id) = true
  )
);

-- INSERT: Users can create deviations for their company
CREATE POLICY "Users can create deviations in their company"
ON public.deviations
FOR INSERT
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid())
);

-- UPDATE: Department-aware updating
CREATE POLICY "Users can update deviations in their company/department"
ON public.deviations
FOR UPDATE
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND (
    public.is_company_admin(auth.uid()) = true
    OR public.is_system_admin(auth.uid()) = true
    OR department_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND department_id IS NOT NULL
    )
    OR department_id = (
      SELECT department_id FROM public.profiles WHERE user_id = auth.uid()
    )
    OR public.is_department_admin_for(auth.uid(), department_id) = true
  )
);

-- DELETE: Only admins can delete
CREATE POLICY "Admins can delete deviations"
ON public.deviations
FOR DELETE
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND (
    public.is_company_admin(auth.uid()) = true
    OR public.is_system_admin(auth.uid()) = true
  )
);