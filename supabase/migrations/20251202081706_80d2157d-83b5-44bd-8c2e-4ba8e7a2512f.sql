-- Ansettelsesavtaler / Employment contracts
CREATE TABLE IF NOT EXISTS public.employment_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contract_type TEXT NOT NULL, -- 'fast', 'midlertidig', 'vikariat', 'læring'
  contract_file_path TEXT,
  position TEXT NOT NULL,
  employment_percentage INTEGER NOT NULL DEFAULT 100,
  start_date DATE NOT NULL,
  end_date DATE, -- null for permanent positions
  probation_period_months INTEGER,
  signed_date DATE,
  signed_by_employee BOOLEAN DEFAULT FALSE,
  signed_by_employer BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'active', 'expired', 'terminated'
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fravær / Absence records
CREATE TABLE IF NOT EXISTS public.employee_absence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  absence_type TEXT NOT NULL, -- 'sykdom', 'egenmelding', 'permisjon', 'omsorgspermisjon', 'foreldrepermisjon'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  reason TEXT,
  medical_certificate_path TEXT, -- path to uploaded legeerklæring
  status TEXT NOT NULL DEFAULT 'registered', -- 'registered', 'approved', 'rejected'
  registered_by UUID REFERENCES profiles(id),
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Medarbeidersamtaler / Employee meetings
CREATE TABLE IF NOT EXISTS public.employee_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  meeting_type TEXT NOT NULL DEFAULT 'medarbeidersamtale', -- 'medarbeidersamtale', 'utviklingssamtale', 'oppfølging'
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  meeting_leader UUID REFERENCES profiles(id),
  meeting_leader_name TEXT,
  status TEXT NOT NULL DEFAULT 'planned', -- 'planned', 'completed', 'cancelled'
  
  -- Meeting topics/content
  goals_discussed TEXT,
  wellbeing_discussed TEXT,
  development_discussed TEXT,
  other_topics TEXT,
  
  -- Action items
  action_items JSONB DEFAULT '[]'::jsonb,
  
  -- Notes and summary
  meeting_notes TEXT,
  employee_signature TEXT,
  leader_signature TEXT,
  signed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Medarbeiderundersøkelser / Employee surveys
CREATE TABLE IF NOT EXISTS public.employee_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  survey_title TEXT NOT NULL,
  survey_description TEXT,
  survey_type TEXT NOT NULL DEFAULT 'general', -- 'general', 'pulse', 'hms', 'culture'
  questions JSONB NOT NULL DEFAULT '[]'::jsonb, -- array of questions with type, text, options
  target_group TEXT DEFAULT 'all', -- 'all', 'avdeling', 'specific'
  target_employee_ids UUID[], -- specific employees if target_group = 'specific'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_anonymous BOOLEAN DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'active', 'closed'
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Svar på undersøkelser / Survey responses
CREATE TABLE IF NOT EXISTS public.survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES employee_surveys(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES profiles(id), -- null if anonymous
  responses JSONB NOT NULL DEFAULT '{}'::jsonb, -- question_id -> answer mapping
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employment_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_absence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employment_contracts
CREATE POLICY "Users can view contracts in their company"
  ON public.employment_contracts FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can manage contracts"
  ON public.employment_contracts FOR ALL
  USING (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())))
  WITH CHECK (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));

-- RLS Policies for employee_absence
CREATE POLICY "Users can view absence in their company"
  ON public.employee_absence FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Employees can register their own absence"
  ON public.employee_absence FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()) AND employee_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Employees can update their own absence"
  ON public.employee_absence FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()) AND employee_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all absence"
  ON public.employee_absence FOR ALL
  USING (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())))
  WITH CHECK (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));

-- RLS Policies for employee_meetings
CREATE POLICY "Users can view meetings in their company"
  ON public.employee_meetings FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can manage meetings"
  ON public.employee_meetings FOR ALL
  USING (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())))
  WITH CHECK (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));

-- RLS Policies for employee_surveys
CREATE POLICY "Users can view surveys in their company"
  ON public.employee_surveys FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can manage surveys"
  ON public.employee_surveys FOR ALL
  USING (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())))
  WITH CHECK (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));

-- RLS Policies for survey_responses
CREATE POLICY "Employees can submit survey responses"
  ON public.survey_responses FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Employees can view their own responses"
  ON public.survey_responses FOR SELECT
  USING (
    company_id = get_user_company_id(auth.uid()) AND 
    (employee_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
  );

CREATE POLICY "Admins can view all responses"
  ON public.survey_responses FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_employment_contracts_updated_at BEFORE UPDATE ON public.employment_contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_absence_updated_at BEFORE UPDATE ON public.employee_absence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_meetings_updated_at BEFORE UPDATE ON public.employee_meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_surveys_updated_at BEFORE UPDATE ON public.employee_surveys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();