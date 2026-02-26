-- Drop the restrictive insert policy
DROP POLICY "Authenticated users can insert own notifications" ON public.notification_log;

-- Create a new insert policy that allows users to insert notifications for anyone in their company
CREATE POLICY "Users can insert notifications for same company"
ON public.notification_log
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid()
  )
);