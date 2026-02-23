
-- Table for UK checklist items (custom points added during control execution)
CREATE TABLE public.ks_module2_uk_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  uk_id UUID NOT NULL REFERENCES public.ks_module2_uk(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  sort_order INTEGER NOT NULL DEFAULT 0,
  checkpoint_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  photo_paths TEXT[] DEFAULT '{}',
  created_by_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.ks_module2_uk_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view UK checklist items for their company"
  ON public.ks_module2_uk_checklist_items FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert UK checklist items for their company"
  ON public.ks_module2_uk_checklist_items FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update UK checklist items for their company"
  ON public.ks_module2_uk_checklist_items FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete UK checklist items for their company"
  ON public.ks_module2_uk_checklist_items FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );
