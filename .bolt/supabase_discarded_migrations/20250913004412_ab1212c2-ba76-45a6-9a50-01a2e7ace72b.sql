-- Fix affiliate code generation system

-- Update the handle_new_user function to generate affiliate codes and create affiliate entries
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  affiliate_code_generated TEXT;
BEGIN
  -- Generate affiliate code
  affiliate_code_generated := generate_affiliate_code();
  
  -- Insert profile with affiliate code
  INSERT INTO public.profiles (user_id, full_name, affiliate_code)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    affiliate_code_generated
  );
  
  -- Create default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Create affiliate entry
  INSERT INTO public.affiliates (user_id, code, clicks_count, signups_count, rewards_total)
  VALUES (NEW.id, affiliate_code_generated, 0, 0, 0);
  
  -- Create affiliate levels entry
  INSERT INTO public.affiliate_levels (user_id) 
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$function$;

-- Create function to fix existing users without affiliate codes
CREATE OR REPLACE FUNCTION public.fix_existing_users_affiliate_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  user_record RECORD;
  affiliate_code_generated TEXT;
BEGIN
  -- Loop through users without affiliate codes
  FOR user_record IN 
    SELECT user_id FROM profiles WHERE affiliate_code IS NULL
  LOOP
    -- Generate affiliate code
    affiliate_code_generated := generate_affiliate_code();
    
    -- Update profile with affiliate code
    UPDATE profiles 
    SET affiliate_code = affiliate_code_generated, updated_at = now()
    WHERE user_id = user_record.user_id;
    
    -- Create affiliate entry if it doesn't exist
    INSERT INTO affiliates (user_id, code, clicks_count, signups_count, rewards_total)
    VALUES (user_record.user_id, affiliate_code_generated, 0, 0, 0)
    ON CONFLICT (user_id) DO UPDATE SET code = affiliate_code_generated;
    
    -- Create affiliate levels entry if it doesn't exist
    INSERT INTO affiliate_levels (user_id) 
    VALUES (user_record.user_id)
    ON CONFLICT (user_id) DO NOTHING;
  END LOOP;
END;
$function$;

-- Fix existing users
SELECT fix_existing_users_affiliate_codes();

-- Ensure the trigger exists (recreate it if needed)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();