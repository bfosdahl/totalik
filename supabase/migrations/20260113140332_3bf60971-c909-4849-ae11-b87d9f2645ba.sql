-- =============================================
-- IK-MAT Temperaturlogg og Påminnelser System
-- =============================================

-- 1. Utstyr for temperaturmåling (kjøleskap, frysere, varmebuffet etc.)
CREATE TABLE public.ik_mat_temperature_equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Kjøleskap 1", "Hovedfryser", "Varmebuffet"
  equipment_type TEXT NOT NULL DEFAULT 'fridge', -- fridge, freezer, hot_display, cold_display
  location TEXT, -- "Kjøkken", "Lager", "Butikk"
  min_temp DECIMAL(5,2), -- Minimum akseptabel temperatur
  max_temp DECIMAL(5,2), -- Maksimum akseptabel temperatur
  measurement_frequency TEXT NOT NULL DEFAULT 'daily', -- daily, twice_daily, weekly
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Temperaturmålinger
CREATE TABLE public.ik_mat_temperature_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES public.ik_mat_temperature_equipment(id) ON DELETE CASCADE,
  temperature DECIMAL(5,2) NOT NULL, -- Faktisk målt temperatur
  is_acceptable BOOLEAN NOT NULL DEFAULT true, -- Automatisk satt basert på grenseverdier
  measured_by_id UUID REFERENCES public.profiles(id),
  measured_by_name TEXT NOT NULL,
  measured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  measurement_time TEXT, -- "morgen", "kveld" for twice_daily
  notes TEXT,
  corrective_action TEXT, -- Hva ble gjort hvis temperaturen var feil
  corrective_action_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Daglige oppgave-påminnelser
CREATE TABLE public.ik_mat_daily_task_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL, -- temperature_log, cleaning, checklist
  task_name TEXT NOT NULL, -- "Temperaturkontroll", "Daglig renhold"
  frequency TEXT NOT NULL DEFAULT 'daily', -- daily, weekdays, weekly
  reminder_time TIME NOT NULL DEFAULT '08:00', -- Når påminnelse sendes
  reminder_enabled BOOLEAN NOT NULL DEFAULT true,
  notify_all_users BOOLEAN NOT NULL DEFAULT false,
  notify_user_ids UUID[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, task_type)
);

-- 4. Logg over fullførte daglige oppgaver (for å sjekke om oppgave er gjort i dag)
CREATE TABLE public.ik_mat_daily_task_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_by_id UUID REFERENCES public.profiles(id),
  completed_by_name TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  UNIQUE(company_id, task_type, completed_date) -- Kun én fullføring per dag per oppgave
);

-- Indexes for performance
CREATE INDEX idx_ik_mat_temp_equipment_company ON public.ik_mat_temperature_equipment(company_id);
CREATE INDEX idx_ik_mat_temp_logs_company ON public.ik_mat_temperature_logs(company_id);
CREATE INDEX idx_ik_mat_temp_logs_equipment ON public.ik_mat_temperature_logs(equipment_id);
CREATE INDEX idx_ik_mat_temp_logs_measured_at ON public.ik_mat_temperature_logs(measured_at DESC);
CREATE INDEX idx_ik_mat_daily_completions_lookup ON public.ik_mat_daily_task_completions(company_id, task_type, completed_date);

-- Enable RLS
ALTER TABLE public.ik_mat_temperature_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ik_mat_temperature_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ik_mat_daily_task_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ik_mat_daily_task_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ik_mat_temperature_equipment
CREATE POLICY "Users can view their company equipment"
  ON public.ik_mat_temperature_equipment FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Company admins can manage equipment"
  ON public.ik_mat_temperature_equipment FOR ALL
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

-- RLS Policies for ik_mat_temperature_logs
CREATE POLICY "Users can view their company temperature logs"
  ON public.ik_mat_temperature_logs FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create temperature logs for their company"
  ON public.ik_mat_temperature_logs FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own temperature logs"
  ON public.ik_mat_temperature_logs FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

-- RLS Policies for ik_mat_daily_task_settings
CREATE POLICY "Users can view their company task settings"
  ON public.ik_mat_daily_task_settings FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Company admins can manage task settings"
  ON public.ik_mat_daily_task_settings FOR ALL
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

-- RLS Policies for ik_mat_daily_task_completions
CREATE POLICY "Users can view their company task completions"
  ON public.ik_mat_daily_task_completions FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can mark tasks as complete"
  ON public.ik_mat_daily_task_completions FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_ik_mat_temperature_equipment_updated_at
  BEFORE UPDATE ON public.ik_mat_temperature_equipment
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ik_mat_daily_task_settings_updated_at
  BEFORE UPDATE ON public.ik_mat_daily_task_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();