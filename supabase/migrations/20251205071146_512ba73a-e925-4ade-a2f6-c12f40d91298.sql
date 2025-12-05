-- Create SHA plans table for KS Module 2
CREATE TABLE public.ks_module2_sha_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.ks_module2_projects(id) ON DELETE CASCADE,
  
  -- Plan type: 'internal' (created in system) or 'external' (uploaded)
  plan_type TEXT NOT NULL DEFAULT 'internal' CHECK (plan_type IN ('internal', 'external')),
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_signatures', 'signed', 'approved')),
  
  -- For external uploads
  external_file_path TEXT,
  external_file_name TEXT,
  uploaded_by_name TEXT,
  uploaded_at TIMESTAMPTZ,
  
  -- For internal SHA-plan
  template_id TEXT,
  
  -- Auto-filled from project info
  project_name TEXT,
  project_address TEXT,
  client_name TEXT,
  client_org_number TEXT,
  client_contact_person TEXT,
  sha_coordinator_kp TEXT,
  sha_coordinator_ku TEXT,
  contractor_type TEXT,
  planned_start_date DATE,
  planned_end_date DATE,
  
  -- Byggherreforskriften §8 risk areas (17 points with checkbox + measures)
  risk_areas JSONB DEFAULT '[]'::jsonb,
  
  -- Organization chart data
  organization_data JSONB DEFAULT '{}'::jsonb,
  
  -- Change routine text
  change_routine_text TEXT,
  
  -- Signatures
  client_signature TEXT,
  client_signed_at TIMESTAMPTZ,
  client_signed_by TEXT,
  kp_signature TEXT,
  kp_signed_at TIMESTAMPTZ,
  kp_signed_by TEXT,
  ku_signature TEXT,
  ku_signed_at TIMESTAMPTZ,
  ku_signed_by TEXT,
  
  -- Version control
  version_number INTEGER DEFAULT 1,
  is_current_version BOOLEAN DEFAULT true,
  previous_version_id UUID REFERENCES public.ks_module2_sha_plans(id),
  
  -- Entrepreneur acknowledgment (for external plans)
  entrepreneur_approved BOOLEAN DEFAULT false,
  entrepreneur_approved_at TIMESTAMPTZ,
  entrepreneur_approved_by TEXT,
  
  -- Generated PDF
  signed_pdf_path TEXT,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create SHA tilpasning (adaptation) table
CREATE TABLE public.ks_module2_sha_tilpasning (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.ks_module2_projects(id) ON DELETE CASCADE,
  sha_plan_id UUID REFERENCES public.ks_module2_sha_plans(id) ON DELETE CASCADE,
  
  -- How we implement the client's requirements
  implementation_description TEXT,
  
  -- Additional measures from us
  additional_measures JSONB DEFAULT '[]'::jsonb,
  
  -- Links to our SJA, vernerunder, avvik
  linked_sja_ids UUID[] DEFAULT '{}',
  linked_vernerunde_ids UUID[] DEFAULT '{}',
  linked_avvik_ids UUID[] DEFAULT '{}',
  
  -- Project leader signature
  project_leader_signature TEXT,
  project_leader_signed_at TIMESTAMPTZ,
  project_leader_signed_by TEXT,
  
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'signed')),
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ks_module2_sha_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ks_module2_sha_tilpasning ENABLE ROW LEVEL SECURITY;

-- RLS policies for sha_plans
CREATE POLICY "Users can view SHA plans in their company"
  ON public.ks_module2_sha_plans
  FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create SHA plans in their company"
  ON public.ks_module2_sha_plans
  FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update SHA plans in their company"
  ON public.ks_module2_sha_plans
  FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can delete SHA plans"
  ON public.ks_module2_sha_plans
  FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));

-- RLS policies for sha_tilpasning
CREATE POLICY "Users can view SHA tilpasning in their company"
  ON public.ks_module2_sha_tilpasning
  FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create SHA tilpasning in their company"
  ON public.ks_module2_sha_tilpasning
  FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update SHA tilpasning in their company"
  ON public.ks_module2_sha_tilpasning
  FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can delete SHA tilpasning"
  ON public.ks_module2_sha_tilpasning
  FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));

-- Create updated_at triggers
CREATE TRIGGER update_ks_module2_sha_plans_updated_at
  BEFORE UPDATE ON public.ks_module2_sha_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ks_module2_sha_tilpasning_updated_at
  BEFORE UPDATE ON public.ks_module2_sha_tilpasning
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for SHA documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('sha-documents', 'sha-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can view SHA documents in their company"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'sha-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can upload SHA documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'sha-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete SHA documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'sha-documents' AND auth.uid() IS NOT NULL);