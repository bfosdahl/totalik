-- Add updated category check constraint with correct values
ALTER TABLE deviations 
ADD CONSTRAINT deviations_category_check 
CHECK (category IN ('quality', 'safety', 'environment', 'documentation', 'other', 'process', 'equipment', 'personnel'));