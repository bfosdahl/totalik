
-- Fix 1: Correct broken RLS policies on ks_module2_meeting_items (use profiles.user_id instead of profiles.id)
DROP POLICY IF EXISTS "Users can create meeting items" ON public.ks_module2_meeting_items;
DROP POLICY IF EXISTS "Users can delete meeting items" ON public.ks_module2_meeting_items;
DROP POLICY IF EXISTS "Users can update meeting items" ON public.ks_module2_meeting_items;
DROP POLICY IF EXISTS "Users can view meeting items" ON public.ks_module2_meeting_items;

CREATE POLICY "Users can view meeting items"
ON public.ks_module2_meeting_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM ks_module2_meetings m
    WHERE m.id = ks_module2_meeting_items.meeting_id
      AND (
        m.company_id = get_user_company_id(auth.uid())
        OR is_system_admin(auth.uid())
        OR has_guest_project_access(m.project_id)
      )
  )
);

CREATE POLICY "Users can create meeting items"
ON public.ks_module2_meeting_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ks_module2_meetings m
    WHERE m.id = ks_module2_meeting_items.meeting_id
      AND (
        m.company_id = get_user_company_id(auth.uid())
        OR is_system_admin(auth.uid())
      )
  )
);

CREATE POLICY "Users can update meeting items"
ON public.ks_module2_meeting_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM ks_module2_meetings m
    WHERE m.id = ks_module2_meeting_items.meeting_id
      AND (
        m.company_id = get_user_company_id(auth.uid())
        OR is_system_admin(auth.uid())
      )
  )
);

CREATE POLICY "Users can delete meeting items"
ON public.ks_module2_meeting_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM ks_module2_meetings m
    WHERE m.id = ks_module2_meeting_items.meeting_id
      AND (
        m.company_id = get_user_company_id(auth.uid())
        OR is_system_admin(auth.uid())
      )
  )
);

-- Fix 2: Restrict deviation_deadline_reminders SELECT to admins only (was readable by all company members, exposing recipient emails)
DROP POLICY IF EXISTS "Users can view their company reminders" ON public.deviation_deadline_reminders;

CREATE POLICY "Company admins can view their company reminders"
ON public.deviation_deadline_reminders
FOR SELECT
USING (
  company_id = get_user_company_id(auth.uid())
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);
