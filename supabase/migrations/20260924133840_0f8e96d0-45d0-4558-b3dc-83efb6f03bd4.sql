CREATE OR REPLACE FUNCTION public.is_department_leader_of(_leader uuid, _employee uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles lp
    JOIN public.user_departments lud
      ON lud.is_department_admin = true AND lud.user_id IN (lp.id, lp.user_id)
    JOIN public.profiles ep
      ON ep.user_id = _employee AND ep.company_id = lp.company_id
    WHERE lp.user_id = _leader
      AND (
        ep.primary_department_id = lud.department_id
        OR EXISTS (SELECT 1 FROM public.user_departments eud
                   WHERE eud.department_id = lud.department_id
                     AND eud.user_id IN (ep.id, ep.user_id))
      )
  )
$$;

CREATE POLICY "Department leaders can view department time entries" ON public.time_entries
FOR SELECT TO authenticated
USING (company_id = get_user_company_id(auth.uid()) AND public.is_department_leader_of(auth.uid(), user_id));

CREATE POLICY "Department leaders can update department time entries" ON public.time_entries
FOR UPDATE TO authenticated
USING (company_id = get_user_company_id(auth.uid()) AND public.is_department_leader_of(auth.uid(), user_id))
WITH CHECK (company_id = get_user_company_id(auth.uid()) AND public.is_department_leader_of(auth.uid(), user_id));

CREATE POLICY "Department leaders can view department clock entries" ON public.time_clock_entries
FOR SELECT TO authenticated
USING (company_id = get_user_company_id(auth.uid()) AND public.is_department_leader_of(auth.uid(), user_id));

CREATE POLICY "Department leaders can update department clock entries" ON public.time_clock_entries
FOR UPDATE TO authenticated
USING (company_id = get_user_company_id(auth.uid()) AND public.is_department_leader_of(auth.uid(), user_id))
WITH CHECK (company_id = get_user_company_id(auth.uid()) AND public.is_department_leader_of(auth.uid(), user_id));

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS standard_daily_hours numeric NOT NULL DEFAULT 7.5;