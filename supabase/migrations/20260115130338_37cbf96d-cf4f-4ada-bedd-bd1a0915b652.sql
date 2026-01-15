-- Add INSERT policy for standard_work_schedules
CREATE POLICY "Company admins can create standard work schedules"
ON public.standard_work_schedules
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
  AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid()))
);

-- Add UPDATE policy for standard_work_schedules  
CREATE POLICY "Company admins can update standard work schedules"
ON public.standard_work_schedules
FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
  AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid()))
);

-- Add DELETE policy for standard_work_schedules
CREATE POLICY "Company admins can delete standard work schedules"
ON public.standard_work_schedules
FOR DELETE
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
  AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid()))
);