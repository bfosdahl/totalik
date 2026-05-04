UPDATE auth.users 
SET encrypted_password = crypt('Abc_1234', gen_salt('bf')),
    updated_at = now()
WHERE email = 'post@fasade-teknikk.no';