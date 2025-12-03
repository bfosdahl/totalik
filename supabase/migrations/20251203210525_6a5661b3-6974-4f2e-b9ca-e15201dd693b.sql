-- Create table for tracking KS Module 2 checklist deadline reminders
CREATE TABLE public.ks_module2_checklist_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID NOT NULL REFERENCES public.ks_module2_checklists(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.ks_module2_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL, -- 'week_before', 'three_days', 'day_before', 'day_of', 'overdue'
  recipient_email TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ks_module2_checklist_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their company's reminders"
  ON public.ks_module2_checklist_reminders
  FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Service role can insert reminders"
  ON public.ks_module2_checklist_reminders
  FOR INSERT
  WITH CHECK (true);

-- Create index for efficient queries
CREATE INDEX idx_ks_module2_checklist_reminders_checklist ON public.ks_module2_checklist_reminders(checklist_id);
CREATE INDEX idx_ks_module2_checklist_reminders_lookup ON public.ks_module2_checklist_reminders(checklist_id, reminder_type);