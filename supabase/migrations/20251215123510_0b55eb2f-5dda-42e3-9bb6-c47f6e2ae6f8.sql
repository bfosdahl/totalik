-- Create company_departments table
CREATE TABLE public.company_departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_departments junction table (many-to-many)
CREATE TABLE public.user_departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.company_departments(id) ON DELETE CASCADE,
  is_department_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, department_id)
);

-- Add has_departments flag to companies table
ALTER TABLE public.companies ADD COLUMN has_departments BOOLEAN NOT NULL DEFAULT false;

-- Enable RLS
ALTER TABLE public.company_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_departments ENABLE ROW LEVEL SECURITY;

-- RLS policies for company_departments
CREATE POLICY "Users can view departments in their company"
  ON public.company_departments FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()) OR is_system_admin(auth.uid()));

CREATE POLICY "Company admins can manage departments"
  ON public.company_departments FOR ALL
  USING (
    (company_id = get_user_company_id(auth.uid()) AND is_company_admin(auth.uid()))
    OR is_system_admin(auth.uid())
  )
  WITH CHECK (
    (company_id = get_user_company_id(auth.uid()) AND is_company_admin(auth.uid()))
    OR is_system_admin(auth.uid())
  );

-- RLS policies for user_departments
CREATE POLICY "Users can view their own department assignments"
  ON public.user_departments FOR SELECT
  USING (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM company_departments cd
      WHERE cd.id = user_departments.department_id
      AND cd.company_id = get_user_company_id(auth.uid())
      AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
    )
    OR is_system_admin(auth.uid())
  );

CREATE POLICY "Company admins can manage department assignments"
  ON public.user_departments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM company_departments cd
      WHERE cd.id = user_departments.department_id
      AND cd.company_id = get_user_company_id(auth.uid())
      AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
    )
    OR is_system_admin(auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_departments cd
      WHERE cd.id = user_departments.department_id
      AND cd.company_id = get_user_company_id(auth.uid())
      AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
    )
    OR is_system_admin(auth.uid())
  );

-- Create updated_at trigger for company_departments
CREATE TRIGGER update_company_departments_updated_at
  BEFORE UPDATE ON public.company_departments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_company_departments_company_id ON public.company_departments(company_id);
CREATE INDEX idx_user_departments_user_id ON public.user_departments(user_id);
CREATE INDEX idx_user_departments_department_id ON public.user_departments(department_id);