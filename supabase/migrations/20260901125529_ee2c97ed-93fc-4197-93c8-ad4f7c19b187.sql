ALTER TABLE public.nextcom_processed_orders
  ADD COLUMN IF NOT EXISTS order_comments text,
  ADD COLUMN IF NOT EXISTS org_number text,
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS customer_email text,
  ADD COLUMN IF NOT EXISTS products text,
  ADD COLUMN IF NOT EXISTS order_date timestamptz,
  ADD COLUMN IF NOT EXISTS order_sum numeric,
  ADD COLUMN IF NOT EXISTS seller_user_id text;

CREATE INDEX IF NOT EXISTS idx_nextcom_processed_orders_org_number
  ON public.nextcom_processed_orders (org_number);

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS crm_order_comment text,
  ADD COLUMN IF NOT EXISTS crm_order_comment_at timestamptz,
  ADD COLUMN IF NOT EXISTS crm_last_order_id text;