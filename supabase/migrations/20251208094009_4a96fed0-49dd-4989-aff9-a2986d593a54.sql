-- Create rate limiting table for AI chat functions
CREATE TABLE IF NOT EXISTS public.ai_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  function_name TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX idx_ai_rate_limits_user_function ON public.ai_rate_limits(user_id, function_name, window_start);

-- Enable RLS
ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can only see their own rate limit records
CREATE POLICY "Users can view their own rate limits"
ON public.ai_rate_limits
FOR SELECT
USING (auth.uid() = user_id);

-- Service role and edge functions can manage all records
CREATE POLICY "Service role manages rate limits"
ON public.ai_rate_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- Create cleanup function to remove old rate limit records (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.ai_rate_limits 
  WHERE window_start < now() - interval '1 hour';
END;
$$;

-- Create function to check and increment rate limit
-- Returns true if request is allowed, false if rate limited
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_function_name TEXT,
  p_max_requests INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_count INTEGER;
  v_window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate window start
  v_window_start := date_trunc('minute', now());
  
  -- Get current request count for this window
  SELECT request_count INTO v_current_count
  FROM public.ai_rate_limits
  WHERE user_id = p_user_id
    AND function_name = p_function_name
    AND window_start >= v_window_start - (p_window_minutes || ' minutes')::interval
  ORDER BY window_start DESC
  LIMIT 1;
  
  -- If no record exists or count is under limit, allow request
  IF v_current_count IS NULL THEN
    INSERT INTO public.ai_rate_limits (user_id, function_name, request_count, window_start)
    VALUES (p_user_id, p_function_name, 1, v_window_start);
    RETURN true;
  ELSIF v_current_count < p_max_requests THEN
    UPDATE public.ai_rate_limits
    SET request_count = request_count + 1
    WHERE user_id = p_user_id
      AND function_name = p_function_name
      AND window_start >= v_window_start - (p_window_minutes || ' minutes')::interval;
    RETURN true;
  ELSE
    -- Rate limited
    RETURN false;
  END IF;
END;
$$;