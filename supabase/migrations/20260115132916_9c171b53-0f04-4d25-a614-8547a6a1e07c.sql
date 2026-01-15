-- Table for shift swap requests and change requests
CREATE TABLE public.shift_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Request type: swap, availability, time_change, new_shift, absence
  request_type TEXT NOT NULL CHECK (request_type IN ('swap', 'availability', 'time_change', 'new_shift', 'absence')),
  
  -- The shift being affected
  schedule_id UUID REFERENCES public.work_schedules(id) ON DELETE CASCADE,
  
  -- Who made the request
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requester_name TEXT NOT NULL,
  
  -- For swap requests: who is being asked to swap
  target_employee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_employee_name TEXT,
  
  -- For availability requests: is it open for anyone?
  is_open_request BOOLEAN DEFAULT false,
  
  -- For new_shift/time_change: proposed times
  proposed_date DATE,
  proposed_start_time TIME,
  proposed_end_time TIME,
  proposed_location TEXT,
  proposed_role TEXT,
  
  -- For absence: reason
  absence_reason TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'employee_approved', 'manager_approved', 'rejected', 'cancelled', 'completed')),
  
  -- Who handled the request
  handled_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  handled_by_name TEXT,
  handled_at TIMESTAMPTZ,
  
  -- Notes
  request_notes TEXT,
  response_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shift_requests ENABLE ROW LEVEL SECURITY;

-- Policies for shift_requests
CREATE POLICY "Users can view shift requests in their company"
ON public.shift_requests FOR SELECT
USING (
  company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create their own shift requests"
ON public.shift_requests FOR INSERT
WITH CHECK (
  company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
  AND requester_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can update any shift request"
ON public.shift_requests FOR UPDATE
USING (
  company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
  AND (
    -- Company admins can update all
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('company_admin', 'system_admin'))
    -- Target employee can update (to approve/reject swap)
    OR target_employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    -- Requester can cancel their own
    OR requester_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Admins can delete shift requests"
ON public.shift_requests FOR DELETE
USING (
  company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
  AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('company_admin', 'system_admin'))
);

-- Add overtime and break tracking to work_schedules
ALTER TABLE public.work_schedules 
ADD COLUMN IF NOT EXISTS break_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_overtime BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS overtime_reason TEXT;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_shift_requests_company_id ON public.shift_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_shift_requests_requester_id ON public.shift_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_shift_requests_target_employee_id ON public.shift_requests(target_employee_id);
CREATE INDEX IF NOT EXISTS idx_shift_requests_status ON public.shift_requests(status);

-- Trigger for updated_at
CREATE TRIGGER update_shift_requests_updated_at
BEFORE UPDATE ON public.shift_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();