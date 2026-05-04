ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS brreg_employee_count integer,
ADD COLUMN IF NOT EXISTS brreg_synced_at timestamp with time zone;