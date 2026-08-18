CREATE OR REPLACE FUNCTION public.invoke_cron_edge_function(function_name text, payload jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_secret text;
  v_url text;
  v_result bigint;
BEGIN
  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE name = 'cron_secret_for_jobs'
  LIMIT 1;

  v_url := 'https://sffkcqclfiffnpxorodd.supabase.co/functions/v1/' || function_name;

  SELECT net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', v_secret
    ),
    body := coalesce(payload, '{}'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION public.invoke_cron_edge_function(text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.invoke_cron_edge_function(text, jsonb) TO postgres, service_role;
