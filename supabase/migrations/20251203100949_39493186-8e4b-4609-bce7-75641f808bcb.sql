-- Add 'egenkontroller' category for auto-generated checklist PDFs
-- Note: The category column is currently TEXT type, so we just need to ensure the hook supports it

-- Add a column to track which checklist/sja generated this document (for linking)
ALTER TABLE public.ks_project_documents 
ADD COLUMN IF NOT EXISTS source_type TEXT,
ADD COLUMN IF NOT EXISTS source_id UUID;

-- Add index for faster lookup
CREATE INDEX IF NOT EXISTS idx_ks_project_documents_source 
ON public.ks_project_documents(source_type, source_id);

COMMENT ON COLUMN public.ks_project_documents.source_type IS 'Type of source that generated this document: checklist, sja, vernerunde';
COMMENT ON COLUMN public.ks_project_documents.source_id IS 'ID of the source record that generated this document';