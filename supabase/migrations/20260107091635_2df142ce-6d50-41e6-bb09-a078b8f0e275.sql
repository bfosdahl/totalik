-- Fix overly permissive RLS policies (WITH CHECK (true))

-- 1. Fix ks_module2_access_log INSERT policy
-- Access logs track who accessed a project - restrict to authenticated users
DROP POLICY IF EXISTS "System can insert access logs" ON public.ks_module2_access_log;
CREATE POLICY "Authenticated users can insert access logs"
ON public.ks_module2_access_log
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. Fix ks_module2_checklist_reminders INSERT policy
-- Reminders are created by the system/edge functions - restrict to authenticated company members
DROP POLICY IF EXISTS "Service role can insert reminders" ON public.ks_module2_checklist_reminders;
CREATE POLICY "Company members can insert reminders"
ON public.ks_module2_checklist_reminders
FOR INSERT
TO authenticated
WITH CHECK (
  company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid())
);

-- 3. Fix notification_log INSERT policy
-- Notifications are tied to specific users - restrict to authenticated users for their own notifications
DROP POLICY IF EXISTS "System can insert notifications" ON public.notification_log;
CREATE POLICY "Authenticated users can insert own notifications"
ON public.notification_log
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);