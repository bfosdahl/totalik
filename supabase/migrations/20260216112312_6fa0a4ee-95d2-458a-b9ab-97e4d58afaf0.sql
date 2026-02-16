
-- Drop the old check constraint
ALTER TABLE public.ergonomic_risk_assessments 
  DROP CONSTRAINT ergonomic_risk_assessments_assessment_type_check;

-- Change assessment_type from single text to text array
ALTER TABLE public.ergonomic_risk_assessments 
  ALTER COLUMN assessment_type TYPE text[] USING ARRAY[assessment_type];

-- Add new check constraint for array values
ALTER TABLE public.ergonomic_risk_assessments
  ADD CONSTRAINT ergonomic_risk_assessments_assessment_types_check
  CHECK (assessment_type <@ ARRAY['muskel_skjelett'::text, 'vibrasjon'::text, 'stoy'::text]);

-- Add equipment column
ALTER TABLE public.ergonomic_risk_assessments 
  ADD COLUMN IF NOT EXISTS equipment text[] DEFAULT '{}';
