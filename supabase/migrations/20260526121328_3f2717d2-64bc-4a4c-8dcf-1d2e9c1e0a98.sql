DROP POLICY IF EXISTS "Authenticated users can read published routine templates v2" ON public.admin_routine_templates_v2;

CREATE POLICY "Company users can read published routine templates v2"
ON public.admin_routine_templates_v2
FOR SELECT
TO authenticated
USING (
  status = 'published'
  AND public.get_user_company_id(auth.uid()) IS NOT NULL
);