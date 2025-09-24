-- Create admin user with credentials
-- Email: admin@nextfund.com
-- Password: admin123

-- Insert admin user into auth.users table
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@nextfund.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Administrador NextFund"}',
  false,
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Get the admin user ID
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Get the admin user ID
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@nextfund.com';
    
    -- Create profile for admin user
    INSERT INTO public.profiles (
        user_id,
        full_name,
        balance,
        affiliate_code
    ) VALUES (
        admin_user_id,
        'Administrador NextFund',
        0,
        'ADMIN001'
    ) ON CONFLICT (user_id) DO NOTHING;
    
    -- Assign admin role
    INSERT INTO public.user_roles (
        user_id,
        role
    ) VALUES (
        admin_user_id,
        'admin'
    ) ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Create affiliate entry
    INSERT INTO public.affiliates (
        user_id,
        code,
        clicks_count,
        signups_count,
        rewards_total
    ) VALUES (
        admin_user_id,
        'ADMIN001',
        0,
        0,
        0
    ) ON CONFLICT (code) DO NOTHING;
END $$;