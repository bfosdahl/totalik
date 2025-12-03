-- Create admin checklist templates table
CREATE TABLE public.admin_checklist_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  trade TEXT,
  checkpoints JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin routine templates table
CREATE TABLE public.admin_routine_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  routine_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  content TEXT NOT NULL DEFAULT '',
  file_path TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_routine_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_checklist_templates
CREATE POLICY "System admins can manage checklist templates"
  ON public.admin_checklist_templates
  FOR ALL
  USING (is_system_admin(auth.uid()))
  WITH CHECK (is_system_admin(auth.uid()));

CREATE POLICY "All authenticated users can view active checklist templates"
  ON public.admin_checklist_templates
  FOR SELECT
  USING (is_active = true);

-- RLS policies for admin_routine_templates
CREATE POLICY "System admins can manage routine templates"
  ON public.admin_routine_templates
  FOR ALL
  USING (is_system_admin(auth.uid()))
  WITH CHECK (is_system_admin(auth.uid()));

CREATE POLICY "All authenticated users can view active routine templates"
  ON public.admin_routine_templates
  FOR SELECT
  USING (is_active = true);

-- Add updated_at triggers
CREATE TRIGGER update_admin_checklist_templates_updated_at
  BEFORE UPDATE ON public.admin_checklist_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_routine_templates_updated_at
  BEFORE UPDATE ON public.admin_routine_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();