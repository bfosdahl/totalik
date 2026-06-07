DO $$
DECLARE
  v_secret text;
  v_request_id bigint;
BEGIN
  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE name = 'cron_secret_for_jobs'
  LIMIT 1;

  IF v_secret IS NULL THEN
    RAISE EXCEPTION 'Mangler intern cron-secret for å kjøre passordsetting';
  END IF;

  SELECT net.http_post(
    url := 'https://sffkcqclfiffnpxorodd.supabase.co/functions/v1/admin-set-password-oneoff',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', v_secret
    ),
    body := jsonb_build_object(
      'email', 'sivertsen@ssm-marine.no',
      'password', 'Totalik2026!'
    )
  ) INTO v_request_id;

  RAISE NOTICE 'Password reset request queued with id %', v_request_id;
END $$;