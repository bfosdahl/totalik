
-- IK Alkohol Routines - Rutinebibliotek
CREATE TABLE public.ik_alkohol_routines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  venue_type TEXT,
  routine_name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  is_mandatory BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  reviewed_by_id UUID REFERENCES public.profiles(id),
  reviewed_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- IK Alkohol Organization - Roller og ansvarsplan
CREATE TABLE public.ik_alkohol_organization (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  license_id UUID REFERENCES public.ik_alkohol_licenses(id) ON DELETE SET NULL,
  role_type TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  employee_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  responsibilities TEXT[],
  is_active BOOLEAN DEFAULT true,
  confirmed_at TIMESTAMPTZ,
  confirmed_signature TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- IK Alkohol Goals - Mål med KPI-er
CREATE TABLE public.ik_alkohol_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  goal_text TEXT NOT NULL,
  description TEXT,
  kpi_metric TEXT,
  kpi_target TEXT,
  kpi_current TEXT,
  responsible_id UUID REFERENCES public.profiles(id),
  responsible_name TEXT,
  period TEXT,
  deadline DATE,
  status TEXT DEFAULT 'on_track',
  actions TEXT[],
  is_predefined BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- IK Alkohol Risks - Risikoanalyse med prikksystem
CREATE TABLE public.ik_alkohol_risks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  risk_area TEXT NOT NULL,
  risk_description TEXT NOT NULL,
  probability INTEGER NOT NULL CHECK (probability >= 1 AND probability <= 5),
  consequence INTEGER NOT NULL CHECK (consequence >= 1 AND consequence <= 5),
  penalty_points INTEGER,
  risk_level TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN probability * consequence >= 15 THEN 'critical'
      WHEN probability * consequence >= 10 THEN 'high'
      WHEN probability * consequence >= 5 THEN 'medium'
      ELSE 'low'
    END
  ) STORED,
  existing_controls TEXT,
  planned_measures TEXT[],
  measure_responsible_id UUID REFERENCES public.profiles(id),
  measure_responsible_name TEXT,
  measure_deadline DATE,
  measure_status TEXT DEFAULT 'planned',
  residual_probability INTEGER CHECK (residual_probability >= 1 AND residual_probability <= 5),
  residual_consequence INTEGER CHECK (residual_consequence >= 1 AND residual_consequence <= 5),
  is_risk_period BOOLEAN DEFAULT false,
  risk_period_days TEXT[],
  risk_period_times TEXT,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- IK Alkohol Shift Responsibilities - Vaktansvarsplan
CREATE TABLE public.ik_alkohol_shift_responsibilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  shift_time TEXT,
  styrer_id UUID REFERENCES public.ik_alkohol_organization(id),
  styrer_name TEXT NOT NULL,
  stedfortreder_id UUID REFERENCES public.ik_alkohol_organization(id),
  stedfortreder_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.ik_alkohol_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ik_alkohol_organization ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ik_alkohol_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ik_alkohol_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ik_alkohol_shift_responsibilities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ik_alkohol_routines
CREATE POLICY "Users can view their company routines" ON public.ik_alkohol_routines
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Company admins can manage routines" ON public.ik_alkohol_routines
  FOR ALL USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
    AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid()))
  );

-- RLS Policies for ik_alkohol_organization
CREATE POLICY "Users can view their company organization" ON public.ik_alkohol_organization
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Company admins can manage organization" ON public.ik_alkohol_organization
  FOR ALL USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
    AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid()))
  );

-- RLS Policies for ik_alkohol_goals
CREATE POLICY "Users can view their company goals" ON public.ik_alkohol_goals
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Company admins can manage goals" ON public.ik_alkohol_goals
  FOR ALL USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
    AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid()))
  );

-- RLS Policies for ik_alkohol_risks
CREATE POLICY "Users can view their company risks" ON public.ik_alkohol_risks
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Company admins can manage risks" ON public.ik_alkohol_risks
  FOR ALL USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
    AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid()))
  );

-- RLS Policies for ik_alkohol_shift_responsibilities
CREATE POLICY "Users can view their company shifts" ON public.ik_alkohol_shift_responsibilities
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Company admins can manage shifts" ON public.ik_alkohol_shift_responsibilities
  FOR ALL USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
    AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid()))
  );

-- Indexes for performance
CREATE INDEX idx_ik_alkohol_routines_company ON public.ik_alkohol_routines(company_id);
CREATE INDEX idx_ik_alkohol_routines_category ON public.ik_alkohol_routines(category);
CREATE INDEX idx_ik_alkohol_organization_company ON public.ik_alkohol_organization(company_id);
CREATE INDEX idx_ik_alkohol_goals_company ON public.ik_alkohol_goals(company_id);
CREATE INDEX idx_ik_alkohol_risks_company ON public.ik_alkohol_risks(company_id);
CREATE INDEX idx_ik_alkohol_risks_level ON public.ik_alkohol_risks(risk_level);
CREATE INDEX idx_ik_alkohol_shift_company ON public.ik_alkohol_shift_responsibilities(company_id);
CREATE INDEX idx_ik_alkohol_shift_date ON public.ik_alkohol_shift_responsibilities(shift_date);

-- Triggers for updated_at
CREATE TRIGGER update_ik_alkohol_routines_updated_at
  BEFORE UPDATE ON public.ik_alkohol_routines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ik_alkohol_organization_updated_at
  BEFORE UPDATE ON public.ik_alkohol_organization
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ik_alkohol_goals_updated_at
  BEFORE UPDATE ON public.ik_alkohol_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ik_alkohol_risks_updated_at
  BEFORE UPDATE ON public.ik_alkohol_risks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ik_alkohol_shift_updated_at
  BEFORE UPDATE ON public.ik_alkohol_shift_responsibilities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
