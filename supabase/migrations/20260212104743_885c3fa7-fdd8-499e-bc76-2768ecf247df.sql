
-- Table for IK Alkohol control entries (daglige, månedlige, årlige kontroller)
CREATE TABLE public.ik_alkohol_controls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  control_type TEXT NOT NULL CHECK (control_type IN ('daily', 'monthly', 'yearly')),
  control_category TEXT NOT NULL,
  control_date DATE NOT NULL DEFAULT CURRENT_DATE,
  checklist_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  completed_by_id UUID REFERENCES public.profiles(id),
  completed_by_name TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('draft', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ik_alkohol_controls ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their company controls"
ON public.ik_alkohol_controls FOR SELECT
USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Users can create controls for their company"
ON public.ik_alkohol_controls FOR INSERT
WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Users can update their company controls"
ON public.ik_alkohol_controls FOR UPDATE
USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete their company controls"
ON public.ik_alkohol_controls FOR DELETE
USING (company_id = public.get_user_company_id(auth.uid()));

-- System admins full access
CREATE POLICY "System admins full access to ik_alkohol_controls"
ON public.ik_alkohol_controls FOR ALL
USING (public.is_system_admin(auth.uid()));

-- Updated at trigger
CREATE TRIGGER update_ik_alkohol_controls_updated_at
BEFORE UPDATE ON public.ik_alkohol_controls
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
