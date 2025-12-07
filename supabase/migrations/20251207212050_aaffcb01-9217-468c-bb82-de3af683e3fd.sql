-- Make sensitive photo/document buckets private
UPDATE storage.buckets SET public = false WHERE name = 'deviation-attachments';
UPDATE storage.buckets SET public = false WHERE name = 'ks-module2-avvik-photos';
UPDATE storage.buckets SET public = false WHERE name = 'ks-module2-checklist-photos';
UPDATE storage.buckets SET public = false WHERE name = 'inspection-photos';

-- Note: ks-module2-files is already being accessed with createSignedUrl in some places
-- We'll leave it as-is for now since it may have mixed usage