
-- Table for meeting question templates
CREATE TABLE public.hr_meeting_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  template_name text NOT NULL,
  meeting_type text NOT NULL DEFAULT 'medarbeidersamtale',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table for questions within a template
CREATE TABLE public.hr_meeting_template_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.hr_meeting_templates(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'text', -- text, rating, yes_no, multiple_choice
  options jsonb DEFAULT null, -- for multiple_choice
  sort_order integer NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table for meeting responses (answers during a conducted meeting)
CREATE TABLE public.hr_meeting_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.hr_meetings(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.hr_meeting_template_questions(id) ON DELETE CASCADE,
  answer_text text,
  answer_rating integer,
  answer_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add template_id to hr_meetings to link a meeting to a question template
ALTER TABLE public.hr_meetings ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.hr_meeting_templates(id);

-- RLS for hr_meeting_templates
ALTER TABLE public.hr_meeting_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view templates in their company" ON public.hr_meeting_templates FOR SELECT TO authenticated USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can insert templates in their company" ON public.hr_meeting_templates FOR INSERT TO authenticated WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can update templates in their company" ON public.hr_meeting_templates FOR UPDATE TO authenticated USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can delete templates in their company" ON public.hr_meeting_templates FOR DELETE TO authenticated USING (company_id = get_user_company_id(auth.uid()));

-- RLS for hr_meeting_template_questions
ALTER TABLE public.hr_meeting_template_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view questions via template" ON public.hr_meeting_template_questions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.hr_meeting_templates t WHERE t.id = template_id AND t.company_id = get_user_company_id(auth.uid())));
CREATE POLICY "Users can insert questions via template" ON public.hr_meeting_template_questions FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.hr_meeting_templates t WHERE t.id = template_id AND t.company_id = get_user_company_id(auth.uid())));
CREATE POLICY "Users can update questions via template" ON public.hr_meeting_template_questions FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.hr_meeting_templates t WHERE t.id = template_id AND t.company_id = get_user_company_id(auth.uid())));
CREATE POLICY "Users can delete questions via template" ON public.hr_meeting_template_questions FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.hr_meeting_templates t WHERE t.id = template_id AND t.company_id = get_user_company_id(auth.uid())));

-- RLS for hr_meeting_responses
ALTER TABLE public.hr_meeting_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view responses via meeting" ON public.hr_meeting_responses FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.hr_meetings m WHERE m.id = meeting_id AND m.company_id = get_user_company_id(auth.uid())));
CREATE POLICY "Users can insert responses via meeting" ON public.hr_meeting_responses FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.hr_meetings m WHERE m.id = meeting_id AND m.company_id = get_user_company_id(auth.uid())));
CREATE POLICY "Users can update responses via meeting" ON public.hr_meeting_responses FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.hr_meetings m WHERE m.id = meeting_id AND m.company_id = get_user_company_id(auth.uid())));
CREATE POLICY "Users can delete responses via meeting" ON public.hr_meeting_responses FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.hr_meetings m WHERE m.id = meeting_id AND m.company_id = get_user_company_id(auth.uid())));
