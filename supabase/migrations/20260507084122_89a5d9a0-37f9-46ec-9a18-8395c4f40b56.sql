DROP POLICY IF EXISTS "Company admins can manage department assignments" ON public.user_departments;
DROP POLICY IF EXISTS "Users can view department assignments in their company" ON public.user_departments;
CREATE POLICY "Company admins can manage department assignments" ON public.user_departments FOR ALL
USING (
  EXISTS (SELECT 1 FROM company_departments cd WHERE cd.id = department_id AND cd.company_id = get_user_company_id(auth.uid()))
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM company_departments cd WHERE cd.id = department_id AND cd.company_id = get_user_company_id(auth.uid()))
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);
CREATE POLICY "Users can view department assignments in their company" ON public.user_departments FOR SELECT
USING (EXISTS (SELECT 1 FROM company_departments cd WHERE cd.id = department_id AND cd.company_id = get_user_company_id(auth.uid())));