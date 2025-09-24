-- Fix all functions to have proper search_path settings

-- Update generate_affiliate_code function
CREATE OR REPLACE FUNCTION public.generate_affiliate_code()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $$
  SELECT UPPER(LEFT(gen_random_uuid()::text, 8));
$$;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário')
  );
  RETURN NEW;
END;
$$;

-- Update handle_transaction_status_change function
CREATE OR REPLACE FUNCTION public.handle_transaction_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only process when status changes to 'approved'
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Update processed_at
    NEW.processed_at = now();
    
    -- Update user balance
    IF NEW.type = 'deposit' THEN
      UPDATE public.profiles 
      SET balance = balance + NEW.amount, updated_at = now()
      WHERE user_id = NEW.user_id;
    ELSIF NEW.type = 'withdraw' THEN
      -- Check if user has sufficient balance
      IF (SELECT balance FROM public.profiles WHERE user_id = NEW.user_id) >= NEW.amount THEN
        UPDATE public.profiles 
        SET balance = balance - NEW.amount, updated_at = now()
        WHERE user_id = NEW.user_id;
      ELSE
        RAISE EXCEPTION 'Insufficient balance for withdrawal';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;