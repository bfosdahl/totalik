
-- Admin Routine Templates v2 - supports multiple modules
CREATE TABLE public.admin_routine_templates_v2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  purpose TEXT,
  module TEXT NOT NULL DEFAULT 'felles',
  subcategory TEXT,
  target_roles TEXT[] DEFAULT '{}',
  frequency TEXT DEFAULT 'ved_behov',
  steps JSONB DEFAULT '[]',
  attachments JSONB DEFAULT '[]',
  legal_refs JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,
  is_global_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_routine_templates_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System admins can manage routine templates v2"
  ON public.admin_routine_templates_v2 FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'system_admin')
  );

CREATE POLICY "Authenticated users can read published routine templates v2"
  ON public.admin_routine_templates_v2 FOR SELECT
  USING (status = 'published');

-- Customer routine instances
CREATE TABLE public.customer_routine_instances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.admin_routine_templates_v2(id) ON DELETE SET NULL,
  module TEXT NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  template_version INTEGER,
  update_available BOOLEAN NOT NULL DEFAULT false,
  last_reviewed TIMESTAMP WITH TIME ZONE,
  next_due TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_routine_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company routine instances"
  ON public.customer_routine_instances FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "System admins can manage all routine instances"
  ON public.customer_routine_instances FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'system_admin')
  );

CREATE TRIGGER update_admin_routine_templates_v2_updated_at
  BEFORE UPDATE ON public.admin_routine_templates_v2
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_routine_instances_updated_at
  BEFORE UPDATE ON public.customer_routine_instances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
