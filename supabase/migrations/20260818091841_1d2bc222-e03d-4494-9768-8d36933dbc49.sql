ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS license_months integer,
  ADD COLUMN IF NOT EXISTS license_start_date date,
  ADD COLUMN IF NOT EXISTS license_months_manual boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS termination_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS scheduled_termination_date date,
  ADD COLUMN IF NOT EXISTS termination_source text,
  ADD COLUMN IF NOT EXISTS termination_order_id text,
  ADD COLUMN IF NOT EXISTS termination_warning_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS terminated_at timestamptz,
  ADD COLUMN IF NOT EXISTS termination_note text;

CREATE INDEX IF NOT EXISTS idx_companies_scheduled_termination
  ON public.companies (scheduled_termination_date)
  WHERE scheduled_termination_date IS NOT NULL;
