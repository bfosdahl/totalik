CREATE TABLE public.nextcom_order_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL,
  line_no integer NOT NULL,
  product_name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric,
  line_total numeric,
  price_source text NOT NULL DEFAULT 'unknown',
  is_bht boolean NOT NULL DEFAULT false,
  is_course boolean NOT NULL DEFAULT false,
  is_ik_module boolean NOT NULL DEFAULT false,
  needs_review boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT nextcom_order_lines_order_line_unique UNIQUE (order_id, line_no),
  CONSTRAINT nextcom_order_lines_price_source_check CHECK (price_source IN ('name','catalog','remainder','single','unknown'))
);

GRANT SELECT ON public.nextcom_order_lines TO authenticated;
GRANT ALL ON public.nextcom_order_lines TO service_role;

ALTER TABLE public.nextcom_order_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System admins can manage nextcom order lines"
  ON public.nextcom_order_lines FOR ALL TO authenticated
  USING (public.is_system_admin(auth.uid()))
  WITH CHECK (public.is_system_admin(auth.uid()));

CREATE INDEX idx_nextcom_order_lines_order_id ON public.nextcom_order_lines(order_id);
CREATE INDEX idx_nextcom_order_lines_is_bht ON public.nextcom_order_lines(is_bht);

CREATE TRIGGER update_nextcom_order_lines_updated_at
  BEFORE UPDATE ON public.nextcom_order_lines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.nextcom_product_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  normalized_name text NOT NULL UNIQUE,
  product_name text NOT NULL,
  unit_price numeric NOT NULL,
  sample_count integer NOT NULL DEFAULT 1,
  is_bht boolean NOT NULL DEFAULT false,
  last_seen_order_id text,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.nextcom_product_prices TO authenticated;
GRANT ALL ON public.nextcom_product_prices TO service_role;

ALTER TABLE public.nextcom_product_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System admins can manage nextcom product prices"
  ON public.nextcom_product_prices FOR ALL TO authenticated
  USING (public.is_system_admin(auth.uid()))
  WITH CHECK (public.is_system_admin(auth.uid()));

CREATE TRIGGER update_nextcom_product_prices_updated_at
  BEFORE UPDATE ON public.nextcom_product_prices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.nextcom_processed_orders
  ADD COLUMN IF NOT EXISTS order_notat text,
  ADD COLUMN IF NOT EXISTS nextcom_status_id integer,
  ADD COLUMN IF NOT EXISTS nextcom_status_label text,
  ADD COLUMN IF NOT EXISTS nextcom_status_date timestamptz,
  ADD COLUMN IF NOT EXISTS invoice_state text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS invoiced_at timestamptz,
  ADD COLUMN IF NOT EXISTS lines_synced_at timestamptz;

ALTER TABLE public.nextcom_processed_orders
  ADD CONSTRAINT nextcom_processed_orders_invoice_state_check
  CHECK (invoice_state IN ('pending','skip','invoiced','hold'));

CREATE INDEX IF NOT EXISTS idx_nextcom_processed_orders_invoice_state
  ON public.nextcom_processed_orders(invoice_state);