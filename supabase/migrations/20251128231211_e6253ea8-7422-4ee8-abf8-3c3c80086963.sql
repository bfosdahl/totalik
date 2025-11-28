-- Add include_in_report flag to ks_project_documents
ALTER TABLE ks_project_documents 
ADD COLUMN include_in_report BOOLEAN DEFAULT false;

-- Update category enum to include new categories
-- Note: We can't directly alter enum, so we'll allow any string value
-- The constraint is only enforced in the application layer

COMMENT ON COLUMN ks_project_documents.category IS 'Document category: tegninger, beskrivelser, sha_plan, bilder, endringsmeldinger, fdv, samsvar, kompetanse, maler';
COMMENT ON COLUMN ks_project_documents.include_in_report IS 'Flag to include this document in the generated project report PDF';