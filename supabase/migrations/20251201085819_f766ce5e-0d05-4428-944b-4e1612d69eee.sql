-- Add SG (Sentral Godkjenning) fields to companies table
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS sg_approved boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sg_org_number text,
ADD COLUMN IF NOT EXISTS sg_expiry_date date,
ADD COLUMN IF NOT EXISTS sg_approval_areas text[];

-- Add index for faster SG lookups
CREATE INDEX IF NOT EXISTS idx_companies_sg_org_number ON public.companies(sg_org_number);

COMMENT ON COLUMN public.companies.sg_approved IS 'Indicates if company has Sentral Godkjenning (Central Approval)';
COMMENT ON COLUMN public.companies.sg_org_number IS 'Organization number registered in SG Register';
COMMENT ON COLUMN public.companies.sg_expiry_date IS 'SG approval expiry date';
COMMENT ON COLUMN public.companies.sg_approval_areas IS 'Array of approved subject areas from SG Register';