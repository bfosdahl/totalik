-- 1. Vendor integrations
CREATE TABLE public.ik_mat_sensor_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  endpoint_id uuid REFERENCES public.ik_mat_sensor_endpoints(id) ON DELETE SET NULL,
  provider text NOT NULL,
  display_name text,
  mode text NOT NULL DEFAULT 'webhook',
  base_url text,
  poll_interval_minutes integer NOT NULL DEFAULT 15,
  is_active boolean NOT NULL DEFAULT true,
  credentials jsonb NOT NULL DEFAULT '{}'::jsonb,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  has_credentials boolean NOT NULL DEFAULT false,
  last_sync_at timestamptz,
  last_sync_status text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT (id, company_id, endpoint_id, provider, display_name, mode, base_url,
  poll_interval_minutes, is_active, config, has_credentials, last_sync_at,
  last_sync_status, last_error, created_at, updated_at)
  ON public.ik_mat_sensor_integrations TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ik_mat_sensor_integrations TO authenticated;
GRANT ALL ON public.ik_mat_sensor_integrations TO service_role;

ALTER TABLE public.ik_mat_sensor_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins manage sensor integrations"
ON public.ik_mat_sensor_integrations FOR ALL TO authenticated
USING (
  public.is_system_admin(auth.uid())
  OR (public.is_company_admin(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()))
)
WITH CHECK (
  public.is_system_admin(auth.uid())
  OR (public.is_company_admin(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()))
);

CREATE TRIGGER update_ik_mat_sensor_integrations_updated_at
BEFORE UPDATE ON public.ik_mat_sensor_integrations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Keep has_credentials in sync and stop clients from writing credentials directly
CREATE OR REPLACE FUNCTION public.sync_sensor_integration_credentials()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND auth.uid() IS NOT NULL THEN
    -- only edge functions (service role, auth.uid() IS NULL) may change credentials
    NEW.credentials := OLD.credentials;
  ELSIF TG_OP = 'INSERT' AND auth.uid() IS NOT NULL THEN
    NEW.credentials := '{}'::jsonb;
  END IF;
  NEW.has_credentials := (NEW.credentials IS NOT NULL AND NEW.credentials <> '{}'::jsonb);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_sensor_integration_credentials
BEFORE INSERT OR UPDATE ON public.ik_mat_sensor_integrations
FOR EACH ROW EXECUTE FUNCTION public.sync_sensor_integration_credentials();

CREATE INDEX idx_sensor_integrations_company ON public.ik_mat_sensor_integrations(company_id);
CREATE INDEX idx_sensor_integrations_active_poll ON public.ik_mat_sensor_integrations(is_active, mode);

-- 2. Payload debug log
CREATE TABLE public.ik_mat_sensor_payload_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  endpoint_id uuid REFERENCES public.ik_mat_sensor_endpoints(id) ON DELETE SET NULL,
  integration_id uuid REFERENCES public.ik_mat_sensor_integrations(id) ON DELETE SET NULL,
  direction text NOT NULL DEFAULT 'inbound',
  source text,
  http_status integer,
  status text NOT NULL DEFAULT 'ok',
  reading_count integer NOT NULL DEFAULT 0,
  error text,
  headers jsonb,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ik_mat_sensor_payload_log TO authenticated;
GRANT ALL ON public.ik_mat_sensor_payload_log TO service_role;

ALTER TABLE public.ik_mat_sensor_payload_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins read sensor payload log"
ON public.ik_mat_sensor_payload_log FOR SELECT TO authenticated
USING (
  public.is_system_admin(auth.uid())
  OR (public.is_company_admin(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()))
);

CREATE INDEX idx_sensor_payload_log_company_created
  ON public.ik_mat_sensor_payload_log(company_id, created_at DESC);

-- 3. Signature verification on endpoints
ALTER TABLE public.ik_mat_sensor_endpoints
  ADD COLUMN IF NOT EXISTS signature_secret text,
  ADD COLUMN IF NOT EXISTS signature_algo text NOT NULL DEFAULT 'hmac-sha256',
  ADD COLUMN IF NOT EXISTS signature_header text NOT NULL DEFAULT 'x-signature',
  ADD COLUMN IF NOT EXISTS debug_logging boolean NOT NULL DEFAULT true;