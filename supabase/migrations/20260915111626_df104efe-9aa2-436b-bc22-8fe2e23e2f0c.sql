CREATE TABLE public.company_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  publish_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_by UUID,
  created_by_name TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.company_announcement_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID NOT NULL REFERENCES public.company_announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (announcement_id, user_id)
);

CREATE INDEX idx_company_announcements_company ON public.company_announcements(company_id, is_deleted, is_pinned, publish_at DESC);
CREATE INDEX idx_company_announcement_reads_user ON public.company_announcement_reads(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_announcements TO authenticated;
GRANT ALL ON public.company_announcements TO service_role;
GRANT SELECT, INSERT, DELETE ON public.company_announcement_reads TO authenticated;
GRANT ALL ON public.company_announcement_reads TO service_role;

ALTER TABLE public.company_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_announcement_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view announcements"
ON public.company_announcements FOR SELECT TO authenticated
USING (company_id = get_user_company_id(auth.uid()) AND is_deleted = false);

CREATE POLICY "Company admins can insert announcements"
ON public.company_announcements FOR INSERT TO authenticated
WITH CHECK (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));

CREATE POLICY "Company admins can update announcements"
ON public.company_announcements FOR UPDATE TO authenticated
USING (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())))
WITH CHECK (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));

CREATE POLICY "Company admins can delete announcements"
ON public.company_announcements FOR DELETE TO authenticated
USING (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));

CREATE POLICY "Users view own announcement reads"
ON public.company_announcement_reads FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users insert own announcement reads"
ON public.company_announcement_reads FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND EXISTS (
  SELECT 1 FROM public.company_announcements a
  WHERE a.id = announcement_id AND a.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users delete own announcement reads"
ON public.company_announcement_reads FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE TRIGGER update_company_announcements_updated_at
BEFORE UPDATE ON public.company_announcements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();