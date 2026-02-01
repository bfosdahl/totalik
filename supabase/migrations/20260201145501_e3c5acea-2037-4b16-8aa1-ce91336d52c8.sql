-- Add support for IK HMS Stoffkartotek in chemical risk assessments
-- Make company_chemical_entry_id nullable and add ik_hms_stoffkartotek_id

-- First, drop the existing unique constraint
ALTER TABLE public.chemical_risk_assessments 
DROP CONSTRAINT IF EXISTS chemical_risk_assessments_company_chemical_entry_id_key;

-- Make company_chemical_entry_id nullable
ALTER TABLE public.chemical_risk_assessments 
ALTER COLUMN company_chemical_entry_id DROP NOT NULL;

-- Add ik_hms_stoffkartotek_id column
ALTER TABLE public.chemical_risk_assessments 
ADD COLUMN ik_hms_stoffkartotek_id uuid REFERENCES public.ik_hms_stoffkartotek(id) ON DELETE CASCADE;

-- Add a check constraint to ensure at least one source is set
ALTER TABLE public.chemical_risk_assessments 
ADD CONSTRAINT check_chemical_source 
CHECK (
  (company_chemical_entry_id IS NOT NULL AND ik_hms_stoffkartotek_id IS NULL) OR
  (company_chemical_entry_id IS NULL AND ik_hms_stoffkartotek_id IS NOT NULL)
);

-- Add unique constraint for ik_hms_stoffkartotek_id
CREATE UNIQUE INDEX idx_chemical_risk_assessments_ik_hms 
ON public.chemical_risk_assessments (ik_hms_stoffkartotek_id) 
WHERE ik_hms_stoffkartotek_id IS NOT NULL;

-- Keep unique constraint for company_chemical_entry_id
CREATE UNIQUE INDEX idx_chemical_risk_assessments_company_entry 
ON public.chemical_risk_assessments (company_chemical_entry_id) 
WHERE company_chemical_entry_id IS NOT NULL;