CREATE TABLE public.nextcom_processed_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'success',
  result jsonb,
  error_message text,
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.nextcom_processed_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System admins can manage processed orders"
  ON public.nextcom_processed_orders
  FOR ALL
  TO authenticated
  USING (public.is_system_admin(auth.uid()))
  WITH CHECK (public.is_system_admin(auth.uid()));

CREATE INDEX idx_nextcom_processed_orders_order_id ON public.nextcom_processed_orders(order_id);
CREATE INDEX idx_nextcom_processed_orders_status ON public.nextcom_processed_orders(status);