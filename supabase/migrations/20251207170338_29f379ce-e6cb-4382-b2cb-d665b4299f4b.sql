-- Create sequence for meeting number
CREATE SEQUENCE IF NOT EXISTS ks_module2_meeting_number_seq START 1;

-- Create function to generate meeting number
CREATE OR REPLACE FUNCTION public.generate_ks_module2_meeting_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
  meeting_num TEXT;
BEGIN
  next_num := nextval('ks_module2_meeting_number_seq');
  meeting_num := 'MR-' || LPAD(next_num::TEXT, 4, '0');
  RETURN meeting_num;
END;
$$;

-- Create meetings table
CREATE TABLE public.ks_module2_meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.ks_module2_projects(id) ON DELETE CASCADE,
  meeting_number TEXT,
  meeting_type TEXT NOT NULL DEFAULT 'Byggemøte',
  title TEXT NOT NULL,
  meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  participants JSONB DEFAULT '[]'::jsonb,
  agenda TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'sent')),
  pdf_path TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meeting items/agenda table
CREATE TABLE public.ks_module2_meeting_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.ks_module2_meetings(id) ON DELETE CASCADE,
  item_number INTEGER NOT NULL,
  topic TEXT NOT NULL,
  discussion TEXT,
  decision TEXT,
  responsible_name TEXT,
  responsible_id UUID,
  deadline DATE,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed')),
  linked_avvik_id UUID REFERENCES public.ks_module2_avvik(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trigger for auto-generating meeting number
CREATE OR REPLACE FUNCTION public.set_ks_module2_meeting_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.meeting_number IS NULL OR NEW.meeting_number = '' THEN
    NEW.meeting_number := generate_ks_module2_meeting_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_meeting_number_trigger
BEFORE INSERT ON public.ks_module2_meetings
FOR EACH ROW
EXECUTE FUNCTION set_ks_module2_meeting_number();

-- Enable RLS
ALTER TABLE public.ks_module2_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ks_module2_meeting_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for meetings
CREATE POLICY "Users can view meetings in their company"
ON public.ks_module2_meetings
FOR SELECT
USING (
  company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  OR public.is_system_admin(auth.uid())
  OR public.has_guest_project_access(project_id)
);

CREATE POLICY "Users can create meetings in their company"
ON public.ks_module2_meetings
FOR INSERT
WITH CHECK (
  company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  OR public.is_system_admin(auth.uid())
);

CREATE POLICY "Users can update meetings in their company"
ON public.ks_module2_meetings
FOR UPDATE
USING (
  company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  OR public.is_system_admin(auth.uid())
);

CREATE POLICY "Users can delete meetings in their company"
ON public.ks_module2_meetings
FOR DELETE
USING (
  company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  OR public.is_system_admin(auth.uid())
);

-- RLS policies for meeting items
CREATE POLICY "Users can view meeting items"
ON public.ks_module2_meeting_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ks_module2_meetings m
    WHERE m.id = meeting_id
    AND (
      m.company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
      OR public.is_system_admin(auth.uid())
      OR public.has_guest_project_access(m.project_id)
    )
  )
);

CREATE POLICY "Users can create meeting items"
ON public.ks_module2_meeting_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ks_module2_meetings m
    WHERE m.id = meeting_id
    AND (
      m.company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
      OR public.is_system_admin(auth.uid())
    )
  )
);

CREATE POLICY "Users can update meeting items"
ON public.ks_module2_meeting_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.ks_module2_meetings m
    WHERE m.id = meeting_id
    AND (
      m.company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
      OR public.is_system_admin(auth.uid())
    )
  )
);

CREATE POLICY "Users can delete meeting items"
ON public.ks_module2_meeting_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.ks_module2_meetings m
    WHERE m.id = meeting_id
    AND (
      m.company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
      OR public.is_system_admin(auth.uid())
    )
  )
);

-- Create indexes
CREATE INDEX idx_ks_module2_meetings_company_id ON public.ks_module2_meetings(company_id);
CREATE INDEX idx_ks_module2_meetings_project_id ON public.ks_module2_meetings(project_id);
CREATE INDEX idx_ks_module2_meeting_items_meeting_id ON public.ks_module2_meeting_items(meeting_id);

-- Triggers for updated_at
CREATE TRIGGER update_ks_module2_meetings_updated_at
BEFORE UPDATE ON public.ks_module2_meetings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ks_module2_meeting_items_updated_at
BEFORE UPDATE ON public.ks_module2_meeting_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();