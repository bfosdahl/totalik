-- Add SELECT policy for standard_work_schedules (was missing)
CREATE POLICY "Users can view standard work schedules in their company"
ON public.standard_work_schedules
FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
);