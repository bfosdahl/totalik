
CREATE TABLE public.ik_mat_sensor_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  department_id uuid,
  token text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  last_received_at timestamptz,
  last_error text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ik_mat_sensors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  department_id uuid,
  endpoint_id uuid REFERENCES public.ik_mat_sensor_endpoints(id) ON DELETE SET NULL,
  equipment_id uuid REFERENCES public.ik_mat_temperature_equipment(id) ON DELETE SET NULL,
  external_id text NOT NULL,
  name text,
  provider text,
  is_active boolean NOT NULL DEFAULT true,
  last_reading_at timestamptz,
  last_temperature numeric,
  last_battery numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, external_id)
);

CREATE INDEX idx_ik_mat_sensors_company ON public.ik_mat_sensors(company_id);
CREATE INDEX idx_ik_mat_sensor_endpoints_token ON public.ik_mat_sensor_endpoints(token);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ik_mat_sensor_endpoints TO authenticated;
GRANT ALL ON public.ik_mat_sensor_endpoints TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ik_mat_sensors TO authenticated;
GRANT ALL ON public.ik_mat_sensors TO service_role;

ALTER TABLE public.ik_mat_sensor_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ik_mat_sensors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company sensor endpoints"
ON public.ik_mat_sensor_endpoints FOR SELECT TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can manage sensor endpoints"
ON public.ik_mat_sensor_endpoints FOR ALL TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()) AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid())))
WITH CHECK (company_id = public.get_user_company_id(auth.uid()) AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid())));

CREATE POLICY "Users can view their company sensors"
ON public.ik_mat_sensors FOR SELECT TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can manage sensors"
ON public.ik_mat_sensors FOR ALL TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()) AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid())))
WITH CHECK (company_id = public.get_user_company_id(auth.uid()) AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid())));

CREATE TRIGGER update_ik_mat_sensor_endpoints_updated_at
BEFORE UPDATE ON public.ik_mat_sensor_endpoints
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ik_mat_sensors_updated_at
BEFORE UPDATE ON public.ik_mat_sensors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
