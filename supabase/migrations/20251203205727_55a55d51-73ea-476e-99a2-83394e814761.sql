-- Create ks_module2_subcontractors table for UE registration
CREATE TABLE public.ks_module2_subcontractors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.ks_module2_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  firm_name TEXT NOT NULL,
  org_number TEXT,
  contact_person TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  work_scope TEXT NOT NULL,
  trade TEXT,
  contract_value NUMERIC,
  start_date DATE,
  end_date DATE,
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'approved_with_remarks', 'rejected')),
  approval_notes TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ks_module2_subcontractor_documents table
CREATE TABLE public.ks_module2_subcontractor_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subcontractor_id UUID NOT NULL REFERENCES public.ks_module2_subcontractors(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('contract', 'insurance', 'certification', 'competence', 'hms_card', 'other')),
  document_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  expiry_date DATE,
  uploaded_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ks_module2_subcontractor_evaluations table (seriøsitetskontroll)
CREATE TABLE public.ks_module2_subcontractor_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subcontractor_id UUID NOT NULL REFERENCES public.ks_module2_subcontractors(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  -- Checkpoint results (null = not evaluated, true = OK, false = not OK)
  has_valid_org_number BOOLEAN,
  has_tax_certificate BOOLEAN,
  has_liability_insurance BOOLEAN,
  has_valid_hms_card BOOLEAN,
  has_required_certifications BOOLEAN,
  has_signed_contract BOOLEAN,
  has_competence_documentation BOOLEAN,
  has_references BOOLEAN,
  has_quality_system BOOLEAN,
  has_environmental_plan BOOLEAN,
  -- Comments per checkpoint
  org_number_comment TEXT,
  tax_certificate_comment TEXT,
  liability_insurance_comment TEXT,
  hms_card_comment TEXT,
  certifications_comment TEXT,
  contract_comment TEXT,
  competence_comment TEXT,
  references_comment TEXT,
  quality_system_comment TEXT,
  environmental_plan_comment TEXT,
  -- Overall evaluation
  overall_conclusion TEXT CHECK (overall_conclusion IN ('approved', 'approved_with_remarks', 'rejected')),
  conclusion_notes TEXT,
  evaluated_by TEXT NOT NULL,
  evaluated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ks_module2_subcontractor_inspections table (kontroller av UE-arbeid)
CREATE TABLE public.ks_module2_subcontractor_inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subcontractor_id UUID NOT NULL REFERENCES public.ks_module2_subcontractors(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.ks_module2_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  inspection_date DATE NOT NULL,
  inspector_name TEXT NOT NULL,
  work_area TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'approved_with_remarks', 'rejected')),
  findings TEXT,
  corrective_actions TEXT,
  photo_paths TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ks_module2_subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ks_module2_subcontractor_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ks_module2_subcontractor_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ks_module2_subcontractor_inspections ENABLE ROW LEVEL SECURITY;

-- RLS policies for ks_module2_subcontractors
CREATE POLICY "Users can view their company subcontractors"
  ON public.ks_module2_subcontractors FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create subcontractors"
  ON public.ks_module2_subcontractors FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update their company subcontractors"
  ON public.ks_module2_subcontractors FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete their company subcontractors"
  ON public.ks_module2_subcontractors FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()));

-- RLS policies for ks_module2_subcontractor_documents
CREATE POLICY "Users can view their company subcontractor documents"
  ON public.ks_module2_subcontractor_documents FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create subcontractor documents"
  ON public.ks_module2_subcontractor_documents FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete their company subcontractor documents"
  ON public.ks_module2_subcontractor_documents FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()));

-- RLS policies for ks_module2_subcontractor_evaluations
CREATE POLICY "Users can view their company evaluations"
  ON public.ks_module2_subcontractor_evaluations FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create evaluations"
  ON public.ks_module2_subcontractor_evaluations FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update their company evaluations"
  ON public.ks_module2_subcontractor_evaluations FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

-- RLS policies for ks_module2_subcontractor_inspections
CREATE POLICY "Users can view their company inspections"
  ON public.ks_module2_subcontractor_inspections FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create inspections"
  ON public.ks_module2_subcontractor_inspections FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update their company inspections"
  ON public.ks_module2_subcontractor_inspections FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

-- Add updated_at triggers
CREATE TRIGGER update_ks_module2_subcontractors_updated_at
  BEFORE UPDATE ON public.ks_module2_subcontractors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ks_module2_subcontractor_evaluations_updated_at
  BEFORE UPDATE ON public.ks_module2_subcontractor_evaluations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ks_module2_subcontractor_inspections_updated_at
  BEFORE UPDATE ON public.ks_module2_subcontractor_inspections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();