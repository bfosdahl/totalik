-- Add signature columns to employment_contracts table
ALTER TABLE public.employment_contracts 
ADD COLUMN IF NOT EXISTS employee_signature text,
ADD COLUMN IF NOT EXISTS employer_signature text;

-- Add comment for documentation
COMMENT ON COLUMN public.employment_contracts.employee_signature IS 'Base64 encoded signature image from employee';
COMMENT ON COLUMN public.employment_contracts.employer_signature IS 'Base64 encoded signature image from employer';