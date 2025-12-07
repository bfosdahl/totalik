-- Make ks-module2-files bucket private
UPDATE storage.buckets SET public = false WHERE name = 'ks-module2-files';