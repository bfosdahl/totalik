
-- Make end-of-trip fields nullable for active trips
ALTER TABLE public.driving_log_entries 
  ALTER COLUMN odometer_end DROP NOT NULL,
  ALTER COLUMN end_location DROP NOT NULL,
  ALTER COLUMN purpose DROP NOT NULL;

-- Update generated column to handle null odometer_end
ALTER TABLE public.driving_log_entries 
  ALTER COLUMN distance_km SET EXPRESSION AS (CASE WHEN odometer_end IS NOT NULL THEN (odometer_end - odometer_start) ELSE 0 END);
