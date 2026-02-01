-- Create ergonomic risk assessments table
CREATE TABLE public.ergonomic_risk_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.company_departments(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.ks_module2_projects(id) ON DELETE SET NULL,
  
  -- Assessment metadata
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('muskel_skjelett', 'vibrasjon', 'stoy')),
  title TEXT NOT NULL,
  description TEXT,
  work_area TEXT,
  job_role TEXT,
  
  -- Risk factors based on Arbeidstilsynet guidelines
  risk_factors JSONB DEFAULT '[]'::jsonb,
  -- Example: [{"factor": "Tunge løft", "frequency": "daglig", "duration": "2-4 timer", "intensity": "høy"}]
  
  -- Exposure details
  exposed_workers_count INTEGER,
  exposure_frequency TEXT, -- daglig, ukentlig, månedlig, sjelden
  exposure_duration TEXT, -- <1 time, 1-2 timer, 2-4 timer, >4 timer
  
  -- For vibration assessments
  vibration_type TEXT, -- hand_arm, whole_body
  vibration_level DECIMAL,
  vibration_exposure_time INTEGER, -- minutes per day
  vibration_equipment JSONB DEFAULT '[]'::jsonb,
  
  -- For noise assessments
  noise_level DECIMAL, -- dB
  noise_peak_level DECIMAL, -- dB
  noise_exposure_time INTEGER, -- minutes per day
  noise_sources JSONB DEFAULT '[]'::jsonb,
  
  -- Risk calculation
  consequence_severity INTEGER CHECK (consequence_severity BETWEEN 1 AND 5),
  probability INTEGER CHECK (probability BETWEEN 1 AND 5),
  risk_score INTEGER GENERATED ALWAYS AS (consequence_severity * probability) STORED,
  risk_level TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN consequence_severity * probability <= 4 THEN 'lav'
      WHEN consequence_severity * probability <= 10 THEN 'middels'
      ELSE 'hoy'
    END
  ) STORED,
  
  -- Existing protective measures
  existing_measures JSONB DEFAULT '[]'::jsonb,
  -- Required personal protective equipment
  required_ppe JSONB DEFAULT '[]'::jsonb,
  
  -- Planned actions/improvements
  planned_measures JSONB DEFAULT '[]'::jsonb,
  implemented_measures JSONB DEFAULT '[]'::jsonb,
  
  -- Health monitoring
  health_monitoring_required BOOLEAN DEFAULT false,
  health_monitoring_details TEXT,
  
  -- Assessment details
  assessed_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assessed_by_name TEXT,
  assessed_at TIMESTAMP WITH TIME ZONE,
  
  -- Conclusion
  conclusion TEXT,
  recommendations TEXT,
  follow_up_date DATE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'needs_review')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ergonomic_risk_assessments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view ergonomic assessments in their company"
  ON public.ergonomic_risk_assessments
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create ergonomic assessments in their company"
  ON public.ergonomic_risk_assessments
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update ergonomic assessments in their company"
  ON public.ergonomic_risk_assessments
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete ergonomic assessments in their company"
  ON public.ergonomic_risk_assessments
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_ergonomic_risk_assessments_updated_at
  BEFORE UPDATE ON public.ergonomic_risk_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster queries
CREATE INDEX idx_ergonomic_risk_assessments_company_id ON public.ergonomic_risk_assessments(company_id);
CREATE INDEX idx_ergonomic_risk_assessments_type ON public.ergonomic_risk_assessments(assessment_type);
CREATE INDEX idx_ergonomic_risk_assessments_status ON public.ergonomic_risk_assessments(status);