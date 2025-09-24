-- Create function to handle investment transactions atomically
CREATE OR REPLACE FUNCTION public.create_investment_transaction(
  p_user_id uuid,
  p_plan_type text,
  p_amount numeric,
  p_duration_days integer,
  p_daily_rate numeric
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance numeric;
  projected_total numeric;
  investment_id uuid;
  result json;
BEGIN
  -- Lock the user's profile for update to prevent race conditions
  SELECT balance INTO current_balance
  FROM profiles 
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Check if user exists
  IF current_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User profile not found');
  END IF;
  
  -- Check if user has sufficient balance
  IF current_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;
  
  -- Calculate projected total
  projected_total := p_amount * POWER(1 + p_daily_rate, p_duration_days);
  
  -- Update user balance
  UPDATE profiles 
  SET balance = balance - p_amount, updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Create investment plan
  INSERT INTO investment_plans (
    user_id, plan_type, amount, duration_days, daily_rate, 
    current_value, projected_total, status
  ) VALUES (
    p_user_id, p_plan_type, p_amount, p_duration_days, p_daily_rate,
    p_amount, projected_total, 'active'
  ) RETURNING id INTO investment_id;
  
  -- Create notification
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (
    p_user_id,
    'Investimento Criado',
    'Seu investimento no plano ' || p_plan_type || ' de R$ ' || p_amount || ' foi ativado com sucesso!',
    'success'
  );
  
  RETURN json_build_object(
    'success', true, 
    'investment_id', investment_id,
    'new_balance', current_balance - p_amount
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Create function to validate withdrawal transactions
CREATE OR REPLACE FUNCTION public.validate_withdrawal_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance numeric;
BEGIN
  -- Only validate withdrawals
  IF NEW.type != 'withdraw' THEN
    RETURN NEW;
  END IF;
  
  -- Get current balance
  SELECT balance INTO current_balance
  FROM profiles 
  WHERE user_id = NEW.user_id;
  
  -- Check if user has sufficient balance for withdrawal
  IF current_balance < NEW.amount THEN
    RAISE EXCEPTION 'Insufficient balance for withdrawal. Current balance: %, Requested: %', current_balance, NEW.amount;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for withdrawal validation
CREATE TRIGGER validate_withdrawal_before_insert
  BEFORE INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION validate_withdrawal_transaction();