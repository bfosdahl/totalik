-- Add policy for company admins to update/approve time clock entries
CREATE POLICY "Company admins can update company clock entries"
ON public.time_clock_entries
FOR UPDATE
USING (
  company_id IN (
    SELECT profiles.company_id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  )
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
)
WITH CHECK (
  company_id IN (
    SELECT profiles.company_id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  )
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);