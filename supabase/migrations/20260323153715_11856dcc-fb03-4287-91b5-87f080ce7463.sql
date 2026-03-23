-- Add deleted_at column for soft-delete tracking
ALTER TABLE public.profiles ADD COLUMN deleted_at timestamptz DEFAULT NULL;

-- Index for efficient filtering
CREATE INDEX idx_profiles_deleted_at ON public.profiles (deleted_at) WHERE deleted_at IS NOT NULL;