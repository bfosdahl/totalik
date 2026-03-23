
-- Create sequence for daily report numbers
CREATE SEQUENCE IF NOT EXISTS ks_daily_report_number_seq START WITH 1;

-- Generate daily report number function
CREATE OR REPLACE FUNCTION public.generate_ks_daily_report_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_num INTEGER;
  report_num TEXT;
  current_year TEXT;
BEGIN
  next_num := nextval('ks_daily_report_number_seq');
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::text;
  report_num := 'DR-' || current_year || '-' || LPAD(next_num::TEXT, 4, '0');
  RETURN report_num;
END;
$$;

-- Daily reports table
CREATE TABLE public.ks_daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.ks_module2_projects(id) ON DELETE SET NULL,
  report_number TEXT NOT NULL DEFAULT '',
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  
  -- Weather
  weather_conditions TEXT,
  temperature_celsius NUMERIC,
  wind_conditions TEXT,
  precipitation TEXT,
  
  -- Personnel / Crew
  own_crew_count INTEGER DEFAULT 0,
  subcontractor_crew JSONB DEFAULT '[]'::jsonb,
  total_crew_count INTEGER DEFAULT 0,
  
  -- Work performed
  work_description TEXT,
  work_areas TEXT,
  
  -- Equipment & Materials
  equipment_used JSONB DEFAULT '[]'::jsonb,
  materials_received JSONB DEFAULT '[]'::jsonb,
  
  -- Progress
  progress_description TEXT,
  progress_percentage NUMERIC,
  on_schedule BOOLEAN DEFAULT true,
  delay_reason TEXT,
  
  -- Quality controls performed
  quality_controls JSONB DEFAULT '[]'::jsonb,
  
  -- HMS / Safety
  hms_incidents JSONB DEFAULT '[]'::jsonb,
  hms_observations TEXT,
  safety_meeting_held BOOLEAN DEFAULT false,
  
  -- Subcontractor attendance
  subcontractor_attendance JSONB DEFAULT '[]'::jsonb,
  
  -- Deviations registered today
  deviations_today JSONB DEFAULT '[]'::jsonb,
  
  -- Photos / attachments
  photos JSONB DEFAULT '[]'::jsonb,
  
  -- General notes
  notes TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-generate report number trigger
CREATE OR REPLACE FUNCTION public.set_ks_daily_report_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.report_number IS NULL OR NEW.report_number = '' THEN
    NEW.report_number := generate_ks_daily_report_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_ks_daily_report_number_trigger
  BEFORE INSERT ON public.ks_daily_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.set_ks_daily_report_number();

-- Updated_at trigger
CREATE TRIGGER update_ks_daily_reports_updated_at
  BEFORE UPDATE ON public.ks_daily_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.ks_daily_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own company daily reports"
ON public.ks_daily_reports FOR SELECT
TO authenticated
USING (
  company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can insert own daily reports"
ON public.ks_daily_reports FOR INSERT
TO authenticated
WITH CHECK (
  company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
  AND user_id = auth.uid()
);

CREATE POLICY "Users can update own daily reports"
ON public.ks_daily_reports FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR is_company_admin(auth.uid())
  OR is_system_admin(auth.uid())
);

CREATE POLICY "Admins can delete daily reports"
ON public.ks_daily_reports FOR DELETE
TO authenticated
USING (
  is_company_admin(auth.uid())
  OR is_system_admin(auth.uid())
);

-- Create storage bucket for daily report photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('daily-report-photos', 'daily-report-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Company members can upload daily report photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'daily-report-photos'
  AND (storage.foldername(name))[1] = (SELECT company_id::text FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Company members can view daily report photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'daily-report-photos'
  AND (storage.foldername(name))[1] = (SELECT company_id::text FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Company members can delete own daily report photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'daily-report-photos'
  AND (storage.foldername(name))[1] = (SELECT company_id::text FROM public.profiles WHERE user_id = auth.uid())
);
