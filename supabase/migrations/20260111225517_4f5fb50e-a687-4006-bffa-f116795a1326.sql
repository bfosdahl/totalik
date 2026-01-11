-- Create department-specific HMS tables (separate from main company)

-- Department goals
CREATE TABLE public.department_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id UUID NOT NULL REFERENCES public.company_departments(id) ON DELETE CASCADE,
  goal_text TEXT NOT NULL,
  is_predefined BOOLEAN DEFAULT false,
  sort_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Department organization
CREATE TABLE public.department_organization (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id UUID NOT NULL REFERENCES public.company_departments(id) ON DELETE CASCADE UNIQUE,
  template_id TEXT,
  custom_content TEXT NOT NULL DEFAULT '',
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Department risk assessments
CREATE TABLE public.department_risk_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id UUID NOT NULL REFERENCES public.company_departments(id) ON DELETE CASCADE UNIQUE,
  risks JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Department routines
CREATE TABLE public.department_routines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id UUID NOT NULL REFERENCES public.company_departments(id) ON DELETE CASCADE UNIQUE,
  routines JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Department action plans
CREATE TABLE public.department_action_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id UUID NOT NULL REFERENCES public.company_departments(id) ON DELETE CASCADE UNIQUE,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.department_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_organization ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_action_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for department_goals
CREATE POLICY "Users can view department goals in their company"
ON public.department_goals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM company_departments cd
    JOIN profiles p ON p.company_id = cd.company_id
    WHERE cd.id = department_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Company admins can manage department goals"
ON public.department_goals FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM company_departments cd
    JOIN profiles p ON p.company_id = cd.company_id
    WHERE cd.id = department_id AND p.user_id = auth.uid()
    AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid()) OR public.is_department_admin_for(auth.uid(), department_id))
  )
);

-- RLS Policies for department_organization
CREATE POLICY "Users can view department organization in their company"
ON public.department_organization FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM company_departments cd
    JOIN profiles p ON p.company_id = cd.company_id
    WHERE cd.id = department_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Company admins can manage department organization"
ON public.department_organization FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM company_departments cd
    JOIN profiles p ON p.company_id = cd.company_id
    WHERE cd.id = department_id AND p.user_id = auth.uid()
    AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid()) OR public.is_department_admin_for(auth.uid(), department_id))
  )
);

-- RLS Policies for department_risk_assessments
CREATE POLICY "Users can view department risks in their company"
ON public.department_risk_assessments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM company_departments cd
    JOIN profiles p ON p.company_id = cd.company_id
    WHERE cd.id = department_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Company admins can manage department risks"
ON public.department_risk_assessments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM company_departments cd
    JOIN profiles p ON p.company_id = cd.company_id
    WHERE cd.id = department_id AND p.user_id = auth.uid()
    AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid()) OR public.is_department_admin_for(auth.uid(), department_id))
  )
);

-- RLS Policies for department_routines
CREATE POLICY "Users can view department routines in their company"
ON public.department_routines FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM company_departments cd
    JOIN profiles p ON p.company_id = cd.company_id
    WHERE cd.id = department_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Company admins can manage department routines"
ON public.department_routines FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM company_departments cd
    JOIN profiles p ON p.company_id = cd.company_id
    WHERE cd.id = department_id AND p.user_id = auth.uid()
    AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid()) OR public.is_department_admin_for(auth.uid(), department_id))
  )
);

-- RLS Policies for department_action_plans
CREATE POLICY "Users can view department actions in their company"
ON public.department_action_plans FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM company_departments cd
    JOIN profiles p ON p.company_id = cd.company_id
    WHERE cd.id = department_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Company admins can manage department actions"
ON public.department_action_plans FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM company_departments cd
    JOIN profiles p ON p.company_id = cd.company_id
    WHERE cd.id = department_id AND p.user_id = auth.uid()
    AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid()) OR public.is_department_admin_for(auth.uid(), department_id))
  )
);

-- Create updated_at triggers
CREATE TRIGGER update_department_goals_updated_at
BEFORE UPDATE ON public.department_goals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_department_organization_updated_at
BEFORE UPDATE ON public.department_organization
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_department_risk_assessments_updated_at
BEFORE UPDATE ON public.department_risk_assessments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_department_routines_updated_at
BEFORE UPDATE ON public.department_routines
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_department_action_plans_updated_at
BEFORE UPDATE ON public.department_action_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();