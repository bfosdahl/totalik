-- Create table for project timeline events with photos
CREATE TABLE public.ks_module2_timeline_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.ks_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  photo_paths TEXT[] DEFAULT '{}',
  category TEXT DEFAULT 'general',
  created_by_id UUID REFERENCES public.profiles(id),
  created_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ks_module2_timeline_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for company access
CREATE POLICY "Users can view their company timeline events"
  ON public.ks_module2_timeline_events
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create timeline events for their company"
  ON public.ks_module2_timeline_events
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company timeline events"
  ON public.ks_module2_timeline_events
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company timeline events"
  ON public.ks_module2_timeline_events
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_ks_module2_timeline_events_updated_at
  BEFORE UPDATE ON public.ks_module2_timeline_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();