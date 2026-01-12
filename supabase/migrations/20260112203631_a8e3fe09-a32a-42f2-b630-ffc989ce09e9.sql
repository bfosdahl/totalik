-- Add employee_count column to companies table
-- This stores the number of employees reported during HMS setup
-- Used to determine if verneombud exemption is allowed (<5 employees) or election required (>=5 employees)
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS employee_count integer DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.companies.employee_count IS 'Number of employees at the company, used for verneombud requirements';