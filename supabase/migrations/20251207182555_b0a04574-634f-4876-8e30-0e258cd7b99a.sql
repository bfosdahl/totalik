-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their company timeline events" ON public.ks_module2_timeline_events;
DROP POLICY IF EXISTS "Users can create timeline events for their company" ON public.ks_module2_timeline_events;
DROP POLICY IF EXISTS "Users can update their company timeline events" ON public.ks_module2_timeline_events;
DROP POLICY IF EXISTS "Users can delete their company timeline events" ON public.ks_module2_timeline_events;

-- Recreate policies using user_id column (not id)
CREATE POLICY "Users can view their company timeline events"
  ON public.ks_module2_timeline_events
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create timeline events for their company"
  ON public.ks_module2_timeline_events
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company timeline events"
  ON public.ks_module2_timeline_events
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company timeline events"
  ON public.ks_module2_timeline_events
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );