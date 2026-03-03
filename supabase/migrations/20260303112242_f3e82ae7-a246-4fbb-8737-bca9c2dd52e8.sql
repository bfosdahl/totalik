
-- Create trip expenses table
CREATE TABLE public.driving_log_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES public.driving_log_entries(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  company_id uuid REFERENCES public.companies(id) NOT NULL,
  category text NOT NULL DEFAULT 'other',
  description text NOT NULL,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  receipt_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.driving_log_expenses ENABLE ROW LEVEL SECURITY;

-- RLS: users can manage their own expenses
CREATE POLICY "Users can view own expenses"
  ON public.driving_log_expenses FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own expenses"
  ON public.driving_log_expenses FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own expenses"
  ON public.driving_log_expenses FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own expenses"
  ON public.driving_log_expenses FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Storage bucket for receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('driving-log-receipts', 'driving-log-receipts', false);

-- Storage RLS policies
CREATE POLICY "Users can upload receipts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'driving-log-receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own receipts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'driving-log-receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own receipts"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'driving-log-receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
