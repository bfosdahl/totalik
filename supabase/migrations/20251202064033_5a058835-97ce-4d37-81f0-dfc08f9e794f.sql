-- Create time_off_requests table for ferieplanlegger
CREATE TABLE public.time_off_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  type TEXT NOT NULL DEFAULT 'ferie', -- ferie, sykdom, permisjon, annet
  reason TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  approved_by_id UUID REFERENCES profiles(id),
  approved_by_name TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create work_schedules table for arbeidsplanlegger
CREATE TABLE public.work_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  schedule_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  schedule_type TEXT NOT NULL DEFAULT 'planned', -- planned, actual
  notes TEXT,
  created_by_id UUID REFERENCES profiles(id),
  created_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_schedules ENABLE ROW LEVEL SECURITY;

-- RLS policies for time_off_requests
CREATE POLICY "Employees can view their own time off requests"
  ON public.time_off_requests
  FOR SELECT
  USING (employee_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Employees can create their own time off requests"
  ON public.time_off_requests
  FOR INSERT
  WITH CHECK (
    company_id = get_user_company_id(auth.uid()) AND
    employee_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Company admins can view all time off requests"
  ON public.time_off_requests
  FOR SELECT
  USING (
    company_id = get_user_company_id(auth.uid()) AND
    (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
  );

CREATE POLICY "Company admins can update time off requests"
  ON public.time_off_requests
  FOR UPDATE
  USING (
    company_id = get_user_company_id(auth.uid()) AND
    (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
  )
  WITH CHECK (
    company_id = get_user_company_id(auth.uid()) AND
    (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
  );

CREATE POLICY "System admins can manage all time off requests"
  ON public.time_off_requests
  FOR ALL
  USING (is_system_admin(auth.uid()))
  WITH CHECK (is_system_admin(auth.uid()));

-- RLS policies for work_schedules
CREATE POLICY "Employees can view their own work schedules"
  ON public.work_schedules
  FOR SELECT
  USING (employee_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Company admins can view all work schedules"
  ON public.work_schedules
  FOR SELECT
  USING (
    company_id = get_user_company_id(auth.uid()) AND
    (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
  );

CREATE POLICY "Company admins can manage work schedules"
  ON public.work_schedules
  FOR ALL
  USING (
    company_id = get_user_company_id(auth.uid()) AND
    (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
  )
  WITH CHECK (
    company_id = get_user_company_id(auth.uid()) AND
    (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
  );

CREATE POLICY "Employees can create actual work schedule entries"
  ON public.work_schedules
  FOR INSERT
  WITH CHECK (
    company_id = get_user_company_id(auth.uid()) AND
    employee_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) AND
    schedule_type = 'actual'
  );

CREATE POLICY "System admins can manage all work schedules"
  ON public.work_schedules
  FOR ALL
  USING (is_system_admin(auth.uid()))
  WITH CHECK (is_system_admin(auth.uid()));

-- Create indexes for better performance
CREATE INDEX idx_time_off_requests_company ON time_off_requests(company_id);
CREATE INDEX idx_time_off_requests_employee ON time_off_requests(employee_id);
CREATE INDEX idx_time_off_requests_status ON time_off_requests(status);
CREATE INDEX idx_time_off_requests_dates ON time_off_requests(start_date, end_date);

CREATE INDEX idx_work_schedules_company ON work_schedules(company_id);
CREATE INDEX idx_work_schedules_employee ON work_schedules(employee_id);
CREATE INDEX idx_work_schedules_date ON work_schedules(schedule_date);
CREATE INDEX idx_work_schedules_type ON work_schedules(schedule_type);