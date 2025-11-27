-- Create deviation_comments table
CREATE TABLE public.deviation_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deviation_id UUID NOT NULL,
  company_id UUID NOT NULL,
  user_id UUID,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deviation_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view comments in their company"
ON public.deviation_comments
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can add comments in their company"
ON public.deviation_comments
FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete their own comments"
ON public.deviation_comments
FOR DELETE
USING (company_id = get_user_company_id(auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Company admins can delete any comment in their company"
ON public.deviation_comments
FOR DELETE
USING (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));

CREATE POLICY "System admins can manage all comments"
ON public.deviation_comments
FOR ALL
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));