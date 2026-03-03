
-- Table to store completed AI setup responses as fallback for interrupted streams
CREATE TABLE public.ai_setup_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  function_name TEXT NOT NULL, -- 'ik-hms-chat', 'ik-mat-chat', 'ik-alkohol-chat'
  message_hash TEXT NOT NULL, -- hash of the user messages to match request
  response_content TEXT NOT NULL, -- full AI response
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, function_name, message_hash)
);

-- Enable RLS
ALTER TABLE public.ai_setup_responses ENABLE ROW LEVEL SECURITY;

-- Users can read their own company's responses
CREATE POLICY "Users can read own company responses"
ON public.ai_setup_responses
FOR SELECT
TO authenticated
USING (company_id IN (
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
));

-- Edge functions insert via service role, so no INSERT policy needed for users

-- Auto-cleanup old responses (older than 24h) - keep table small
CREATE INDEX idx_ai_setup_responses_lookup 
ON public.ai_setup_responses(company_id, function_name, message_hash);

CREATE INDEX idx_ai_setup_responses_created 
ON public.ai_setup_responses(created_at);
