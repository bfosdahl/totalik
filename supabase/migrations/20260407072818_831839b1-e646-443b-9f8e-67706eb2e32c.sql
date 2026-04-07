
-- Store the CRON_SECRET in vault for use by cron jobs
SELECT vault.create_secret('totalik-cron-2025-secure-key', 'cron_secret_for_jobs', 'CRON secret for scheduled edge function calls');

-- Create helper function to call edge functions with cron secret
CREATE OR REPLACE FUNCTION public.invoke_cron_edge_function(function_name text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    body := '{}'::jsonb
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Drop old broken cron jobs
SELECT cron.unschedule('check-deviation-deadlines-daily');
SELECT cron.unschedule('check-hms-card-expiry-daily');

-- Create fixed cron jobs with correct headers
SELECT cron.schedule(
  'check-deviation-deadlines-daily',
  '0 8 * * *',
  $$SELECT public.invoke_cron_edge_function('check-deviation-deadlines');$$
);

SELECT cron.schedule(
  'check-hms-card-expiry-daily',
  '0 8 * * *',
  $$SELECT public.invoke_cron_edge_function('check-hms-card-expiry');$$
);

-- Add missing cron job for course expiry
SELECT cron.schedule(
  'check-course-expiry-daily',
  '0 8 * * *',
  $$SELECT public.invoke_cron_edge_function('check-course-expiry');$$
);

-- Add missing cron job for KS2 deadlines
SELECT cron.schedule(
  'check-ks2-deadlines-daily',
  '0 8 * * *',
  $$SELECT public.invoke_cron_edge_function('check-ks2-deadlines');$$
);
