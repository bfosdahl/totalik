
-- Internal employee messaging table
CREATE TABLE public.employee_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_messages ENABLE ROW LEVEL SECURITY;

-- Sender can see their sent messages
CREATE POLICY "Users can view messages they sent"
  ON public.employee_messages FOR SELECT
  USING (sender_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Recipient can see messages sent to them
CREATE POLICY "Users can view messages received"
  ON public.employee_messages FOR SELECT
  USING (recipient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Users can send messages within their company
CREATE POLICY "Users can send messages"
  ON public.employee_messages FOR INSERT
  WITH CHECK (
    company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
    AND sender_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Recipients can mark messages as read
CREATE POLICY "Recipients can update read status"
  ON public.employee_messages FOR UPDATE
  USING (recipient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Sender can delete their own messages
CREATE POLICY "Senders can delete messages"
  ON public.employee_messages FOR DELETE
  USING (sender_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Index for fast lookups
CREATE INDEX idx_employee_messages_recipient ON public.employee_messages(recipient_id, is_read, created_at DESC);
CREATE INDEX idx_employee_messages_sender ON public.employee_messages(sender_id, created_at DESC);
CREATE INDEX idx_employee_messages_company ON public.employee_messages(company_id);
