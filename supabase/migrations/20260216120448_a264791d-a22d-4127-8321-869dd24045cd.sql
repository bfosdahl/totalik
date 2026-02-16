
-- Table for saving equipment vibration & noise assessments
CREATE TABLE public.equipment_exposure_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  vibration_type TEXT NOT NULL DEFAULT 'hand_arm' CHECK (vibration_type IN ('hand_arm', 'whole_body')),
  tools JSONB NOT NULL DEFAULT '[]'::jsonb,
  peak_noise_level NUMERIC,
  vibration_a8 NUMERIC,
  vibration_zone TEXT,
  noise_lex8h NUMERIC,
  noise_zone TEXT,
  assessed_by_id UUID REFERENCES public.profiles(id),
  assessed_by_name TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.equipment_exposure_assessments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own company assessments"
  ON public.equipment_exposure_assessments FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create assessments for own company"
  ON public.equipment_exposure_assessments FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own company assessments"
  ON public.equipment_exposure_assessments FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own company assessments"
  ON public.equipment_exposure_assessments FOR DELETE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

-- Auto-update timestamp
CREATE TRIGGER update_equipment_exposure_assessments_updated_at
  BEFORE UPDATE ON public.equipment_exposure_assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
