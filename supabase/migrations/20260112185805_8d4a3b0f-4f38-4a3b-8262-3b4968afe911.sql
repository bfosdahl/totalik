-- Create table for forsvarlighetsvurderinger (safety justification assessments)
CREATE TABLE public.hms_forsvarlighetsvurderinger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.company_departments(id) ON DELETE SET NULL,
  
  -- Assessment metadata
  assessment_number TEXT NOT NULL,
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('kortere_opplaring', 'arbeidstid', 'annet')),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Participants
  employer_name TEXT NOT NULL,
  employer_title TEXT,
  verneombud_name TEXT,
  tillitsvalgt_name TEXT,
  other_participants TEXT,
  
  -- Risk assessment summary
  risk_factors JSONB DEFAULT '[]'::jsonb,
  risk_level TEXT CHECK (risk_level IN ('lav', 'moderat', 'hoy')),
  risk_justification TEXT,
  
  -- For kortere opplæring specifically
  proposed_training_hours INTEGER,
  training_justification TEXT,
  training_topics JSONB DEFAULT '[]'::jsonb,
  
  -- For arbeidstid specifically
  work_schedule_description TEXT,
  fatigue_assessment TEXT,
  work_life_balance_assessment TEXT,
  
  -- Conclusion
  conclusion TEXT NOT NULL CHECK (conclusion IN ('forsvarlig', 'ikke_forsvarlig', 'forsvarlig_med_tiltak')),
  conclusion_justification TEXT,
  required_measures JSONB DEFAULT '[]'::jsonb,
  
  -- Follow-up
  next_review_date DATE,
  review_frequency TEXT,
  
  -- Signatures
  employer_signature TEXT,
  employer_signed_at TIMESTAMPTZ,
  verneombud_signature TEXT,
  verneombud_signed_at TIMESTAMPTZ,
  tillitsvalgt_signature TEXT,
  tillitsvalgt_signed_at TIMESTAMPTZ,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_signatures', 'completed', 'archived')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by_name TEXT
);

-- Enable RLS
ALTER TABLE public.hms_forsvarlighetsvurderinger ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their company's forsvarlighetsvurderinger"
ON public.hms_forsvarlighetsvurderinger
FOR SELECT
USING (
  company_id = get_user_company_id(auth.uid()) OR
  is_system_admin(auth.uid())
);

CREATE POLICY "Company admins can manage forsvarlighetsvurderinger"
ON public.hms_forsvarlighetsvurderinger
FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) AND (
    check_company_admin_role(auth.uid()) OR
    is_system_admin(auth.uid())
  )
);

-- Create sequence for assessment numbers
CREATE SEQUENCE IF NOT EXISTS hms_forsvarlighetsvurdering_number_seq START 1;

-- Function to generate assessment number
CREATE OR REPLACE FUNCTION public.generate_forsvarlighetsvurdering_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_num INTEGER;
  assessment_num TEXT;
BEGIN
  next_num := nextval('hms_forsvarlighetsvurdering_number_seq');
  assessment_num := 'FV-' || LPAD(next_num::TEXT, 4, '0');
  RETURN assessment_num;
END;
$$;

-- Trigger to auto-set assessment number
CREATE OR REPLACE FUNCTION public.set_forsvarlighetsvurdering_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.assessment_number IS NULL OR NEW.assessment_number = '' THEN
    NEW.assessment_number := generate_forsvarlighetsvurdering_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_forsvarlighetsvurdering_number_trigger
BEFORE INSERT ON public.hms_forsvarlighetsvurderinger
FOR EACH ROW
EXECUTE FUNCTION set_forsvarlighetsvurdering_number();

-- Trigger for updated_at
CREATE TRIGGER update_forsvarlighetsvurdering_updated_at
BEFORE UPDATE ON public.hms_forsvarlighetsvurderinger
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add index for faster queries
CREATE INDEX idx_forsvarlighetsvurderinger_company ON public.hms_forsvarlighetsvurderinger(company_id);
CREATE INDEX idx_forsvarlighetsvurderinger_status ON public.hms_forsvarlighetsvurderinger(status);