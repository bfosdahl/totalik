-- Set temporary password for Robin Sundsbø (one-off admin action)
UPDATE auth.users
SET encrypted_password = crypt('Abc_1234', gen_salt('bf')),
    updated_at = now()
WHERE id = '0bbcfdf6-78cb-4f0d-acb6-f8af96f5a561';