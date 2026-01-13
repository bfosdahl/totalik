-- IK Alkohol Module Tables

-- 1. Bevillinger (Licenses)
CREATE TABLE public.ik_alkohol_licenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  license_type TEXT NOT NULL DEFAULT 'Skjenkested',
  municipality TEXT NOT NULL,
  license_number TEXT,
  valid_from DATE,
  valid_to DATE,
  concept_category TEXT,
  manager_name TEXT,
  manager_phone TEXT,
  manager_email TEXT,
  deputy_name TEXT,
  deputy_phone TEXT,
  deputy_email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Regelpunkter (Compliance Items)
CREATE TABLE public.ik_alkohol_compliance_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  rule_reference TEXT NOT NULL,
  violation_description TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 1,
  recommended_focus TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  is_template BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Risiko/Tiltak (Risk Controls)
CREATE TABLE public.ik_alkohol_risk_controls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  license_id UUID REFERENCES public.ik_alkohol_licenses(id) ON DELETE CASCADE,
  compliance_item_id UUID REFERENCES public.ik_alkohol_compliance_items(id) ON DELETE SET NULL,
  challenges TEXT,
  preventive_measures TEXT,
  responsible_role TEXT,
  deadline_period TEXT,
  status TEXT DEFAULT 'Utkast',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Historikk for risiko/tiltak
CREATE TABLE public.ik_alkohol_risk_control_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  risk_control_id UUID NOT NULL REFERENCES public.ik_alkohol_risk_controls(id) ON DELETE CASCADE,
  changed_by_id UUID REFERENCES public.profiles(id),
  changed_by_name TEXT,
  change_type TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Opplæring (Training) - uten employee_id referanse
