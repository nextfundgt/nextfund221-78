-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Add columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN balance NUMERIC(15,2) DEFAULT 0,
ADD COLUMN avatar_url TEXT,
ADD COLUMN affiliate_code TEXT UNIQUE,
ADD COLUMN referred_by UUID;

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw')),
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  method TEXT DEFAULT 'manual',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create investment_trades table
CREATE TABLE public.investment_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('crypto', 'stock', 'fund', 'fixed')),
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  quantity NUMERIC(15,8) NOT NULL CHECK (quantity > 0),
  price NUMERIC(15,8) NOT NULL CHECK (price > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on investment_trades
ALTER TABLE public.investment_trades ENABLE ROW LEVEL SECURITY;

-- Create affiliates table
CREATE TABLE public.affiliates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  clicks_count INTEGER DEFAULT 0,
  signups_count INTEGER DEFAULT 0,
  rewards_total NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on affiliates
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

-- Create affiliate_referrals table
CREATE TABLE public.affiliate_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_user_id UUID NOT NULL,
  referred_user_id UUID NOT NULL,
  reward_amount NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on affiliate_referrals
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to generate affiliate code
CREATE OR REPLACE FUNCTION public.generate_affiliate_code()
RETURNS TEXT
LANGUAGE SQL
AS $$
  SELECT UPPER(LEFT(gen_random_uuid()::text, 8));
$$;

-- Create function to update balance on transaction approval
CREATE OR REPLACE FUNCTION public.handle_transaction_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions" 
ON public.transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can view all transactions" 
ON public.transactions 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update transactions" 
ON public.transactions 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for investment_trades
CREATE POLICY "Users can manage their own trades" 
ON public.investment_trades 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all trades" 
ON public.investment_trades 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for affiliates
CREATE POLICY "Users can view their own affiliate data" 
ON public.affiliates 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all affiliate data" 
ON public.affiliates 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for affiliate_referrals
CREATE POLICY "Users can view their own referrals" 
ON public.affiliate_referrals 
FOR SELECT 
USING (auth.uid() = affiliate_user_id);

CREATE POLICY "Admins can manage all referrals" 
ON public.affiliate_referrals 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Add triggers for updated_at columns
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_investment_trades_updated_at
BEFORE UPDATE ON public.investment_trades
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_affiliates_updated_at
BEFORE UPDATE ON public.affiliates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for transaction status changes
CREATE TRIGGER handle_transaction_approval
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.handle_transaction_status_change();

-- Enable realtime for tables
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER TABLE public.investment_trades REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.investment_trades;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;