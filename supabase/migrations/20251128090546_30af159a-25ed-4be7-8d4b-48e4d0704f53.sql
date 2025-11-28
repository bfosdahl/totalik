-- Add HMS card fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS hms_card_required boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS hms_card_obtained boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS hms_card_number text,
ADD COLUMN IF NOT EXISTS hms_card_expiry_date date,
ADD COLUMN IF NOT EXISTS hms_card_reminder_sent_30_days boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS hms_card_reminder_sent_7_days boolean DEFAULT false;

-- Create table for HMS card help requests
CREATE TABLE public.hms_card_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  requested_by uuid REFERENCES public.profiles(id),
  requested_by_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hms_card_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for hms_card_requests
CREATE POLICY "Users can view their own HMS card requests"
ON public.hms_card_requests FOR SELECT
USING (employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Company admins can manage HMS card requests"
ON public.hms_card_requests FOR ALL
USING (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())))
WITH CHECK (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));

CREATE POLICY "System admins can manage all HMS card requests"
ON public.hms_card_requests FOR ALL
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));

-- Users can create requests for employees in their company
CREATE POLICY "Users can create HMS card requests"
ON public.hms_card_requests FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_hms_card_requests_updated_at
BEFORE UPDATE ON public.hms_card_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();