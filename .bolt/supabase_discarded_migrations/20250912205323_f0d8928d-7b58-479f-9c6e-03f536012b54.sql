-- Create multi-level affiliate commissions table
CREATE TABLE public.affiliate_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_user_id UUID NOT NULL,
  referred_user_id UUID NOT NULL,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 3),
  commission_rate NUMERIC NOT NULL,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  transaction_amount NUMERIC NOT NULL,
  transaction_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own commissions" 
ON public.affiliate_commissions 
FOR SELECT 
USING (auth.uid() = affiliate_user_id);

CREATE POLICY "Admins can manage all commissions" 
ON public.affiliate_commissions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create affiliate levels tracking table
CREATE TABLE public.affiliate_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  level_1_count INTEGER DEFAULT 0,
  level_2_count INTEGER DEFAULT 0,
  level_3_count INTEGER DEFAULT 0,
  level_1_earnings NUMERIC DEFAULT 0,
  level_2_earnings NUMERIC DEFAULT 0,
  level_3_earnings NUMERIC DEFAULT 0,
  total_earnings NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.affiliate_levels ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own levels" 
ON public.affiliate_levels 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own levels" 
ON public.affiliate_levels 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own levels" 
ON public.affiliate_levels 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all levels" 
ON public.affiliate_levels 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updating timestamps
CREATE TRIGGER update_affiliate_commissions_updated_at
BEFORE UPDATE ON public.affiliate_commissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_affiliate_levels_updated_at
BEFORE UPDATE ON public.affiliate_levels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate multi-level commissions
CREATE OR REPLACE FUNCTION public.calculate_affiliate_commissions(
  p_referred_user_id UUID,
  p_transaction_amount NUMERIC,
  p_transaction_type TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_user_id UUID := p_referred_user_id;
  level_count INTEGER := 1;
  commission_rate NUMERIC;
  commission_amount NUMERIC;
  affiliate_user_id UUID;
BEGIN
  -- Traverse up the affiliate chain for 3 levels
  WHILE level_count <= 3 AND current_user_id IS NOT NULL LOOP
    -- Get the affiliate who referred this user
    SELECT referred_by INTO affiliate_user_id
    FROM profiles 
    WHERE user_id = current_user_id;
    
    -- If no affiliate found, break the loop
    IF affiliate_user_id IS NULL THEN
      EXIT;
    END IF;
    
    -- Set commission rate based on level
    IF level_count = 1 THEN
      commission_rate := 0.08; -- 8%
    ELSIF level_count = 2 THEN
      commission_rate := 0.03; -- 3%
    ELSIF level_count = 3 THEN
      commission_rate := 0.015; -- 1.5%
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
    
    -- Update level earnings
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
    END IF;
    
    -- Move to next level
    current_user_id := affiliate_user_id;
    level_count := level_count + 1;
  END LOOP;
END;
$$;