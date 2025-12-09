-- Drop and recreate UPDATE policy with proper WITH CHECK clause
DROP POLICY IF EXISTS "Users can update their own active clock entries" ON time_clock_entries;

CREATE POLICY "Users can update their own active clock entries"
ON time_clock_entries
FOR UPDATE
USING (user_id = auth.uid() AND status = 'active')
WITH CHECK (user_id = auth.uid());