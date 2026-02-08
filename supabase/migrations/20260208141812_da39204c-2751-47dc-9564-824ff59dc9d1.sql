-- Floor Plans table for FDV module
CREATE TABLE public.fdv_floor_plans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    building_id UUID NOT NULL REFERENCES public.fdv_buildings(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    floor_name TEXT NOT NULL DEFAULT 'Etasje',
    image_url TEXT,
    elements_json TEXT,
    created_by_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_fdv_floor_plans_building_id ON public.fdv_floor_plans(building_id);
CREATE INDEX idx_fdv_floor_plans_company_id ON public.fdv_floor_plans(company_id);

-- RLS
ALTER TABLE public.fdv_floor_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fdv_floor_plans_select"
ON public.fdv_floor_plans FOR SELECT
USING (public.user_has_fdv_access(auth.uid(), company_id));

CREATE POLICY "fdv_floor_plans_insert"
ON public.fdv_floor_plans FOR INSERT
WITH CHECK (public.user_can_manage_fdv(auth.uid(), company_id));

CREATE POLICY "fdv_floor_plans_update"
ON public.fdv_floor_plans FOR UPDATE
USING (public.user_can_manage_fdv(auth.uid(), company_id));

CREATE POLICY "fdv_floor_plans_delete"
ON public.fdv_floor_plans FOR DELETE
USING (public.user_can_manage_fdv(auth.uid(), company_id));

-- Trigger for updated_at
CREATE TRIGGER update_fdv_floor_plans_updated_at
BEFORE UPDATE ON public.fdv_floor_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();