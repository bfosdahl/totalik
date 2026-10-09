ALTER TABLE public.user_departments
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();