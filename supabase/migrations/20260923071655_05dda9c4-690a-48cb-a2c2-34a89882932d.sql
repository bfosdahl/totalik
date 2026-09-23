DROP POLICY IF EXISTS "Users can delete their own unapproved clock entries" ON public.time_clock_entries;
CREATE POLICY "Users can delete their own unapproved clock entries"
ON public.time_clock_entries FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  AND COALESCE(approval_status, '') <> 'approved'
  AND approved_at IS NULL
);