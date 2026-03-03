
-- Poster catalog for IK-MAT
CREATE TABLE public.ik_mat_poster_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  thumbnail_url text,
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ik_mat_poster_catalog ENABLE ROW LEVEL SECURITY;

-- Public read for authenticated users
CREATE POLICY "Authenticated users can view posters"
  ON public.ik_mat_poster_catalog FOR SELECT
  TO authenticated
  USING (true);

-- Only system admins can manage
CREATE POLICY "System admins can manage posters"
  ON public.ik_mat_poster_catalog FOR ALL
  TO authenticated
  USING (public.is_system_admin(auth.uid()));
