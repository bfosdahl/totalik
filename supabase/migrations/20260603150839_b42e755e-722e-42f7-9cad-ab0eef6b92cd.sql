SELECT net.http_post(
  url := 'https://sffkcqclfiffnpxorodd.supabase.co/functions/v1/admin-send-revision',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1)
  ),
  body := '{}'::jsonb
) AS request_id;