-- Create table to track sent deadline reminders
CREATE TABLE public.deviation_deadline_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deviation_id UUID NOT NULL,
  company_id UUID NOT NULL,
  reminder_type TEXT NOT NULL, -- 'day_before', 'three_days', 'week_before', 'overdue'
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  recipient_email TEXT NOT NULL,
  UNIQUE(deviation_id, reminder_type)
);

-- Enable RLS
ALTER TABLE public.deviation_deadline_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies - only system can manage these via service role
CREATE POLICY "System admins can view all reminders"
ON public.deviation_deadline_reminders
FOR SELECT
USING (is_system_admin(auth.uid()));

CREATE POLICY "Users can view their company reminders"
ON public.deviation_deadline_reminders
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));