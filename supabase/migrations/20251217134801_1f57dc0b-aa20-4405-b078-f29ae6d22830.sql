-- Create HMS SJA (Sikker Jobb Analyse) table for IK/HMS module
CREATE TABLE public.hms_sja (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sja_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  planned_date DATE,
  responsible_name TEXT,
  responsible_id UUID REFERENCES public.profiles(id),
  participants TEXT,
  
  -- Risk assessment
  work_description TEXT,
  risks JSONB DEFAULT '[]'::jsonb,
  measures JSONB DEFAULT '[]'::jsonb,
  emergency_procedures TEXT,
  ppe_required TEXT,
  
  -- Status and completion
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  
  -- Signatures
  completed_at TIMESTAMPTZ,
  completed_by_id UUID REFERENCES public.profiles(id),
  completed_by_name TEXT,
  leader_signature TEXT,
  participants_signatures JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create sequence for SJA numbers
CREATE SEQUENCE IF NOT EXISTS hms_sja_number_seq START 1;

-- Create function to generate SJA number
CREATE OR REPLACE FUNCTION public.generate_hms_sja_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  next_num INTEGER;
  sja_num TEXT;
BEGIN
  next_num := nextval('hms_sja_number_seq');
  sja_num := 'SJA-HMS-' || LPAD(next_num::TEXT, 4, '0');
  RETURN sja_num;
END;
$$;

-- Create trigger for auto SJA number
CREATE OR REPLACE FUNCTION public.set_hms_sja_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.sja_number IS NULL OR NEW.sja_number = '' THEN
    NEW.sja_number := generate_hms_sja_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_hms_sja_number_trigger
  BEFORE INSERT ON public.hms_sja
  FOR EACH ROW
  EXECUTE FUNCTION public.set_hms_sja_number();

-- Create updated_at trigger
CREATE TRIGGER update_hms_sja_updated_at
  BEFORE UPDATE ON public.hms_sja
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create action plan follow-up table
CREATE TABLE public.action_plan_followups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  action_id TEXT NOT NULL,
  action_description TEXT NOT NULL,
  risk_description TEXT,
  
  -- Follow-up details
  followup_date DATE NOT NULL,
  followup_type TEXT NOT NULL DEFAULT 'status_check' CHECK (followup_type IN ('status_check', 'verification', 'audit', 'review')),
  notes TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue', 'cancelled')),
  completed_at TIMESTAMPTZ,
  completed_by_id UUID REFERENCES public.profiles(id),
  completed_by_name TEXT,
  
  -- Reminder settings
  reminder_enabled BOOLEAN DEFAULT true,
  reminder_days_before INTEGER DEFAULT 7,
  reminder_sent BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create updated_at trigger for followups
CREATE TRIGGER update_action_plan_followups_updated_at
  BEFORE UPDATE ON public.action_plan_followups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.hms_sja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_plan_followups ENABLE ROW LEVEL SECURITY;

-- RLS policies for hms_sja
CREATE POLICY "Users can view SJA for their company"
  ON public.hms_sja FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create SJA for their company"
  ON public.hms_sja FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update SJA for their company"
  ON public.hms_sja FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete SJA for their company"
  ON public.hms_sja FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- RLS policies for action_plan_followups
CREATE POLICY "Users can view followups for their company"
  ON public.action_plan_followups FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create followups for their company"
  ON public.action_plan_followups FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update followups for their company"
  ON public.action_plan_followups FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete followups for their company"
  ON public.action_plan_followups FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_hms_sja_company_id ON public.hms_sja(company_id);
CREATE INDEX idx_hms_sja_status ON public.hms_sja(status);
CREATE INDEX idx_action_plan_followups_company_id ON public.action_plan_followups(company_id);
CREATE INDEX idx_action_plan_followups_status ON public.action_plan_followups(status);
CREATE INDEX idx_action_plan_followups_followup_date ON public.action_plan_followups(followup_date);