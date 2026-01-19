-- Add Tripletex sync tracking columns to time_entries table
ALTER TABLE public.time_entries 
ADD COLUMN IF NOT EXISTS tripletex_synced boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS tripletex_synced_at timestamp with time zone;