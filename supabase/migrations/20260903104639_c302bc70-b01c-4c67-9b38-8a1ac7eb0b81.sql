CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  result json;
BEGIN
  IF NOT public.is_system_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT json_build_object(
    'totalCompanies', (SELECT count(*) FROM public.companies),
    'activeCompanies', (SELECT count(*) FROM public.companies WHERE status = 'active'),
    'totalUsers', (SELECT count(*) FROM public.profiles),
    'activeUsers', (SELECT count(*) FROM public.profiles WHERE is_active = true)
  ) INTO result;

  RETURN result;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_dashboard_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated, service_role;