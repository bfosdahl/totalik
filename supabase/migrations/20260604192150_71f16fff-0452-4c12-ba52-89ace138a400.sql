DO $$
DECLARE v_secret text; v_req bigint;
BEGIN
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name='cron_secret_for_jobs' LIMIT 1;
  SELECT net.http_post(
    url:='https://sffkcqclfiffnpxorodd.supabase.co/functions/v1/send-renewal-email',
    headers:=jsonb_build_object('Content-Type','application/json','x-cron-secret',v_secret),
    body:='{"email":"leo.haartveit@gmail.com","firstName":"Leo","companyName":"HÅRTVEIT BYGG AS"}'::jsonb
  ) INTO v_req;
  RAISE NOTICE 'request_id=%', v_req;
END $$;