
-- Add new columns to admin_checklist_templates for version control and mandatory flags
ALTER TABLE public.admin_checklist_templates 
ADD COLUMN IF NOT EXISTS version text DEFAULT '2025.1',
ADD COLUMN IF NOT EXISTS valid_from date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS valid_to date,
ADD COLUMN IF NOT EXISTS is_mandatory boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS content_html text,
ADD COLUMN IF NOT EXISTS attached_pdf_path text;

-- Add new columns to admin_routine_templates
ALTER TABLE public.admin_routine_templates 
ADD COLUMN IF NOT EXISTS version text DEFAULT '2025.1',
ADD COLUMN IF NOT EXISTS valid_from date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS valid_to date,
ADD COLUMN IF NOT EXISTS is_mandatory boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false;

-- Add new columns to admin_documents for better categorization
ALTER TABLE public.admin_documents 
ADD COLUMN IF NOT EXISTS version text DEFAULT '2025.1',
ADD COLUMN IF NOT EXISTS valid_from date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS valid_to date,
ADD COLUMN IF NOT EXISTS is_mandatory boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS category text DEFAULT 'general';

-- Create table to track customer acknowledgments of mandatory templates
CREATE TABLE IF NOT EXISTS public.ks_module2_template_acknowledgments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  project_id uuid,
  template_type text NOT NULL, -- 'checklist', 'routine', 'document'
  template_id uuid NOT NULL,
  acknowledged_by uuid,
  acknowledged_by_name text NOT NULL,
  acknowledged_at timestamp with time zone DEFAULT now(),
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ks_module2_template_acknowledgments ENABLE ROW LEVEL SECURITY;

-- RLS policies for template acknowledgments
CREATE POLICY "Users can view their company acknowledgments"
ON public.ks_module2_template_acknowledgments
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create acknowledgments for their company"
ON public.ks_module2_template_acknowledgments
FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "System admins can view all acknowledgments"
ON public.ks_module2_template_acknowledgments
FOR SELECT
USING (is_system_admin(auth.uid()));

-- Create table to track template version notifications
CREATE TABLE IF NOT EXISTS public.ks_module2_template_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type text NOT NULL,
  template_id uuid NOT NULL,
  version text NOT NULL,
  notification_message text NOT NULL,
  due_date date,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ks_module2_template_notifications ENABLE ROW LEVEL SECURITY;

-- Everyone can read notifications
CREATE POLICY "All authenticated users can view notifications"
ON public.ks_module2_template_notifications
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only system admins can manage notifications
CREATE POLICY "System admins can manage notifications"
ON public.ks_module2_template_notifications
FOR ALL
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_template_ack_company ON public.ks_module2_template_acknowledgments(company_id);
CREATE INDEX IF NOT EXISTS idx_template_ack_template ON public.ks_module2_template_acknowledgments(template_id);
CREATE INDEX IF NOT EXISTS idx_template_notifications_template ON public.ks_module2_template_notifications(template_id);
