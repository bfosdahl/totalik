
-- Table to store alcohol-related laws, regulations, and municipal guidelines per company
CREATE TABLE public.ik_alkohol_lovverk (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'nasjonal', -- 'nasjonal', 'kommunal', 'veileder'
  title TEXT NOT NULL,
  description TEXT,
  url TEXT, -- Link to Lovdata, municipality site, etc.
  source TEXT, -- e.g. 'Lovdata', 'Lillestrøm kommune', 'Helsedirektoratet'
  municipality TEXT, -- Only for kommunal category
  is_default BOOLEAN DEFAULT false, -- Pre-populated national laws
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ik_alkohol_lovverk ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their company lovverk"
ON public.ik_alkohol_lovverk FOR SELECT
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert lovverk for their company"
ON public.ik_alkohol_lovverk FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their company lovverk"
ON public.ik_alkohol_lovverk FOR UPDATE
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their company lovverk"
ON public.ik_alkohol_lovverk FOR DELETE
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_ik_alkohol_lovverk_updated_at
BEFORE UPDATE ON public.ik_alkohol_lovverk
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Table to track IK Alkohol compliance requirements and their documentation status
CREATE TABLE public.ik_alkohol_compliance_checklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  requirement_key TEXT NOT NULL, -- Unique identifier for the requirement
  requirement_text TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'dokumentasjon', -- 'lovverk', 'dokumentasjon', 'opplaering', 'rutiner', 'kontroll'
  is_fulfilled BOOLEAN DEFAULT false,
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  fulfilled_by_id UUID REFERENCES public.profiles(id),
  fulfilled_by_name TEXT,
  evidence_description TEXT, -- Description of how it's documented
  evidence_link TEXT, -- Link to where in the system it's documented (route)
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, requirement_key)
);

-- Enable RLS
ALTER TABLE public.ik_alkohol_compliance_checklist ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their company compliance"
ON public.ik_alkohol_compliance_checklist FOR SELECT
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert compliance for their company"
ON public.ik_alkohol_compliance_checklist FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their company compliance"
ON public.ik_alkohol_compliance_checklist FOR UPDATE
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their company compliance"
ON public.ik_alkohol_compliance_checklist FOR DELETE
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_ik_alkohol_compliance_checklist_updated_at
BEFORE UPDATE ON public.ik_alkohol_compliance_checklist
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
