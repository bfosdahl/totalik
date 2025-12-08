-- Drop the tables and policies that were partially created
DROP TABLE IF EXISTS public.anonymous_message_discussions CASCADE;
DROP TABLE IF EXISTS public.anonymous_messages CASCADE;
DROP FUNCTION IF EXISTS public.generate_anonymous_message_number(UUID);

-- Create table for anonymous messages (whistleblowing/varsling)
CREATE TABLE public.anonymous_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  message_number TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'generelt',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  priority TEXT NOT NULL DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for internal discussion on anonymous messages (between leader and verneombud)
CREATE TABLE public.anonymous_message_discussions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.anonymous_messages(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create function to generate message number
CREATE OR REPLACE FUNCTION public.generate_anonymous_message_number(p_company_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
  v_year TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COUNT(*) + 1 INTO v_count
  FROM anonymous_messages
  WHERE company_id = p_company_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  RETURN 'AM-' || v_year || '-' || LPAD(v_count::TEXT, 3, '0');
END;
$$;

-- Create function to check if user is leader or verneombud
CREATE OR REPLACE FUNCTION public.is_leader_or_verneombud(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    is_company_admin(p_user_id) OR 
    is_system_admin(p_user_id) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = p_user_id AND is_verneombud = true
    )
  );
END;
$$;

-- Enable Row Level Security
ALTER TABLE public.anonymous_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymous_message_discussions ENABLE ROW LEVEL SECURITY;

-- Policy for anonymous messages: Anyone in the company can INSERT (for submitting)
CREATE POLICY "Users can submit anonymous messages to their company"
ON public.anonymous_messages
FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- Policy for viewing: Only company_admin and users with verneombud role can view
CREATE POLICY "Leaders and verneombud can view anonymous messages"
ON public.anonymous_messages
FOR SELECT
USING (
  company_id = get_user_company_id(auth.uid()) AND
  is_leader_or_verneombud(auth.uid())
);

-- Policy for updating status: Only leaders/verneombud
CREATE POLICY "Leaders and verneombud can update anonymous messages"
ON public.anonymous_messages
FOR UPDATE
USING (
  company_id = get_user_company_id(auth.uid()) AND
  is_leader_or_verneombud(auth.uid())
);

-- Policy for discussions: Leaders and verneombud can read and write
CREATE POLICY "Leaders and verneombud can view discussions"
ON public.anonymous_message_discussions
FOR SELECT
USING (
  company_id = get_user_company_id(auth.uid()) AND
  is_leader_or_verneombud(auth.uid())
);

CREATE POLICY "Leaders and verneombud can add discussions"
ON public.anonymous_message_discussions
FOR INSERT
WITH CHECK (
  company_id = get_user_company_id(auth.uid()) AND
  is_leader_or_verneombud(auth.uid())
);

-- Add is_verneombud column to profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'is_verneombud'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_verneombud BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add is_hms_responsible column to profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'is_hms_responsible'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_hms_responsible BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create index for faster queries
CREATE INDEX idx_anonymous_messages_company ON public.anonymous_messages(company_id);
CREATE INDEX idx_anonymous_messages_status ON public.anonymous_messages(status);
CREATE INDEX idx_anonymous_message_discussions_message ON public.anonymous_message_discussions(message_id);

-- Create trigger for updating updated_at
CREATE TRIGGER update_anonymous_messages_updated_at
BEFORE UPDATE ON public.anonymous_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();