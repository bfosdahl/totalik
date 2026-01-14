-- Add frequency_type column to ik_mat_cleaning_plan_responses
ALTER TABLE public.ik_mat_cleaning_plan_responses 
ADD COLUMN IF NOT EXISTS frequency_type TEXT;