-- Add process-nextcom-orders cron job every 5 minutes
SELECT cron.schedule(
  'process-nextcom-orders-every-5min',
  '*/5 * * * *',
  $$SELECT public.invoke_cron_edge_function('process-nextcom-orders')$$
);

-- Remove midday reminder jobs (keep only daily at 06:00 UTC / 08:00 norsk tid)
SELECT cron.unschedule('check-hms-card-expiry-midday');
SELECT cron.unschedule('check-course-expiry-midday');
SELECT cron.unschedule('check-deviation-deadlines-midday');
SELECT cron.unschedule('check-ks2-deadlines-midday');

-- Remove afternoon reminder jobs
SELECT cron.unschedule('check-hms-card-expiry-afternoon');
SELECT cron.unschedule('check-course-expiry-afternoon');
SELECT cron.unschedule('check-deviation-deadlines-afternoon');
SELECT cron.unschedule('check-ks2-deadlines-afternoon');