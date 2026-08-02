ALTER TABLE public.ik_mat_sensors
  ADD COLUMN IF NOT EXISTS battery_min_v numeric NOT NULL DEFAULT 3.0,
  ADD COLUMN IF NOT EXISTS battery_max_v numeric NOT NULL DEFAULT 3.6;