CREATE TABLE public.ik_alkohol_training (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  role TEXT NOT NULL,
  training_type TEXT NOT NULL,
  required_by TEXT,
  completed_date DATE,
  expires_date DATE,
  documentation_path TEXT,
  notes TEXT,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Hendelseslogg (Incidents)
CREATE TABLE public.ik_alkohol_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  license_id UUID REFERENCES public.ik_alkohol_licenses(id) ON DELETE SET NULL,
  compliance_item_id UUID REFERENCES public.ik_alkohol_compliance_items(id) ON DELETE SET NULL,
  incident_number TEXT NOT NULL,
  incident_date DATE NOT NULL,
  incident_time TIME,
  incident_type TEXT NOT NULL,
  description TEXT NOT NULL,
  handling TEXT,
  involved_parties TEXT,
  learning_improvement TEXT,
  reported_by_id UUID REFERENCES public.profiles(id),
  reported_by_name TEXT,
  status TEXT DEFAULT 'Ny',
  severity TEXT DEFAULT 'Lav',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Revisjoner (Reviews)
CREATE TABLE public.ik_alkohol_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  license_id UUID REFERENCES public.ik_alkohol_licenses(id) ON DELETE SET NULL,
  review_type TEXT NOT NULL,
  planned_date DATE NOT NULL,
  completed_date DATE,
  agenda_points JSONB DEFAULT '[]',
  tasks JSONB DEFAULT '[]',
  summary TEXT,
  participants TEXT,
  status TEXT DEFAULT 'Planlagt',
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Vedlegg (Attachments)
CREATE TABLE public.ik_alkohol_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  document_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by_id UUID REFERENCES public.profiles(id),
  uploaded_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.ik_alkohol_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ik_alkohol_compliance_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ik_alkohol_risk_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ik_alkohol_risk_control_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ik_alkohol_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ik_alkohol_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ik_alkohol_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ik_alkohol_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ik_alkohol_licenses
CREATE POLICY "Users can view licenses from their company" ON public.ik_alkohol_licenses
FOR SELECT USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert licenses for their company" ON public.ik_alkohol_licenses
FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update licenses from their company" ON public.ik_alkohol_licenses
FOR UPDATE USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete licenses from their company" ON public.ik_alkohol_licenses
FOR DELETE USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for ik_alkohol_compliance_items
CREATE POLICY "Users can view compliance items from their company" ON public.ik_alkohol_compliance_items
FOR SELECT USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert compliance items for their company" ON public.ik_alkohol_compliance_items
FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update compliance items from their company" ON public.ik_alkohol_compliance_items
FOR UPDATE USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete compliance items from their company" ON public.ik_alkohol_compliance_items
FOR DELETE USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for ik_alkohol_risk_controls
CREATE POLICY "Users can view risk controls from their company" ON public.ik_alkohol_risk_controls
FOR SELECT USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert risk controls for their company" ON public.ik_alkohol_risk_controls
FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update risk controls from their company" ON public.ik_alkohol_risk_controls
FOR UPDATE USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete risk controls from their company" ON public.ik_alkohol_risk_controls
FOR DELETE USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for ik_alkohol_risk_control_history
CREATE POLICY "Users can view history from their company" ON public.ik_alkohol_risk_control_history
FOR SELECT USING (risk_control_id IN (
  SELECT id FROM public.ik_alkohol_risk_controls WHERE company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
));

CREATE POLICY "Users can insert history for their company" ON public.ik_alkohol_risk_control_history
FOR INSERT WITH CHECK (risk_control_id IN (
  SELECT id FROM public.ik_alkohol_risk_controls WHERE company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
));

-- RLS Policies for ik_alkohol_training
CREATE POLICY "Users can view training from their company" ON public.ik_alkohol_training
FOR SELECT USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert training for their company" ON public.ik_alkohol_training
FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update training from their company" ON public.ik_alkohol_training
FOR UPDATE USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete training from their company" ON public.ik_alkohol_training
FOR DELETE USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for ik_alkohol_incidents
CREATE POLICY "Users can view incidents from their company" ON public.ik_alkohol_incidents
FOR SELECT USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert incidents for their company" ON public.ik_alkohol_incidents
FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update incidents from their company" ON public.ik_alkohol_incidents
FOR UPDATE USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete incidents from their company" ON public.ik_alkohol_incidents
FOR DELETE USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for ik_alkohol_reviews
CREATE POLICY "Users can view reviews from their company" ON public.ik_alkohol_reviews
FOR SELECT USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert reviews for their company" ON public.ik_alkohol_reviews
FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update reviews from their company" ON public.ik_alkohol_reviews
FOR UPDATE USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete reviews from their company" ON public.ik_alkohol_reviews
FOR DELETE USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for ik_alkohol_attachments
CREATE POLICY "Users can view attachments from their company" ON public.ik_alkohol_attachments
FOR SELECT USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert attachments for their company" ON public.ik_alkohol_attachments
FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete attachments from their company" ON public.ik_alkohol_attachments
FOR DELETE USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_ik_alkohol_licenses_updated_at
  BEFORE UPDATE ON public.ik_alkohol_licenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ik_alkohol_compliance_items_updated_at
  BEFORE UPDATE ON public.ik_alkohol_compliance_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ik_alkohol_risk_controls_updated_at
  BEFORE UPDATE ON public.ik_alkohol_risk_controls
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ik_alkohol_training_updated_at
  BEFORE UPDATE ON public.ik_alkohol_training
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ik_alkohol_incidents_updated_at
  BEFORE UPDATE ON public.ik_alkohol_incidents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ik_alkohol_reviews_updated_at
  BEFORE UPDATE ON public.ik_alkohol_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_ik_alkohol_licenses_company ON public.ik_alkohol_licenses(company_id);
CREATE INDEX idx_ik_alkohol_compliance_items_company ON public.ik_alkohol_compliance_items(company_id);
CREATE INDEX idx_ik_alkohol_risk_controls_company ON public.ik_alkohol_risk_controls(company_id);
CREATE INDEX idx_ik_alkohol_training_company ON public.ik_alkohol_training(company_id);
CREATE INDEX idx_ik_alkohol_incidents_company ON public.ik_alkohol_incidents(company_id);
CREATE INDEX idx_ik_alkohol_reviews_company ON public.ik_alkohol_reviews(company_id);
CREATE INDEX idx_ik_alkohol_attachments_company ON public.ik_alkohol_attachments(company_id);