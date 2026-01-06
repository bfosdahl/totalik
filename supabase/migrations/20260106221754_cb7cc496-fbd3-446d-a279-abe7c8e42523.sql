-- Add status column to profiles for user approval workflow
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending_approval';

-- Add check constraint for valid statuses
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_status_check 
CHECK (status IN ('pending_approval', 'active', 'suspended'));

-- Update existing users to be active (they were already using the system)
UPDATE public.profiles SET status = 'active' WHERE status = 'pending_approval';

-- Create index for faster status queries
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- Comment for documentation
COMMENT ON COLUMN public.profiles.status IS 'User account status: pending_approval (awaiting admin approval), active (can use system), suspended (access revoked)';