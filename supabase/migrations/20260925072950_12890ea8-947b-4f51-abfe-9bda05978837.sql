ALTER TABLE public.company_announcements
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.ks_module2_projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_critical boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE public.company_announcement_recipients (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id uuid NOT NULL REFERENCES public.company_announcements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (announcement_id, user_id)
);
CREATE INDEX idx_ann_recipients_user ON public.company_announcement_recipients(user_id);
GRANT SELECT, INSERT, DELETE ON public.company_announcement_recipients TO authenticated;
GRANT ALL ON public.company_announcement_recipients TO service_role;

CREATE TABLE public.company_announcement_replies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id uuid NOT NULL REFERENCES public.company_announcements(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  author_name text,
  body text NOT NULL DEFAULT '',
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ann_replies_ann ON public.company_announcement_replies(announcement_id, created_at);
GRANT SELECT, INSERT, UPDATE ON public.company_announcement_replies TO authenticated;
GRANT ALL ON public.company_announcement_replies TO service_role;

CREATE OR REPLACE FUNCTION public.can_view_announcement(_ann uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_announcements a
    WHERE a.id = _ann AND a.is_deleted = false
      AND a.company_id = public.get_user_company_id(_uid)
      AND (a.audience = 'all' OR a.created_by_user_id = _uid
           OR public.is_company_admin(_uid) OR public.is_system_admin(_uid)
           OR EXISTS (SELECT 1 FROM public.company_announcement_recipients r WHERE r.announcement_id = a.id AND r.user_id = _uid))
  )
$$;
REVOKE EXECUTE ON FUNCTION public.can_view_announcement(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_announcement(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Company members can view announcements" ON public.company_announcements;
DROP POLICY IF EXISTS "Company admins can insert announcements" ON public.company_announcements;
DROP POLICY IF EXISTS "Company admins can update announcements" ON public.company_announcements;

CREATE POLICY "Members view allowed announcements" ON public.company_announcements FOR SELECT TO authenticated
USING (company_id = get_user_company_id(auth.uid()) AND is_deleted = false AND (
  audience = 'all' OR created_by_user_id = auth.uid() OR is_company_admin(auth.uid()) OR is_system_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM public.company_announcement_recipients r WHERE r.announcement_id = company_announcements.id AND r.user_id = auth.uid())));

CREATE POLICY "Members create announcements" ON public.company_announcements FOR INSERT TO authenticated
WITH CHECK (company_id = get_user_company_id(auth.uid()) AND created_by_user_id = auth.uid()
  AND (is_pinned = false OR is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));

CREATE POLICY "Author or admin update announcements" ON public.company_announcements FOR UPDATE TO authenticated
USING (company_id = get_user_company_id(auth.uid()) AND (created_by_user_id = auth.uid() OR is_company_admin(auth.uid()) OR is_system_admin(auth.uid())))
WITH CHECK (company_id = get_user_company_id(auth.uid()));

ALTER TABLE public.company_announcement_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View recipients" ON public.company_announcement_recipients FOR SELECT TO authenticated
USING (public.can_view_announcement(announcement_id, auth.uid()));
CREATE POLICY "Author or admin add recipients" ON public.company_announcement_recipients FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.company_announcements a WHERE a.id = announcement_id
  AND a.company_id = get_user_company_id(auth.uid())
  AND (a.created_by_user_id = auth.uid() OR is_company_admin(auth.uid()) OR is_system_admin(auth.uid())))
  AND get_user_company_id(user_id) = get_user_company_id(auth.uid()));
CREATE POLICY "Author or admin remove recipients" ON public.company_announcement_recipients FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.company_announcements a WHERE a.id = announcement_id
  AND a.company_id = get_user_company_id(auth.uid())
  AND (a.created_by_user_id = auth.uid() OR is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))));

ALTER TABLE public.company_announcement_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View replies" ON public.company_announcement_replies FOR SELECT TO authenticated
USING (is_deleted = false AND public.can_view_announcement(announcement_id, auth.uid()));
CREATE POLICY "Post replies" ON public.company_announcement_replies FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND company_id = get_user_company_id(auth.uid()) AND public.can_view_announcement(announcement_id, auth.uid()));
CREATE POLICY "Author or admin soft-delete replies" ON public.company_announcement_replies FOR UPDATE TO authenticated
USING (company_id = get_user_company_id(auth.uid()) AND (user_id = auth.uid() OR is_company_admin(auth.uid())))
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE OR REPLACE FUNCTION public.touch_announcement_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.company_announcements SET last_activity_at = now() WHERE id = NEW.announcement_id;
  DELETE FROM public.company_announcement_reads WHERE announcement_id = NEW.announcement_id AND user_id <> NEW.user_id;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_touch_announcement_activity AFTER INSERT ON public.company_announcement_replies
FOR EACH ROW EXECUTE FUNCTION public.touch_announcement_activity();

CREATE POLICY "Company read announcement files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'announcement-attachments' AND (storage.foldername(name))[1] = get_user_company_id(auth.uid())::text);
CREATE POLICY "Company upload announcement files" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'announcement-attachments' AND (storage.foldername(name))[1] = get_user_company_id(auth.uid())::text);