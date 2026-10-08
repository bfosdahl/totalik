create or replace function public.cleanup_old_logs()
returns void
language plpgsql
set search_path = public, cron, net, extensions
as $function$
begin
  -- pg_cron run history: keep 30 days
  delete from cron.job_run_details where end_time < now() - interval '30 days';
  -- app job log (job_run_log): keep 90 days
  delete from public.job_run_log where started_at < now() - interval '90 days';
  -- net._http_response is cleaned by pg_net itself; audit_log retention is handled by cleanup_audit_and_snapshots()
end;
$function$;