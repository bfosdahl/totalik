-- Add signature_data column to profiles table for storing employee signatures
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS signature_data TEXT;

-- Add comment explaining the column purpose
COMMENT ON COLUMN public.profiles.signature_data IS 'Base64 encoded signature image (PNG data URL) for digital signing';