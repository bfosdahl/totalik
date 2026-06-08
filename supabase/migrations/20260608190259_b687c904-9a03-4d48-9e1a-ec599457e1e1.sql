ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hourly_rate numeric(10,2);
COMMENT ON COLUMN public.profiles.hourly_rate IS 'Timesats i NOK for lønnsgrunnlag-beregning';