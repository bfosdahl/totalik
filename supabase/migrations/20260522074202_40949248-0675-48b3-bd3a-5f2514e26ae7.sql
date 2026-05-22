DROP POLICY IF EXISTS "Users can view their company transparency act requests" ON public.transparency_act_requests;

CREATE POLICY "Admins can view their company transparency act requests"
ON public.transparency_act_requests
FOR SELECT
USING (
  company_id = get_user_company_id(auth.uid())
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);