-- Add is_assigned_to_main column to profiles table
-- This allows employees to be assigned to main company independently from department assignments
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_assigned_to_main boolean DEFAULT true;