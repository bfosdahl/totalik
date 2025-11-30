-- Add photo_paths column to ks_safety_round_results table
ALTER TABLE ks_safety_round_results
ADD COLUMN IF NOT EXISTS photo_paths text[];

COMMENT ON COLUMN ks_safety_round_results.photo_paths IS 'Array of file paths to photos taken during safety round inspection for this checkpoint';