CREATE POLICY "Department leaders can manage department work schedules"
  ON public.work_schedules
  FOR ALL
  TO authenticated
  USING (
    company_id = get_user_company_id(auth.uid()) AND
    public.is_department_leader_of(auth.uid(), (SELECT user_id FROM public.profiles WHERE id = employee_id))
  )
  WITH CHECK (
    company_id = get_user_company_id(auth.uid()) AND
    public.is_department_leader_of(auth.uid(), (SELECT user_id FROM public.profiles WHERE id = employee_id))
  );