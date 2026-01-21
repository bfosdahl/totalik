-- Remove the temp_password column from ks_module2_project_access
-- This column stored plaintext passwords which is a security vulnerability
-- The system now uses secure password reset links instead

ALTER TABLE ks_module2_project_access 
DROP COLUMN IF EXISTS temp_password;