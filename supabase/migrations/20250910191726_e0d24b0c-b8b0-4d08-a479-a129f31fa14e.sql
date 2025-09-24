-- Create function to promote user to admin
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Get user ID from auth.users by email
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = user_email;
  
  -- Check if user exists
  IF target_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Insert or update user role to admin
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN true;
END;
$$;

-- Auto-promote specific admin emails
CREATE OR REPLACE FUNCTION public.auto_promote_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Auto-promote admin emails
  IF NEW.email IN ('admin@nextfund.com', 'administrador@nextfund.com') THEN
    -- Wait a moment for the profile to be created by the other trigger
    PERFORM pg_sleep(0.1);
    
    -- Add admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-promote admin users
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_promote_admin();