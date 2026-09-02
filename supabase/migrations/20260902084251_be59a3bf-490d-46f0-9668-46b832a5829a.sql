ALTER TABLE public.verneombud_agreements
  ADD COLUMN IF NOT EXISTS signed_externally boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS external_document_path text,
  ADD COLUMN IF NOT EXISTS external_document_name text,
  ADD COLUMN IF NOT EXISTS external_signed_date date;

ALTER TABLE public.verneombud_exemption_agreements
  ADD COLUMN IF NOT EXISTS signed_externally boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS external_document_path text,
  ADD COLUMN IF NOT EXISTS external_document_name text,
  ADD COLUMN IF NOT EXISTS external_signed_date date;