
-- Drop overly broad public-read policies on ks_templates and ks_template_items
-- (authenticated-scoped policies remain in place)
DROP POLICY IF EXISTS "Everyone can view KS templates" ON public.ks_templates;
DROP POLICY IF EXISTS "Everyone can view KS template items" ON public.ks_template_items;

-- Restrict company creation to system admins only.
-- Regular signup/onboarding uses the register-company edge function (service role bypasses RLS).
DROP POLICY IF EXISTS "Authenticated users can create a company" ON public.companies;
CREATE POLICY "Only system admins can create companies"
  ON public.companies
  FOR INSERT
  TO authenticated
  WITH CHECK (is_system_admin(auth.uid()));

-- Allow authenticated users to insert their own client-side error logs
CREATE POLICY "Authenticated users can insert error logs"
  ON public.client_error_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
