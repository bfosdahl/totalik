
-- ============================================================================
-- FASE 1: Personalliste (Skatteetaten) + Arbeidstid (Arbeidstilsynet)
-- ============================================================================

-- 1) Bedriftsinnstillinger for personalliste og pauseregler
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS personalliste_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS break_policy_paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS break_policy_default_minutes integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS break_policy_description text;

-- 2) Innkvartering (bolig) på ansatt-profil (Arbeidstilsynet spør om dette)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS accommodation_provided boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accommodation_address text;

-- 3) Fnr/D-nummer i separat tabell med streng RLS (kun eier + admin)
CREATE TABLE IF NOT EXISTS public.profiles_national_id (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  national_id text NOT NULL,
  id_type text NOT NULL DEFAULT 'fnr' CHECK (id_type IN ('fnr','dnr','passport')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles_national_id TO authenticated;
GRANT ALL ON public.profiles_national_id TO service_role;
ALTER TABLE public.profiles_national_id ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner or admin can view national id"
  ON public.profiles_national_id FOR SELECT TO authenticated
  USING (
    public.is_system_admin(auth.uid())
    OR (public.is_company_admin(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()))
    OR profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin can insert national id"
  ON public.profiles_national_id FOR INSERT TO authenticated
  WITH CHECK (
    public.is_system_admin(auth.uid())
    OR (public.is_company_admin(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()))
  );

CREATE POLICY "Admin can update national id"
  ON public.profiles_national_id FOR UPDATE TO authenticated
  USING (
    public.is_system_admin(auth.uid())
    OR (public.is_company_admin(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()))
  );

CREATE POLICY "Admin can delete national id"
  ON public.profiles_national_id FOR DELETE TO authenticated
  USING (
    public.is_system_admin(auth.uid())
    OR (public.is_company_admin(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()))
  );

CREATE TRIGGER update_profiles_national_id_updated_at
  BEFORE UPDATE ON public.profiles_national_id
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Utvide time_clock_entries for innleide/gjester + endringslogg-flagg
ALTER TABLE public.time_clock_entries
  ADD COLUMN IF NOT EXISTS is_guest_worker boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS guest_name text,
  ADD COLUMN IF NOT EXISTS guest_national_id text,
  ADD COLUMN IF NOT EXISTS guest_employer text,
  ADD COLUMN IF NOT EXISTS guest_role text,
  ADD COLUMN IF NOT EXISTS break_paid boolean,
  ADD COLUMN IF NOT EXISTS edited_by uuid,
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS edit_reason text;

-- Tillat gjeste-innslag uten user_id (innleid/vikar)
ALTER TABLE public.time_clock_entries ALTER COLUMN user_id DROP NOT NULL;

-- 5) Flere pauser per skift (Arbeidstilsynet vil se pauser per person per dag)
CREATE TABLE IF NOT EXISTS public.time_clock_breaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.time_clock_entries(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  break_start timestamptz NOT NULL DEFAULT now(),
  break_end timestamptz,
  is_paid boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.time_clock_breaks TO authenticated;
GRANT ALL ON public.time_clock_breaks TO service_role;
ALTER TABLE public.time_clock_breaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own or admin company breaks"
  ON public.time_clock_breaks FOR SELECT TO authenticated
  USING (
    public.is_system_admin(auth.uid())
    OR (public.is_company_admin(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()))
    OR EXISTS (
      SELECT 1 FROM public.time_clock_entries e
      WHERE e.id = entry_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Insert own or admin breaks"
  ON public.time_clock_breaks FOR INSERT TO authenticated
  WITH CHECK (
    public.is_system_admin(auth.uid())
    OR (public.is_company_admin(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()))
    OR EXISTS (
      SELECT 1 FROM public.time_clock_entries e
      WHERE e.id = entry_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Update own active or admin breaks"
  ON public.time_clock_breaks FOR UPDATE TO authenticated
  USING (
    public.is_system_admin(auth.uid())
    OR (public.is_company_admin(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()))
    OR EXISTS (
      SELECT 1 FROM public.time_clock_entries e
      WHERE e.id = entry_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can delete breaks"
  ON public.time_clock_breaks FOR DELETE TO authenticated
  USING (
    public.is_system_admin(auth.uid())
    OR (public.is_company_admin(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()))
  );

CREATE INDEX IF NOT EXISTS idx_time_clock_breaks_entry ON public.time_clock_breaks(entry_id);
CREATE INDEX IF NOT EXISTS idx_time_clock_breaks_company ON public.time_clock_breaks(company_id);

CREATE TRIGGER update_time_clock_breaks_updated_at
  BEFORE UPDATE ON public.time_clock_breaks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6) Audit trigger på time_clock_entries (kreves for elektronisk personalliste)
DROP TRIGGER IF EXISTS audit_time_clock_entries ON public.time_clock_entries;
CREATE TRIGGER audit_time_clock_entries
  AFTER INSERT OR UPDATE OR DELETE ON public.time_clock_entries
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change_generic();

DROP TRIGGER IF EXISTS audit_time_clock_breaks ON public.time_clock_breaks;
CREATE TRIGGER audit_time_clock_breaks
  AFTER INSERT OR UPDATE OR DELETE ON public.time_clock_breaks
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change_generic();

-- 7) Oppdater RLS på time_clock_entries til å tillate gjestestempling av admin
DROP POLICY IF EXISTS "Admin can insert guest clock entries" ON public.time_clock_entries;
CREATE POLICY "Admin can insert guest clock entries"
  ON public.time_clock_entries FOR INSERT TO authenticated
  WITH CHECK (
    is_guest_worker = true
    AND (
      public.is_system_admin(auth.uid())
      OR (public.is_company_admin(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()))
    )
  );
