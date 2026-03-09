
-- Personalhåndbok chapters table
CREATE TABLE public.personalhandbok_chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  icon TEXT DEFAULT 'FileText',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  version INTEGER NOT NULL DEFAULT 1,
  last_edited_by_id UUID REFERENCES public.profiles(id),
  last_edited_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, slug)
);

-- Employee read confirmations
CREATE TABLE public.personalhandbok_confirmations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  confirmed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  handbook_version INTEGER NOT NULL DEFAULT 1,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.personalhandbok_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personalhandbok_confirmations ENABLE ROW LEVEL SECURITY;

-- RLS for chapters: company members can read, company_admin can write
CREATE POLICY "Users can view chapters in their company"
  ON public.personalhandbok_chapters
  FOR SELECT
  TO authenticated
  USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Company admins can insert chapters"
  ON public.personalhandbok_chapters
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
    AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid()))
  );

CREATE POLICY "Company admins can update chapters"
  ON public.personalhandbok_chapters
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
    AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid()))
  );

CREATE POLICY "Company admins can delete chapters"
  ON public.personalhandbok_chapters
  FOR DELETE
  TO authenticated
  USING (
    company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
    AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid()))
  );

-- System admins can manage chapters for any company
CREATE POLICY "System admins can manage all chapters"
  ON public.personalhandbok_chapters
  FOR ALL
  TO authenticated
  USING (public.is_system_admin(auth.uid()))
  WITH CHECK (public.is_system_admin(auth.uid()));

-- RLS for confirmations
CREATE POLICY "Users can view their own confirmations"
  ON public.personalhandbok_confirmations
  FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Company admins can view all confirmations in company"
  ON public.personalhandbok_confirmations
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
    AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid()))
  );

CREATE POLICY "Users can insert their own confirmation"
  ON public.personalhandbok_confirmations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    AND company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
  );

-- Updated_at trigger
CREATE TRIGGER update_personalhandbok_chapters_updated_at
  BEFORE UPDATE ON public.personalhandbok_chapters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
