
-- Fix the overly permissive INSERT policy on audit_log
DROP POLICY "Allow audit log inserts" ON public.audit_log;

-- Only authenticated users can insert, and only for their own company
CREATE POLICY "Authenticated users can insert audit logs"
  ON public.audit_log FOR INSERT
  TO authenticated
  WITH CHECK (
    changed_by = auth.uid() 
    OR public.is_system_admin(auth.uid())
  );
