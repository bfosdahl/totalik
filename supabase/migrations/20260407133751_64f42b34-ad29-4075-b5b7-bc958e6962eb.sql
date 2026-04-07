CREATE TABLE public.ks_project_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.ks_module2_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_ks_project_chat_project ON public.ks_project_chat_messages(project_id, created_at);

ALTER TABLE public.ks_project_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chat messages for their company projects"
ON public.ks_project_chat_messages
FOR SELECT
TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create chat messages for their company projects"
ON public.ks_project_chat_messages
FOR INSERT
TO authenticated
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));