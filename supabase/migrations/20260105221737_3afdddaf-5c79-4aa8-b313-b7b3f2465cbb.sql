-- 1. Create user_departments junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.user_departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.company_departments(id) ON DELETE CASCADE,
  is_department_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, department_id)
);

-- Enable RLS
ALTER TABLE public.user_departments ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_departments - check company_id match via department
CREATE POLICY "Users can view department assignments in their company"
  ON public.user_departments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.company_departments cd
      JOIN public.profiles p ON p.company_id = cd.company_id
      WHERE cd.id = user_departments.department_id
      AND p.id = auth.uid()
    )
  );

CREATE POLICY "Company members can manage department assignments"
  ON public.user_departments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.company_departments cd
      JOIN public.profiles p ON p.company_id = cd.company_id
      WHERE cd.id = user_departments.department_id
      AND p.id = auth.uid()
    )
  );

-- 2. Add department_id to deviations table
ALTER TABLE public.deviations 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.company_departments(id) ON DELETE SET NULL;

-- 3. Add department_id to audits table
ALTER TABLE public.audits 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.company_departments(id) ON DELETE SET NULL;

-- 4. Add department_id to time_entries table
ALTER TABLE public.time_entries 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.company_departments(id) ON DELETE SET NULL;

-- 5. Add department_id to audit_form_responses table
ALTER TABLE public.audit_form_responses 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.company_departments(id) ON DELETE SET NULL;

-- 6. Add primary_department_id to profiles for default department
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS primary_department_id UUID REFERENCES public.company_departments(id) ON DELETE SET NULL;

-- 7. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_departments_user_id ON public.user_departments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_departments_department_id ON public.user_departments(department_id);
CREATE INDEX IF NOT EXISTS idx_deviations_department_id ON public.deviations(department_id);
CREATE INDEX IF NOT EXISTS idx_audits_department_id ON public.audits(department_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_department_id ON public.time_entries(department_id);

-- 8. Create trigger for updated_at on user_departments
CREATE OR REPLACE FUNCTION public.update_user_departments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_departments_updated_at ON public.user_departments;
CREATE TRIGGER update_user_departments_updated_at
  BEFORE UPDATE ON public.user_departments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_departments_updated_at();