
-- Table to track which AI-generated suggestions get accepted by customers
-- This allows the system to learn which suggestions work best per industry
CREATE TABLE public.ai_setup_suggestion_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  industry TEXT NOT NULL,
  suggestion_type TEXT NOT NULL, -- 'maal', 'risiko', 'handlingsplan', 'rutine'
  suggestion_text TEXT NOT NULL,
  times_suggested INTEGER NOT NULL DEFAULT 1,
  times_accepted INTEGER NOT NULL DEFAULT 0,
  company_size_category TEXT, -- 'small' (1-10), 'medium' (11-50), 'large' (50+)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(industry, suggestion_type, suggestion_text)
);

-- Enable RLS
ALTER TABLE public.ai_setup_suggestion_stats ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read (needed by edge function via service role, 
-- but also useful for admin viewing)
CREATE POLICY "Authenticated users can read suggestion stats"
  ON public.ai_setup_suggestion_stats FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only system admins can manually manage
CREATE POLICY "System admins can manage suggestion stats"
  ON public.ai_setup_suggestion_stats FOR ALL
  USING (public.is_system_admin(auth.uid()));

-- Index for fast lookups by industry + type
CREATE INDEX idx_suggestion_stats_lookup 
  ON public.ai_setup_suggestion_stats(industry, suggestion_type, times_accepted DESC);

-- Trigger for updated_at
CREATE TRIGGER update_suggestion_stats_updated_at
  BEFORE UPDATE ON public.ai_setup_suggestion_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Industry-specific template suggestions (option 3 - for future use)
CREATE TABLE public.ai_setup_industry_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  industry TEXT NOT NULL,
  template_type TEXT NOT NULL, -- 'maal', 'risiko', 'handlingsplan', 'rutine'
  suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(industry, template_type)
);

ALTER TABLE public.ai_setup_industry_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read industry templates"
  ON public.ai_setup_industry_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System admins can manage industry templates"
  ON public.ai_setup_industry_templates FOR ALL
  USING (public.is_system_admin(auth.uid()));

CREATE INDEX idx_industry_templates_lookup
  ON public.ai_setup_industry_templates(industry, template_type);

CREATE TRIGGER update_industry_templates_updated_at
  BEFORE UPDATE ON public.ai_setup_industry_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
