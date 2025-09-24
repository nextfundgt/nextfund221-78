-- Fix security issues by updating function search paths

-- Update promote_user_to_admin function with proper search_path
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Update auto_promote_admin function with proper search_path
CREATE OR REPLACE FUNCTION public.auto_promote_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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