-- 1. Sensor endpoints: only company admins / system admins may read the row (contains webhook token + signature secret)
DROP POLICY IF EXISTS "Users can view their company sensor endpoints" ON public.ik_mat_sensor_endpoints;
CREATE POLICY "Admins can view their company sensor endpoints"
ON public.ik_mat_sensor_endpoints
FOR SELECT
TO authenticated
USING (
  company_id = get_user_company_id(auth.uid())
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);

-- 2. Profiles: hide hourly_rate from direct table reads (coworkers). Admin/self access stays via SECURITY DEFINER RPCs.
DO $$
DECLARE
  cols text;
BEGIN
  SELECT string_agg(format('%I', column_name), ', ')
    INTO cols
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name <> 'hourly_rate';

  EXECUTE 'REVOKE SELECT ON public.profiles FROM authenticated';
  EXECUTE 'REVOKE SELECT ON public.profiles FROM anon';
  EXECUTE format('GRANT SELECT (%s) ON public.profiles TO authenticated', cols);
END $$;

GRANT ALL ON public.profiles TO service_role;