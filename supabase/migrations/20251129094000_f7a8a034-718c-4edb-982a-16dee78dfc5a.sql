-- Create table for vernerunde templates
CREATE TABLE IF NOT EXISTS public.ks_vernerunde_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_predefined BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for vernerunde checkpoints
CREATE TABLE IF NOT EXISTS public.ks_vernerunde_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.ks_vernerunde_templates(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  category TEXT DEFAULT 'Sikkerhet',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ks_vernerunde_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ks_vernerunde_checkpoints ENABLE ROW LEVEL SECURITY;

-- RLS policies for templates
CREATE POLICY "Users can view vernerunde templates for their company"
  ON public.ks_vernerunde_templates
  FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create vernerunde templates for their company"
  ON public.ks_vernerunde_templates
  FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update vernerunde templates for their company"
  ON public.ks_vernerunde_templates
  FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete vernerunde templates for their company"
  ON public.ks_vernerunde_templates
  FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()));

-- RLS policies for checkpoints
CREATE POLICY "Users can view vernerunde checkpoints for their company"
  ON public.ks_vernerunde_checkpoints
  FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create vernerunde checkpoints for their company"
  ON public.ks_vernerunde_checkpoints
  FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update vernerunde checkpoints for their company"
  ON public.ks_vernerunde_checkpoints
  FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete vernerunde checkpoints for their company"
  ON public.ks_vernerunde_checkpoints
  FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ks_vernerunde_templates_company_id 
  ON public.ks_vernerunde_templates(company_id);

CREATE INDEX IF NOT EXISTS idx_ks_vernerunde_checkpoints_template_id 
  ON public.ks_vernerunde_checkpoints(template_id);

CREATE INDEX IF NOT EXISTS idx_ks_vernerunde_checkpoints_company_id 
  ON public.ks_vernerunde_checkpoints(company_id);

-- Add trigger for updated_at
CREATE TRIGGER update_ks_vernerunde_templates_updated_at
  BEFORE UPDATE ON public.ks_vernerunde_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();