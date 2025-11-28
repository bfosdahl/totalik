-- Drop existing category check constraint
ALTER TABLE deviations 
DROP CONSTRAINT IF EXISTS deviations_category_check;

-- Add project_id column to deviations table
ALTER TABLE deviations 
ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES ks_projects(id) ON DELETE CASCADE;