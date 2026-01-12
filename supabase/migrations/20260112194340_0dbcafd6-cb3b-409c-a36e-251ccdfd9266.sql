-- Add incident_date column to deviations table
ALTER TABLE public.deviations 
ADD COLUMN IF NOT EXISTS incident_date DATE;

-- Add comment for clarity
COMMENT ON COLUMN public.deviations.incident_date IS 'Date when the incident/deviation was discovered';
COMMENT ON COLUMN public.deviations.incident_time IS 'Time when the incident/deviation occurred (optional)';