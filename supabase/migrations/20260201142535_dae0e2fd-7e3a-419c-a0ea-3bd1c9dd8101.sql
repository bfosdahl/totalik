-- Create chemical risk assessments table for storing risk assessments per chemical entry
CREATE TABLE public.chemical_risk_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  company_chemical_entry_id UUID NOT NULL REFERENCES public.company_chemical_entries(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.ks_module2_projects(id) ON DELETE SET NULL,
  
  -- Phase tracking (1 = initial, 2 = simplified, 3 = detailed)
  current_phase INTEGER NOT NULL DEFAULT 1 CHECK (current_phase >= 1 AND current_phase <= 3),
  phase_1_completed BOOLEAN NOT NULL DEFAULT false,
  phase_2_completed BOOLEAN NOT NULL DEFAULT false,
  phase_3_completed BOOLEAN NOT NULL DEFAULT false,
  
  -- Phase 1: Initial assessment (Innledende vurdering)
  -- Hazard identification from SDS
  hazard_identification JSONB DEFAULT '{}',
  -- Exposure assessment: type, level, duration
  exposure_type TEXT, -- 'innånding', 'hudkontakt', 'svelging', 'øyekontakt'
  exposure_level TEXT, -- 'lav', 'middels', 'høy'
  exposure_duration TEXT, -- 'kort', 'periodisk', 'langvarig'
  exposed_workers_count INTEGER,
  -- Risk evaluation
  hazard_severity INTEGER CHECK (hazard_severity >= 1 AND hazard_severity <= 5),
  exposure_probability INTEGER CHECK (exposure_probability >= 1 AND exposure_probability <= 5),
  risk_level TEXT, -- 'akseptabel', 'bør_vurderes', 'tiltak_påkrevd'
  -- Work tasks where chemical is used
  work_tasks JSONB DEFAULT '[]',
  -- Existing protective measures
  existing_measures JSONB DEFAULT '[]',
  -- Assessment conclusion
  phase_1_conclusion TEXT,
  phase_1_needs_further_assessment BOOLEAN DEFAULT false,
  phase_1_assessed_at TIMESTAMPTZ,
  phase_1_assessed_by_id UUID REFERENCES public.profiles(id),
  phase_1_assessed_by_name TEXT,
  
  -- Phase 2: Simplified investigation (Forenklet undersøkelse)
  -- 3-5 measurements per comparable exposed group
  phase_2_measurements JSONB DEFAULT '[]',
  phase_2_measurement_method TEXT,
  phase_2_conclusion TEXT,
  phase_2_needs_detailed_assessment BOOLEAN DEFAULT false,
  phase_2_assessed_at TIMESTAMPTZ,
  phase_2_assessed_by_id UUID REFERENCES public.profiles(id),
  phase_2_assessed_by_name TEXT,
  
  -- Phase 3: Detailed investigation (Detaljert undersøkelse)
  -- Minimum 6 measurements with statistical evaluation
  phase_3_measurements JSONB DEFAULT '[]',
  phase_3_statistical_analysis JSONB DEFAULT '{}',
  phase_3_conclusion TEXT,
  phase_3_assessed_at TIMESTAMPTZ,
  phase_3_assessed_by_id UUID REFERENCES public.profiles(id),
  phase_3_assessed_by_name TEXT,
  
  -- Planned/implemented measures (tiltak)
  planned_measures JSONB DEFAULT '[]',
  implemented_measures JSONB DEFAULT '[]',
  
  -- Required protective equipment
  required_ppe JSONB DEFAULT '[]',
  
  -- Health monitoring requirements
  health_monitoring_required BOOLEAN DEFAULT false,
  health_monitoring_details TEXT,
  
  -- Overall status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'needs_review')),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Unique constraint: one assessment per chemical entry
  UNIQUE (company_chemical_entry_id)
);

-- Create indexes for performance
CREATE INDEX idx_chemical_risk_assessments_company ON public.chemical_risk_assessments(company_id);
CREATE INDEX idx_chemical_risk_assessments_entry ON public.chemical_risk_assessments(company_chemical_entry_id);
CREATE INDEX idx_chemical_risk_assessments_project ON public.chemical_risk_assessments(project_id);
CREATE INDEX idx_chemical_risk_assessments_status ON public.chemical_risk_assessments(status);

-- Enable RLS
ALTER TABLE public.chemical_risk_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view chemical risk assessments for their company"
ON public.chemical_risk_assessments
FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can create chemical risk assessments for their company"
ON public.chemical_risk_assessments
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update chemical risk assessments for their company"
ON public.chemical_risk_assessments
FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete chemical risk assessments for their company"
ON public.chemical_risk_assessments
FOR DELETE
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_chemical_risk_assessments_updated_at
BEFORE UPDATE ON public.chemical_risk_assessments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();