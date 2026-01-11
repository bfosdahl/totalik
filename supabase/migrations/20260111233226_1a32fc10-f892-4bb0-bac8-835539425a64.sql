-- =============================================
-- Department-aware RLS policies for AUDITS
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their company audits" ON public.audits;
DROP POLICY IF EXISTS "Users can create audits in their company" ON public.audits;
DROP POLICY IF EXISTS "Company admins can update their company audits" ON public.audits;
DROP POLICY IF EXISTS "Company admins can delete their company audits" ON public.audits;

-- SELECT: Department-aware viewing
CREATE POLICY "Users can view audits in their company/department"
ON public.audits
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

-- INSERT: Users can create audits for their company
CREATE POLICY "Users can create audits in their company"
ON public.audits
FOR INSERT
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid())
);

-- UPDATE: Department-aware updating
CREATE POLICY "Users can update audits in their company/department"
ON public.audits
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
CREATE POLICY "Admins can delete audits"
ON public.audits
FOR DELETE
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND (
    public.is_company_admin(auth.uid()) = true
    OR public.is_system_admin(auth.uid()) = true
  )
);

-- =============================================
-- Department-aware RLS policies for AUDIT_FORM_RESPONSES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their company audit form responses" ON public.audit_form_responses;
DROP POLICY IF EXISTS "Users can create audit form responses for their company" ON public.audit_form_responses;
DROP POLICY IF EXISTS "Users can update their company audit form responses" ON public.audit_form_responses;
DROP POLICY IF EXISTS "Users can delete their company audit form responses" ON public.audit_form_responses;

-- SELECT: Department-aware viewing
CREATE POLICY "Users can view audit form responses in their company/department"
ON public.audit_form_responses
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

-- INSERT: Users can create for their company
CREATE POLICY "Users can create audit form responses in their company"
ON public.audit_form_responses
FOR INSERT
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid())
);

-- UPDATE: Department-aware updating
CREATE POLICY "Users can update audit form responses in their company/department"
ON public.audit_form_responses
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
CREATE POLICY "Admins can delete audit form responses"
ON public.audit_form_responses
FOR DELETE
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND (
    public.is_company_admin(auth.uid()) = true
    OR public.is_system_admin(auth.uid()) = true
  )
);