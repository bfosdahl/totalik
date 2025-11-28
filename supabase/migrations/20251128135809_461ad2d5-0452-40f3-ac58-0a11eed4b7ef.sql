-- Create notification settings table for companies
CREATE TABLE public.company_notification_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  -- Deviation notifications
  deviation_assignment_enabled boolean NOT NULL DEFAULT true,
  deviation_deadline_reminder_enabled boolean NOT NULL DEFAULT true,
  deviation_deadline_days_before integer[] NOT NULL DEFAULT '{7,3,1}'::integer[],
  -- Course expiry notifications
  course_expiry_enabled boolean NOT NULL DEFAULT true,
  course_expiry_days_before integer[] NOT NULL DEFAULT '{30,7}'::integer[],
  -- HMS card expiry notifications
  hms_card_expiry_enabled boolean NOT NULL DEFAULT true,
  hms_card_expiry_days_before integer[] NOT NULL DEFAULT '{90,60,30,7}'::integer[],
  -- Email recipients
  notify_company_admin boolean NOT NULL DEFAULT true,
  notify_hms_responsible boolean NOT NULL DEFAULT true,
  notify_employee boolean NOT NULL DEFAULT true,
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_notification_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their company notification settings"
ON public.company_notification_settings
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can manage their company notification settings"
ON public.company_notification_settings
FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
)
WITH CHECK (
  company_id = get_user_company_id(auth.uid()) 
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);

CREATE POLICY "System admins can manage all notification settings"
ON public.company_notification_settings
FOR ALL
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));

-- Create updated_at trigger
CREATE TRIGGER update_company_notification_settings_updated_at
BEFORE UPDATE ON public.company_notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();