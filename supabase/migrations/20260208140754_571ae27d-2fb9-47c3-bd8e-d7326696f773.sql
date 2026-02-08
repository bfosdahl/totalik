-- =============================================
-- IK/FDV MODULE - Database Schema
-- Forvaltning, Drift og Vedlikehold
-- =============================================

-- 1. FDV Buildings table
CREATE TABLE public.fdv_buildings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    owner_type TEXT NOT NULL DEFAULT 'eier' CHECK (owner_type IN ('eier', 'leietaker')),
    building_type TEXT NOT NULL DEFAULT 'kontor' CHECK (building_type IN ('kontor', 'butikk', 'lager', 'verksted', 'kombinasjon')),
    area_sqm INTEGER,
    floors INTEGER DEFAULT 1,
    usage_type TEXT NOT NULL DEFAULT 'ansatte' CHECK (usage_type IN ('ansatte', 'publikum', 'begge')),
    internal_contact_name TEXT,
    internal_contact_phone TEXT,
    internal_contact_email TEXT,
    external_contact_name TEXT,
    external_contact_phone TEXT,
    external_contact_email TEXT,
    image_url TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'aktiv' CHECK (status IN ('aktiv', 'inaktiv')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. FDV Building Roles table
CREATE TABLE public.fdv_building_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    building_id UUID NOT NULL REFERENCES public.fdv_buildings(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    role_type TEXT NOT NULL CHECK (role_type IN ('eier', 'bruker', 'brannvernleder', 'vaktmester', 'utleier', 'driftsansvarlig')),
    person_name TEXT,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    external_actor TEXT,
    phone TEXT,
    email TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. FDV Controls table (for maintenance and inspections)
CREATE TABLE public.fdv_controls (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    building_id UUID NOT NULL REFERENCES public.fdv_buildings(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    control_type TEXT NOT NULL CHECK (control_type IN (
        'brannalarm', 'slokkeutstyr', 'nodlys', 'el_kontroll', 
        'termografering', 'ventilasjon', 'tak_fasade', 'heis', 
        'romningsveier', 'sprinkler', 'annet'
    )),
    name TEXT NOT NULL,
    description TEXT,
    interval_months INTEGER NOT NULL DEFAULT 12,
    responsible_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    responsible_name TEXT,
    status TEXT NOT NULL DEFAULT 'planlagt' CHECK (status IN ('planlagt', 'utfort', 'forfalt', 'avvik')),
    next_due_date DATE,
    last_completed_date DATE,
    last_completed_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    last_completed_by_name TEXT,
    documentation_path TEXT,
    notes TEXT,
    reminder_enabled BOOLEAN DEFAULT true,
    reminder_days_before INTEGER DEFAULT 14,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. FDV Control Logs (history of completed controls)
CREATE TABLE public.fdv_control_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    control_id UUID NOT NULL REFERENCES public.fdv_controls(id) ON DELETE CASCADE,
    building_id UUID NOT NULL REFERENCES public.fdv_buildings(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    completed_by_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('ok', 'avvik', 'delvis_ok')),
    findings TEXT,
    documentation_path TEXT,
    next_due_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. FDV Risk Assessments table
CREATE TABLE public.fdv_risk_assessments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    building_id UUID NOT NULL REFERENCES public.fdv_buildings(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN (
        'brann', 'elektrisk', 'inneklima', 'fall_skli', 
        'teknisk_svikt', 'fuktskader', 'sikkerhet', 'annet'
    )),
    hazard_description TEXT NOT NULL,
    existing_measures TEXT,
    probability INTEGER NOT NULL CHECK (probability >= 1 AND probability <= 5),
    consequence INTEGER NOT NULL CHECK (consequence >= 1 AND consequence <= 5),
    risk_score INTEGER GENERATED ALWAYS AS (probability * consequence) STORED,
    status TEXT NOT NULL DEFAULT 'aktiv' CHECK (status IN ('aktiv', 'under_behandling', 'lukket')),
    actions JSONB DEFAULT '[]'::jsonb,
    responsible_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    responsible_name TEXT,
    revision_date DATE,
    assessed_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assessed_by_name TEXT,
    assessed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. FDV Documents table
CREATE TABLE public.fdv_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    building_id UUID REFERENCES public.fdv_buildings(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN (
        'tegninger', 'samsvarserklaeringer', 'kontrollrapporter', 
        'serviceavtaler', 'branninstrukser', 'vedlikeholdsplaner',
        'leiekontrakt', 'ansvarsavtale', 'annet'
    )),
    document_name TEXT NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    file_type TEXT,
    version TEXT DEFAULT '1.0',
    valid_from DATE,
    valid_to DATE,
    uploaded_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    uploaded_by_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Add fdv_building_id to deviations for integration
ALTER TABLE public.deviations 
ADD COLUMN IF NOT EXISTS fdv_building_id UUID REFERENCES public.fdv_buildings(id) ON DELETE SET NULL;

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_fdv_buildings_company_id ON public.fdv_buildings(company_id);
CREATE INDEX idx_fdv_buildings_status ON public.fdv_buildings(status);
CREATE INDEX idx_fdv_building_roles_building_id ON public.fdv_building_roles(building_id);
CREATE INDEX idx_fdv_building_roles_company_id ON public.fdv_building_roles(company_id);
CREATE INDEX idx_fdv_controls_building_id ON public.fdv_controls(building_id);
CREATE INDEX idx_fdv_controls_company_id ON public.fdv_controls(company_id);
CREATE INDEX idx_fdv_controls_next_due_date ON public.fdv_controls(next_due_date);
CREATE INDEX idx_fdv_controls_status ON public.fdv_controls(status);
CREATE INDEX idx_fdv_control_logs_control_id ON public.fdv_control_logs(control_id);
CREATE INDEX idx_fdv_control_logs_company_id ON public.fdv_control_logs(company_id);
CREATE INDEX idx_fdv_risk_assessments_building_id ON public.fdv_risk_assessments(building_id);
CREATE INDEX idx_fdv_risk_assessments_company_id ON public.fdv_risk_assessments(company_id);
CREATE INDEX idx_fdv_risk_assessments_category ON public.fdv_risk_assessments(category);
CREATE INDEX idx_fdv_documents_building_id ON public.fdv_documents(building_id);
CREATE INDEX idx_fdv_documents_company_id ON public.fdv_documents(company_id);
CREATE INDEX idx_fdv_documents_category ON public.fdv_documents(category);
CREATE INDEX idx_deviations_fdv_building_id ON public.deviations(fdv_building_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.fdv_buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fdv_building_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fdv_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fdv_control_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fdv_risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fdv_documents ENABLE ROW LEVEL SECURITY;

-- Helper function for checking user access
CREATE OR REPLACE FUNCTION public.user_has_fdv_access(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = _user_id 
    AND p.company_id = _company_id
  )
$$;

CREATE OR REPLACE FUNCTION public.user_can_manage_fdv(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = _user_id 
    AND p.company_id = _company_id
    AND p.is_hms_responsible = true
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
    AND ur.role IN ('system_admin', 'company_admin')
  )
$$;

-- FDV Buildings policies
CREATE POLICY "fdv_buildings_select"
ON public.fdv_buildings FOR SELECT
USING (public.user_has_fdv_access(auth.uid(), company_id));

CREATE POLICY "fdv_buildings_insert"
ON public.fdv_buildings FOR INSERT
WITH CHECK (public.user_can_manage_fdv(auth.uid(), company_id));

CREATE POLICY "fdv_buildings_update"
ON public.fdv_buildings FOR UPDATE
USING (public.user_can_manage_fdv(auth.uid(), company_id));

CREATE POLICY "fdv_buildings_delete"
ON public.fdv_buildings FOR DELETE
USING (public.user_can_manage_fdv(auth.uid(), company_id));

-- FDV Building Roles policies
CREATE POLICY "fdv_roles_select"
ON public.fdv_building_roles FOR SELECT
USING (public.user_has_fdv_access(auth.uid(), company_id));

CREATE POLICY "fdv_roles_insert"
ON public.fdv_building_roles FOR INSERT
WITH CHECK (public.user_can_manage_fdv(auth.uid(), company_id));

CREATE POLICY "fdv_roles_update"
ON public.fdv_building_roles FOR UPDATE
USING (public.user_can_manage_fdv(auth.uid(), company_id));

CREATE POLICY "fdv_roles_delete"
ON public.fdv_building_roles FOR DELETE
USING (public.user_can_manage_fdv(auth.uid(), company_id));

-- FDV Controls policies
CREATE POLICY "fdv_controls_select"
ON public.fdv_controls FOR SELECT
USING (public.user_has_fdv_access(auth.uid(), company_id));

CREATE POLICY "fdv_controls_insert"
ON public.fdv_controls FOR INSERT
WITH CHECK (public.user_can_manage_fdv(auth.uid(), company_id));

CREATE POLICY "fdv_controls_update"
ON public.fdv_controls FOR UPDATE
USING (public.user_can_manage_fdv(auth.uid(), company_id));

CREATE POLICY "fdv_controls_delete"
ON public.fdv_controls FOR DELETE
USING (public.user_can_manage_fdv(auth.uid(), company_id));

-- FDV Control Logs policies
CREATE POLICY "fdv_control_logs_select"
ON public.fdv_control_logs FOR SELECT
USING (public.user_has_fdv_access(auth.uid(), company_id));

CREATE POLICY "fdv_control_logs_insert"
ON public.fdv_control_logs FOR INSERT
WITH CHECK (public.user_can_manage_fdv(auth.uid(), company_id));

CREATE POLICY "fdv_control_logs_update"
ON public.fdv_control_logs FOR UPDATE
USING (public.user_can_manage_fdv(auth.uid(), company_id));

CREATE POLICY "fdv_control_logs_delete"
ON public.fdv_control_logs FOR DELETE
USING (public.user_can_manage_fdv(auth.uid(), company_id));

-- FDV Risk Assessments policies
CREATE POLICY "fdv_risk_select"
ON public.fdv_risk_assessments FOR SELECT
USING (public.user_has_fdv_access(auth.uid(), company_id));

CREATE POLICY "fdv_risk_insert"
ON public.fdv_risk_assessments FOR INSERT
WITH CHECK (public.user_can_manage_fdv(auth.uid(), company_id));

CREATE POLICY "fdv_risk_update"
ON public.fdv_risk_assessments FOR UPDATE
USING (public.user_can_manage_fdv(auth.uid(), company_id));

CREATE POLICY "fdv_risk_delete"
ON public.fdv_risk_assessments FOR DELETE
USING (public.user_can_manage_fdv(auth.uid(), company_id));

-- FDV Documents policies
CREATE POLICY "fdv_docs_select"
ON public.fdv_documents FOR SELECT
USING (public.user_has_fdv_access(auth.uid(), company_id));

CREATE POLICY "fdv_docs_insert"
ON public.fdv_documents FOR INSERT
WITH CHECK (public.user_can_manage_fdv(auth.uid(), company_id));

CREATE POLICY "fdv_docs_update"
ON public.fdv_documents FOR UPDATE
USING (public.user_can_manage_fdv(auth.uid(), company_id));

CREATE POLICY "fdv_docs_delete"
ON public.fdv_documents FOR DELETE
USING (public.user_can_manage_fdv(auth.uid(), company_id));

-- =============================================
-- TRIGGERS FOR updated_at
-- =============================================

CREATE TRIGGER update_fdv_buildings_updated_at
BEFORE UPDATE ON public.fdv_buildings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fdv_building_roles_updated_at
BEFORE UPDATE ON public.fdv_building_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fdv_controls_updated_at
BEFORE UPDATE ON public.fdv_controls
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fdv_risk_assessments_updated_at
BEFORE UPDATE ON public.fdv_risk_assessments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fdv_documents_updated_at
BEFORE UPDATE ON public.fdv_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- STORAGE BUCKET FOR FDV DOCUMENTS
-- =============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('fdv-documents', 'fdv-documents', false, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for fdv-documents bucket
CREATE POLICY "fdv_storage_select"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'fdv-documents' 
    AND (storage.foldername(name))[1] IN (
        SELECT company_id::text FROM public.profiles WHERE user_id = auth.uid()
    )
);

CREATE POLICY "fdv_storage_insert"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'fdv-documents'
    AND (storage.foldername(name))[1] IN (
        SELECT company_id::text FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND is_hms_responsible = true
    )
);

CREATE POLICY "fdv_storage_update"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'fdv-documents'
    AND (storage.foldername(name))[1] IN (
        SELECT company_id::text FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND is_hms_responsible = true
    )
);

CREATE POLICY "fdv_storage_delete"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'fdv-documents'
    AND (storage.foldername(name))[1] IN (
        SELECT company_id::text FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND is_hms_responsible = true
    )
);

CREATE POLICY "fdv_storage_sysadmin"
ON storage.objects FOR ALL
USING (
    bucket_id = 'fdv-documents'
    AND EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'system_admin'
    )
);