-- Add break/pause tracking columns to time_clock_entries
ALTER TABLE time_clock_entries
ADD COLUMN IF NOT EXISTS break_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS break_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_break_minutes INTEGER DEFAULT 0;