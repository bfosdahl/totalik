
CREATE TABLE public.system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metric_value NUMERIC,
  threshold_value NUMERIC,
  status TEXT NOT NULL DEFAULT 'active',
  resolved_at TIMESTAMPTZ,
  resolved_by_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System admins can view alerts"
  ON public.system_alerts FOR SELECT
  TO authenticated
  USING (public.is_system_admin(auth.uid()));

CREATE POLICY "System admins can update alerts"
  ON public.system_alerts FOR UPDATE
  TO authenticated
  USING (public.is_system_admin(auth.uid()));

CREATE INDEX idx_system_alerts_status ON public.system_alerts(status);
CREATE INDEX idx_system_alerts_type_created ON public.system_alerts(alert_type, created_at DESC);
