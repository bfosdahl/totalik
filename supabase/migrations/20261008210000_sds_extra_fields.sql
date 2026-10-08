-- Additive SDS fields. Already applied to the live database; IF NOT EXISTS keeps a replay safe.
alter table public.ik_hms_stoffkartotek
  add column if not exists cas_numbers jsonb not null default '[]'::jsonb,
  add column if not exists hazard_statements jsonb not null default '[]'::jsonb,
  add column if not exists signal_word text,
  add column if not exists revision_date date,
  add column if not exists emergency_phone text,
  add column if not exists pictograms text[] not null default '{}';

alter table public.global_chemicals
  add column if not exists cas_numbers jsonb not null default '[]'::jsonb,
  add column if not exists hazard_statements jsonb not null default '[]'::jsonb,
  add column if not exists signal_word text,
  add column if not exists revision_date date,
  add column if not exists emergency_phone text,
  add column if not exists pictograms text[] not null default '{}';
