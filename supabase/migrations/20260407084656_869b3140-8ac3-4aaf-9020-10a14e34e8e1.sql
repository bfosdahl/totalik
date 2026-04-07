
-- Update existing jobs to run at 06:00 UTC (08:00 norsk tid)
SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'check-hms-card-expiry-daily'),
  '0 6 * * *'
);
SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'check-course-expiry-daily'),
  '0 6 * * *'
);
SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'check-deviation-deadlines-daily'),
  '0 6 * * *'
);
SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'check-ks2-deadlines-daily'),
  '0 6 * * *'
);

-- Add midday runs at 10:00 UTC (12:00 norsk tid)
SELECT cron.schedule(
  'check-hms-card-expiry-midday',
  '0 10 * * *',
  $$SELECT public.invoke_cron_edge_function('check-hms-card-expiry')$$
);
SELECT cron.schedule(
  'check-course-expiry-midday',
  '0 10 * * *',
  $$SELECT public.invoke_cron_edge_function('check-course-expiry')$$
);
SELECT cron.schedule(
  'check-deviation-deadlines-midday',
  '0 10 * * *',
  $$SELECT public.invoke_cron_edge_function('check-deviation-deadlines')$$
);
SELECT cron.schedule(
  'check-ks2-deadlines-midday',
  '0 10 * * *',
  $$SELECT public.invoke_cron_edge_function('check-ks2-deadlines')$$
);

-- Add afternoon runs at 14:30 UTC (16:30 norsk tid)
SELECT cron.schedule(
  'check-hms-card-expiry-afternoon',
  '30 14 * * *',
  $$SELECT public.invoke_cron_edge_function('check-hms-card-expiry')$$
);
SELECT cron.schedule(
  'check-course-expiry-afternoon',
  '30 14 * * *',
  $$SELECT public.invoke_cron_edge_function('check-course-expiry')$$
);
SELECT cron.schedule(
  'check-deviation-deadlines-afternoon',
  '30 14 * * *',
  $$SELECT public.invoke_cron_edge_function('check-deviation-deadlines')$$
);
SELECT cron.schedule(
  'check-ks2-deadlines-afternoon',
  '30 14 * * *',
  $$SELECT public.invoke_cron_edge_function('check-ks2-deadlines')$$
);
