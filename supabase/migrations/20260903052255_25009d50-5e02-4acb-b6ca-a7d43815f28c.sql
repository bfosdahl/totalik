DROP POLICY IF EXISTS "Users can update their own active clock entries" ON public.time_clock_entries;
CREATE POLICY "Users can update their own active clock entries"
ON public.time_clock_entries
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND status = 'active')
WITH CHECK (user_id = auth.uid());