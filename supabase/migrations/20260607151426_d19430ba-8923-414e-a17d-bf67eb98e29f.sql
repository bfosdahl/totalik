DO $$
DECLARE
  v_secret text;
BEGIN
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret_for_jobs';
  PERFORM net.http_post(
    url := 'https://sffkcqclfiffnpxorodd.supabase.co/functions/v1/admin-send-recovery-oneoff',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret', v_secret),
    body := jsonb_build_object('email','sivertsen@ssm-marine.no','firstName','Eirik')
  );
END $$;