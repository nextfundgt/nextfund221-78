-- Expand affiliate_levels table to support 10 levels
ALTER TABLE public.affiliate_levels 
ADD COLUMN IF NOT EXISTS level_4_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS level_5_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS level_6_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS level_7_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS level_8_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS level_9_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS level_10_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS level_4_earnings numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS level_5_earnings numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS level_6_earnings numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS level_7_earnings numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS level_8_earnings numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS level_9_earnings numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS level_10_earnings numeric DEFAULT 0;

-- Update calculate_affiliate_commissions function to handle 10 levels
CREATE OR REPLACE FUNCTION public.calculate_affiliate_commissions(p_referred_user_id uuid, p_transaction_amount numeric, p_transaction_type text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id UUID := p_referred_user_id;
  level_count INTEGER := 1;
  commission_rate NUMERIC;
  commission_amount NUMERIC;
  affiliate_user_id UUID;
BEGIN
  -- Traverse up the affiliate chain for 10 levels
  WHILE level_count <= 10 AND current_user_id IS NOT NULL LOOP
    -- Get the affiliate who referred this user
    SELECT referred_by INTO affiliate_user_id
    FROM profiles 
    WHERE user_id = current_user_id;
    
    -- If no affiliate found, break the loop
    IF affiliate_user_id IS NULL THEN
      EXIT;
    END IF;
    
    -- Set commission rate based on level (decreasing rates)
    IF level_count = 1 THEN
      commission_rate := 0.08; -- 8%
    ELSIF level_count = 2 THEN
      commission_rate := 0.06; -- 6%
    ELSIF level_count = 3 THEN
      commission_rate := 0.04; -- 4%
    ELSIF level_count = 4 THEN
      commission_rate := 0.03; -- 3%
    ELSIF level_count = 5 THEN
      commission_rate := 0.025; -- 2.5%
    ELSIF level_count = 6 THEN
      commission_rate := 0.02; -- 2%
    ELSIF level_count = 7 THEN
      commission_rate := 0.015; -- 1.5%
    ELSIF level_count = 8 THEN
      commission_rate := 0.01; -- 1%
    ELSIF level_count = 9 THEN
      commission_rate := 0.008; -- 0.8%
    ELSIF level_count = 10 THEN
      commission_rate := 0.005; -- 0.5%
    END IF;
    
    -- Calculate commission amount
    commission_amount := p_transaction_amount * commission_rate;
    
    -- Insert commission record
    INSERT INTO affiliate_commissions (
      affiliate_user_id,
      referred_user_id,
      level,
      commission_rate,
      commission_amount,
      transaction_amount,
      transaction_type,
      status
    ) VALUES (
      affiliate_user_id,
      p_referred_user_id,
      level_count,
      commission_rate,
      commission_amount,
      p_transaction_amount,
      p_transaction_type,
      'approved'
    );
    
    -- Update affiliate levels tracking
    INSERT INTO affiliate_levels (user_id) 
    VALUES (affiliate_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Update level earnings and counts based on level
    IF level_count = 1 THEN
      UPDATE affiliate_levels 
      SET level_1_earnings = level_1_earnings + commission_amount,
          total_earnings = total_earnings + commission_amount,
          updated_at = now()
      WHERE user_id = affiliate_user_id;
    ELSIF level_count = 2 THEN
      UPDATE affiliate_levels 
      SET level_2_earnings = level_2_earnings + commission_amount,
          total_earnings = total_earnings + commission_amount,
          updated_at = now()
      WHERE user_id = affiliate_user_id;
    ELSIF level_count = 3 THEN
      UPDATE affiliate_levels 
      SET level_3_earnings = level_3_earnings + commission_amount,
          total_earnings = total_earnings + commission_amount,
          updated_at = now()
      WHERE user_id = affiliate_user_id;
    ELSIF level_count = 4 THEN
      UPDATE affiliate_levels 
      SET level_4_earnings = level_4_earnings + commission_amount,
          total_earnings = total_earnings + commission_amount,
          updated_at = now()
      WHERE user_id = affiliate_user_id;
    ELSIF level_count = 5 THEN
      UPDATE affiliate_levels 
      SET level_5_earnings = level_5_earnings + commission_amount,
          total_earnings = total_earnings + commission_amount,
          updated_at = now()
      WHERE user_id = affiliate_user_id;
    ELSIF level_count = 6 THEN
      UPDATE affiliate_levels 
      SET level_6_earnings = level_6_earnings + commission_amount,
          total_earnings = total_earnings + commission_amount,
          updated_at = now()
      WHERE user_id = affiliate_user_id;
    ELSIF level_count = 7 THEN
      UPDATE affiliate_levels 
      SET level_7_earnings = level_7_earnings + commission_amount,
          total_earnings = total_earnings + commission_amount,
          updated_at = now()
      WHERE user_id = affiliate_user_id;
    ELSIF level_count = 8 THEN
      UPDATE affiliate_levels 
      SET level_8_earnings = level_8_earnings + commission_amount,
          total_earnings = total_earnings + commission_amount,
          updated_at = now()
      WHERE user_id = affiliate_user_id;
    ELSIF level_count = 9 THEN
      UPDATE affiliate_levels 
      SET level_9_earnings = level_9_earnings + commission_amount,
          total_earnings = total_earnings + commission_amount,
          updated_at = now()
      WHERE user_id = affiliate_user_id;
    ELSIF level_count = 10 THEN
      UPDATE affiliate_levels 
      SET level_10_earnings = level_10_earnings + commission_amount,
          total_earnings = total_earnings + commission_amount,
          updated_at = now()
      WHERE user_id = affiliate_user_id;
    END IF;
    
    -- Move to next level
    current_user_id := affiliate_user_id;
    level_count := level_count + 1;
  END LOOP;
END;
$function$