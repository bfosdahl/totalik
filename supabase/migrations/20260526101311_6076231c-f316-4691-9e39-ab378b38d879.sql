
-- 1) Bilpark / Vehicle fleet
CREATE TABLE IF NOT EXISTS public.company_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  license_plate text NOT NULL,
  make text,
  model text,
  year integer,
  vehicle_type text NOT NULL DEFAULT 'company',
  default_for_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

CREATE INDEX IF NOT EXISTS idx_company_vehicles_company ON public.company_vehicles(company_id) WHERE is_deleted = false;
CREATE UNIQUE INDEX IF NOT EXISTS uq_company_vehicles_plate ON public.company_vehicles(company_id, lower(license_plate)) WHERE is_deleted = false;

ALTER TABLE public.company_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view vehicles"
ON public.company_vehicles FOR SELECT
USING (
  is_deleted = false
  AND company_id = public.get_user_company_id(auth.uid())
);

CREATE POLICY "Company admins can manage vehicles"
ON public.company_vehicles FOR ALL
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid()))
)
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid())
  AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid()))
);

CREATE TRIGGER trg_company_vehicles_updated_at
BEFORE UPDATE ON public.company_vehicles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Audit + soft-delete coverage via existing pattern
SELECT public.attach_audit_trigger('company_vehicles');

-- 2) Link from driving log to vehicle (optional)
ALTER TABLE public.driving_log_entries
  ADD COLUMN IF NOT EXISTS vehicle_id uuid REFERENCES public.company_vehicles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_driving_log_entries_vehicle_id ON public.driving_log_entries(vehicle_id);

-- 3) Partner-logo support on KS2 projects (used in dagsrapport-PDF)
ALTER TABLE public.ks_module2_projects
  ADD COLUMN IF NOT EXISTS partner_logo_url text,
  ADD COLUMN IF NOT EXISTS partner_name text;
