ALTER TABLE public.ik_mat_sensors
  ADD COLUMN IF NOT EXISTS alert_emails text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS min_temp_override numeric,
  ADD COLUMN IF NOT EXISTS max_temp_override numeric,
  ADD COLUMN IF NOT EXISTS breach_grace_minutes integer NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS offline_after_minutes integer NOT NULL DEFAULT 120,
  ADD COLUMN IF NOT EXISTS low_battery_threshold integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS breach_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_offline boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_temp_alert_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_offline_alert_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_battery_alert_at timestamptz,
  ADD COLUMN IF NOT EXISTS location text;

ALTER TABLE public.ik_mat_sensor_endpoints
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS alert_emails text[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS public.ik_mat_sensor_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  sensor_id uuid REFERENCES public.ik_mat_sensors(id) ON DELETE CASCADE,
  equipment_id uuid,
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'high',
  message text NOT NULL,
  temperature numeric,
  deviation_number text,
  recipients text[] NOT NULL DEFAULT '{}',
  email_status text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ik_mat_sensor_alerts TO authenticated;
GRANT ALL ON public.ik_mat_sensor_alerts TO service_role;

ALTER TABLE public.ik_mat_sensor_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company sensor alerts"
  ON public.ik_mat_sensor_alerts FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can manage sensor alerts"
  ON public.ik_mat_sensor_alerts FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid())
         AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid())))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid())
         AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid())));

CREATE INDEX IF NOT EXISTS idx_ik_mat_sensor_alerts_company_created
  ON public.ik_mat_sensor_alerts (company_id, created_at DESC);

SELECT cron.schedule(
  'ik-mat-sensor-watchdog',
  '*/15 * * * *',
  $$SELECT public.invoke_cron_edge_function('ik-mat-sensor-watchdog')$$
);