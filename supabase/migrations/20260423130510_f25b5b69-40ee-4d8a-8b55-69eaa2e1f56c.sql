
-- Table for configurable daily rounds (named collections of stations)
CREATE TABLE public.ik_mat_daily_rounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  -- stations is an ordered array of objects:
  -- { type: 'temperature' | 'checklist' | 'cleaning', ref_id: uuid, label?: text }
  --   - temperature.ref_id = ik_mat_temperature_equipment.id
  --   - checklist.ref_id   = ik_mat_custom_checklists.id
  --   - cleaning.ref_id    = ik_mat_custom_cleaning_tasks.id
  stations JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_ik_mat_daily_rounds_company ON public.ik_mat_daily_rounds(company_id);

ALTER TABLE public.ik_mat_daily_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view rounds in own company"
  ON public.ik_mat_daily_rounds FOR SELECT
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Admins can insert rounds in own company"
  ON public.ik_mat_daily_rounds FOR INSERT
  WITH CHECK (
    company_id = public.get_user_company_id(auth.uid())
    AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid()) OR public.is_any_department_admin(auth.uid()))
  );

CREATE POLICY "Admins can update rounds in own company"
  ON public.ik_mat_daily_rounds FOR UPDATE
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid()) OR public.is_any_department_admin(auth.uid()))
  );

CREATE POLICY "Admins can delete rounds in own company"
  ON public.ik_mat_daily_rounds FOR DELETE
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid()) OR public.is_any_department_admin(auth.uid()))
  );

CREATE TRIGGER trg_ik_mat_daily_rounds_updated_at
  BEFORE UPDATE ON public.ik_mat_daily_rounds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Table for round completions (audit trail)
CREATE TABLE public.ik_mat_daily_round_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  round_id UUID NOT NULL REFERENCES public.ik_mat_daily_rounds(id) ON DELETE CASCADE,
  completed_by_id UUID,
  completed_by_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed', -- 'completed' | 'partial'
  -- Per-station results: { type, ref_id, label, status: 'done'|'skipped', notes?, value? }
  station_results JSONB NOT NULL DEFAULT '[]'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_ik_mat_daily_round_completions_company ON public.ik_mat_daily_round_completions(company_id);
CREATE INDEX idx_ik_mat_daily_round_completions_round ON public.ik_mat_daily_round_completions(round_id);

ALTER TABLE public.ik_mat_daily_round_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view completions in own company"
  ON public.ik_mat_daily_round_completions FOR SELECT
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert completions in own company"
  ON public.ik_mat_daily_round_completions FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Admins can delete completions in own company"
  ON public.ik_mat_daily_round_completions FOR DELETE
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid()))
  );
