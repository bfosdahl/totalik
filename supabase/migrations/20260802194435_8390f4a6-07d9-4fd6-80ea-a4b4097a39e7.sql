CREATE TABLE IF NOT EXISTS public.job_run_log (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  status text not null check (status in ('success','error')),
  started_at timestamptz not null default now(),
  finished_at timestamptz not null default now(),
  duration_ms integer,
  items_processed integer not null default 0,
  notifications_sent integer not null default 0,
  error_count integer not null default 0,
  error_message text,
  details jsonb,
  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_job_run_log_job_time ON public.job_run_log (job_name, created_at DESC);

GRANT SELECT ON public.job_run_log TO authenticated;
GRANT ALL ON public.job_run_log TO service_role;

ALTER TABLE public.job_run_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "System admins can view job runs" ON public.job_run_log;
CREATE POLICY "System admins can view job runs"
ON public.job_run_log FOR SELECT TO authenticated
USING (public.is_system_admin(auth.uid()));
