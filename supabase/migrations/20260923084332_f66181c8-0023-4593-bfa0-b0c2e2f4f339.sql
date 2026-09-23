-- 1. Driving log GPS fields
ALTER TABLE public.driving_log_entries
  ADD COLUMN IF NOT EXISTS project_id UUID,
  ADD COLUMN IF NOT EXISTS tracking_mode TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS start_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS start_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS end_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS end_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS gps_distance_km NUMERIC,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS stops JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS gps_lost BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;

-- 2. Track points
CREATE TABLE IF NOT EXISTS public.driving_log_track_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID NOT NULL REFERENCES public.driving_log_entries(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  user_id UUID NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dl_track_points_entry ON public.driving_log_track_points(entry_id, recorded_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.driving_log_track_points TO authenticated;
GRANT ALL ON public.driving_log_track_points TO service_role;

ALTER TABLE public.driving_log_track_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own track points" ON public.driving_log_track_points;
CREATE POLICY "Users manage own track points"
ON public.driving_log_track_points FOR ALL TO authenticated
USING (
  user_id IN (SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid())
)
WITH CHECK (
  user_id IN (SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins view company track points" ON public.driving_log_track_points;
CREATE POLICY "Admins view company track points"
ON public.driving_log_track_points FOR SELECT TO authenticated
USING (
  (public.is_company_admin(auth.uid()) OR public.has_role(auth.uid(), 'system_admin'))
  AND company_id IN (SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid())
);

-- 3. Vehicle odometer
ALTER TABLE public.company_vehicles
  ADD COLUMN IF NOT EXISTS current_odometer NUMERIC;

-- 4. Project geofence
ALTER TABLE public.ks_module2_projects
  ADD COLUMN IF NOT EXISTS geofence_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS geofence_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS geofence_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS geofence_radius_m INTEGER NOT NULL DEFAULT 150;

-- 5. Company setting
ALTER TABLE public.ks_module2_settings
  ADD COLUMN IF NOT EXISTS geofence_allow_outside BOOLEAN NOT NULL DEFAULT true;

-- 6. Clock entries geofence
ALTER TABLE public.time_clock_entries
  ADD COLUMN IF NOT EXISTS project_id UUID,
  ADD COLUMN IF NOT EXISTS clock_in_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS clock_in_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS clock_out_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS clock_out_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS geofence_status_in TEXT,
  ADD COLUMN IF NOT EXISTS geofence_status_out TEXT,
  ADD COLUMN IF NOT EXISTS geofence_distance_in_m NUMERIC,
  ADD COLUMN IF NOT EXISTS geofence_distance_out_m NUMERIC,
  ADD COLUMN IF NOT EXISTS geofence_reason TEXT;

-- 7. Time entries geofence
ALTER TABLE public.time_entries
  ADD COLUMN IF NOT EXISTS clock_in_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS clock_in_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS clock_out_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS clock_out_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS geofence_status_in TEXT,
  ADD COLUMN IF NOT EXISTS geofence_status_out TEXT,
  ADD COLUMN IF NOT EXISTS geofence_distance_in_m NUMERIC,
  ADD COLUMN IF NOT EXISTS geofence_distance_out_m NUMERIC,
  ADD COLUMN IF NOT EXISTS geofence_reason TEXT;