
-- 1. Tighten driving_log_entries INSERT policy to enforce company_id
DROP POLICY IF EXISTS "Users can insert their own driving log entries" ON public.driving_log_entries;

CREATE POLICY "Users can insert their own driving log entries"
ON public.driving_log_entries
FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  AND company_id = public.get_user_company_id(auth.uid())
);

-- 2. Allow authenticated users with a company profile to read admin_document_folders
CREATE POLICY "Authenticated company users can view admin document folders"
ON public.admin_document_folders
FOR SELECT
TO authenticated
USING (public.get_user_company_id(auth.uid()) IS NOT NULL);
