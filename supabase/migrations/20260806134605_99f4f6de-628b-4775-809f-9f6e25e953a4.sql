SELECT cron.unschedule('check-alerts-every-5min');
SELECT cron.schedule('check-alerts-every-5min', '*/5 * * * *', $$SELECT public.invoke_cron_edge_function('check-alerts');$$);