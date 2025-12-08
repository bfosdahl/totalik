-- Create is_hms_responsible function
CREATE OR REPLACE FUNCTION public.is_hms_responsible(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = $1 AND p.is_hms_responsible = true
  );
$$;

-- Create module orders table for tracking orders
CREATE TABLE public.module_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  module_type TEXT NOT NULL,
  ordered_by_id UUID REFERENCES auth.users(id),
  ordered_by_name TEXT NOT NULL,
  ordered_by_email TEXT NOT NULL,
  price_monthly NUMERIC(10,2) NOT NULL,
  terms_accepted BOOLEAN NOT NULL DEFAULT true,
  terms_accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.module_orders ENABLE ROW LEVEL SECURITY;

-- Create policies for module_orders
CREATE POLICY "Users can view their company orders"
ON public.module_orders
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins and HMS responsible can create orders"
ON public.module_orders
FOR INSERT
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND (is_company_admin(auth.uid()) OR is_hms_responsible(auth.uid()))
);

-- Add module pricing table
CREATE TABLE public.module_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_type TEXT NOT NULL UNIQUE,
  module_name TEXT NOT NULL,
  description TEXT,
  price_monthly NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for pricing (public read)
ALTER TABLE public.module_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active pricing"
ON public.module_pricing
FOR SELECT
USING (is_active = true);

-- Insert default pricing for modules
INSERT INTO public.module_pricing (module_type, module_name, description, price_monthly) VALUES
('IK_HMS', 'IK/HMS', 'Internkontroll for helse, miljø og sikkerhet', 499),
('IK_MAT', 'IK/MAT', 'Internkontroll for mattrygghet og HACCP', 399),
('IK_ALKOHOL', 'IK/Alkohol', 'Internkontroll for alkoholomsetning', 299),
('IK_BYGG', 'KS Bygg', 'Kvalitetssikring for byggebransjen', 799),
('PERSONALHANDBOK', 'Personalhåndbok', 'Digital personalhåndbok', 299),
('GDPR', 'GDPR', 'Personvern og GDPR-dokumentasjon', 299),
('APENHETSLOVEN', 'Åpenhetsloven', 'Åpenhetsloven dokumentasjon', 299)
ON CONFLICT (module_type) DO NOTHING;