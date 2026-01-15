-- Add work_schedule_id to time_entries to link planned shifts with time registration
ALTER TABLE public.time_entries 
ADD COLUMN IF NOT EXISTS work_schedule_id UUID REFERENCES public.work_schedules(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_time_entries_work_schedule_id ON public.time_entries(work_schedule_id);

-- Add source field if not exists to track where entry came from
ALTER TABLE public.time_entries 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'qr_clock', 'work_schedule'));