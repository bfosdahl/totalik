-- Add module_type column to admin_document_folders for categorizing by module
ALTER TABLE public.admin_document_folders 
ADD COLUMN IF NOT EXISTS module_type TEXT DEFAULT 'ik-hms';

-- Add comment for clarity
COMMENT ON COLUMN public.admin_document_folders.module_type IS 'Module type: ik-hms, ik-mat, ks-bygg';

-- Update existing folders to default module type
UPDATE public.admin_document_folders SET module_type = 'ik-hms' WHERE module_type IS NULL;