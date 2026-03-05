ALTER TABLE public.driving_log_entries 
ADD COLUMN status text NOT NULL DEFAULT 'completed';

-- Update RLS policies to include the new column (existing policies should still work)