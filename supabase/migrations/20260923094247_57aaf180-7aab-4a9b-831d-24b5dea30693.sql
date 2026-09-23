ALTER TABLE public.time_entries
  ADD COLUMN IF NOT EXISTS start_lat double precision,
  ADD COLUMN IF NOT EXISTS start_lng double precision,
  ADD COLUMN IF NOT EXISTS end_lat double precision,
  ADD COLUMN IF NOT EXISTS end_lng double precision,
  ADD COLUMN IF NOT EXISTS geofence_status_in text,
  ADD COLUMN IF NOT EXISTS geofence_status_out text,
  ADD COLUMN IF NOT EXISTS geofence_distance_in_m integer,
  ADD COLUMN IF NOT EXISTS geofence_distance_out_m integer,
  ADD COLUMN IF NOT EXISTS geofence_reason text;