-- Enable realtime on existing tables
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.investment_plans REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.affiliate_commissions REPLICA IDENTITY FULL;
ALTER TABLE public.investment_trades REPLICA IDENTITY FULL;
ALTER TABLE public.expert_investment_plans REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.investment_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliate_commissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.investment_trades;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expert_investment_plans;

-- Create crypto_prices table for real crypto data
CREATE TABLE public.crypto_prices (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    price_change_24h NUMERIC DEFAULT 0,
    price_change_percentage_24h NUMERIC DEFAULT 0,
    market_cap NUMERIC DEFAULT 0,
    volume_24h NUMERIC DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(symbol)
);

-- Enable RLS on crypto_prices
ALTER TABLE public.crypto_prices ENABLE ROW LEVEL SECURITY;

-- Create policy for crypto prices (public read access)
CREATE POLICY "Anyone can view crypto prices" 
ON public.crypto_prices 
FOR SELECT 
USING (true);

-- Create policy for admins to manage crypto prices
CREATE POLICY "Admins can manage crypto prices" 
ON public.crypto_prices 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for crypto_prices
ALTER TABLE public.crypto_prices REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crypto_prices;

-- Create investment_returns table for daily returns tracking
CREATE TABLE public.investment_returns (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    investment_plan_id UUID NOT NULL,
    user_id UUID NOT NULL,
    daily_return NUMERIC NOT NULL DEFAULT 0,
    accumulated_return NUMERIC NOT NULL DEFAULT 0,
    return_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(investment_plan_id, return_date)
);

-- Enable RLS on investment_returns
ALTER TABLE public.investment_returns ENABLE ROW LEVEL SECURITY;

-- Create policies for investment_returns
CREATE POLICY "Users can view their own investment returns" 
ON public.investment_returns 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all investment returns" 
ON public.investment_returns 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for investment_returns
ALTER TABLE public.investment_returns REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.investment_returns;

-- Create wallet_history table for detailed wallet tracking
CREATE TABLE public.wallet_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    transaction_type TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    balance_before NUMERIC NOT NULL,
    balance_after NUMERIC NOT NULL,
    description TEXT,
    reference_id UUID,
    reference_table TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on wallet_history
ALTER TABLE public.wallet_history ENABLE ROW LEVEL SECURITY;

-- Create policies for wallet_history
CREATE POLICY "Users can view their own wallet history" 
ON public.wallet_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert wallet history" 
ON public.wallet_history 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can manage all wallet history" 
ON public.wallet_history 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for wallet_history
ALTER TABLE public.wallet_history REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_history;

-- Create activity_log table for user activities
CREATE TABLE public.activity_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on activity_log
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Create policies for activity_log
CREATE POLICY "Users can view their own activity log" 
ON public.activity_log 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all activity logs" 
ON public.activity_log 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for activity_log
ALTER TABLE public.activity_log REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;

-- Create market_data table for real market information
CREATE TABLE public.market_data (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    asset_symbol TEXT NOT NULL,
    asset_name TEXT NOT NULL,
    current_price NUMERIC NOT NULL,
    price_change_24h NUMERIC DEFAULT 0,
    price_change_percentage_24h NUMERIC DEFAULT 0,
    high_24h NUMERIC DEFAULT 0,
    low_24h NUMERIC DEFAULT 0,
    volume_24h NUMERIC DEFAULT 0,
    market_cap NUMERIC DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(asset_symbol)
);

-- Enable RLS on market_data
ALTER TABLE public.market_data ENABLE ROW LEVEL SECURITY;

-- Create policy for market_data (public read access)
CREATE POLICY "Anyone can view market data" 
ON public.market_data 
FOR SELECT 
USING (true);

-- Create policy for admins to manage market data
CREATE POLICY "Admins can manage market data" 
ON public.market_data 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for market_data
ALTER TABLE public.market_data REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.market_data;

-- Function to create wallet history entries
CREATE OR REPLACE FUNCTION public.create_wallet_history_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    old_balance NUMERIC := 0;
    new_balance NUMERIC := 0;
BEGIN
    -- Get old and new balance
    IF TG_OP = 'UPDATE' THEN
        old_balance := OLD.balance;
        new_balance := NEW.balance;
        
        -- Only create history if balance changed
        IF old_balance != new_balance THEN
            INSERT INTO public.wallet_history (
                user_id,
                transaction_type,
                amount,
                balance_before,
                balance_after,
                description
            ) VALUES (
                NEW.user_id,
                CASE 
                    WHEN new_balance > old_balance THEN 'credit'
                    ELSE 'debit'
                END,
                ABS(new_balance - old_balance),
                old_balance,
                new_balance,
                'Balance updated'
            );
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for wallet history on profile balance changes
CREATE TRIGGER trigger_wallet_history_on_balance_change
    AFTER UPDATE OF balance ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.create_wallet_history_entry();

-- Function to update investment returns daily
CREATE OR REPLACE FUNCTION public.calculate_daily_investment_returns()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    investment_record RECORD;
    daily_return_amount NUMERIC;
    new_current_value NUMERIC;
BEGIN
    -- Loop through active investments
    FOR investment_record IN 
        SELECT * FROM investment_plans WHERE status = 'active'
    LOOP
        -- Calculate daily return
        daily_return_amount := investment_record.amount * investment_record.daily_rate;
        new_current_value := COALESCE(investment_record.current_value, investment_record.amount) + daily_return_amount;
        
        -- Update investment current value
        UPDATE investment_plans 
        SET current_value = new_current_value, updated_at = now()
        WHERE id = investment_record.id;
        
        -- Create daily return record
        INSERT INTO investment_returns (
            investment_plan_id,
            user_id,
            daily_return,
            accumulated_return,
            return_date
        ) VALUES (
            investment_record.id,
            investment_record.user_id,
            daily_return_amount,
            new_current_value - investment_record.amount,
            CURRENT_DATE
        ) ON CONFLICT (investment_plan_id, return_date) DO UPDATE SET
            daily_return = EXCLUDED.daily_return,
            accumulated_return = EXCLUDED.accumulated_return;
    END LOOP;
END;
$$;

-- Insert sample crypto prices (real-like data)
INSERT INTO public.crypto_prices (symbol, name, price, price_change_24h, price_change_percentage_24h, market_cap, volume_24h) VALUES
('BTC', 'Bitcoin', 43250.50, 1250.30, 2.98, 847500000000, 28500000000),
('ETH', 'Ethereum', 2650.80, -45.20, -1.68, 318900000000, 15200000000),
('ADA', 'Cardano', 0.485, 0.012, 2.53, 17200000000, 425000000),
('SOL', 'Solana', 98.75, 3.25, 3.40, 42800000000, 2100000000),
('MATIC', 'Polygon', 0.875, -0.025, -2.78, 8100000000, 485000000),
('DOT', 'Polkadot', 7.45, 0.18, 2.48, 9850000000, 185000000),
('AVAX', 'Avalanche', 38.90, 1.15, 3.05, 14200000000, 425000000),
('LINK', 'Chainlink', 14.75, -0.35, -2.32, 8200000000, 285000000)
ON CONFLICT (symbol) DO UPDATE SET
    price = EXCLUDED.price,
    price_change_24h = EXCLUDED.price_change_24h,
    price_change_percentage_24h = EXCLUDED.price_change_percentage_24h,
    market_cap = EXCLUDED.market_cap,
    volume_24h = EXCLUDED.volume_24h,
    last_updated = now();

-- Insert sample market data
INSERT INTO public.market_data (asset_symbol, asset_name, current_price, price_change_24h, price_change_percentage_24h, high_24h, low_24h, volume_24h, market_cap) VALUES
('IBOV', 'Ibovespa', 125750.80, 850.25, 0.68, 126200.00, 124900.50, 12500000000, 0),
('USD/BRL', 'Dólar Americano', 5.15, 0.025, 0.49, 5.18, 5.12, 8500000000, 0),
('EUR/BRL', 'Euro', 5.58, -0.012, -0.21, 5.62, 5.55, 2100000000, 0),
('GOLD', 'Ouro', 2025.50, 12.30, 0.61, 2035.80, 2018.40, 1500000000, 0),
('OIL', 'Petróleo Brent', 82.45, -0.85, -1.02, 83.50, 81.90, 3500000000, 0)
ON CONFLICT (asset_symbol) DO UPDATE SET
    current_price = EXCLUDED.current_price,
    price_change_24h = EXCLUDED.price_change_24h,
    price_change_percentage_24h = EXCLUDED.price_change_percentage_24h,
    high_24h = EXCLUDED.high_24h,
    low_24h = EXCLUDED.low_24h,
    volume_24h = EXCLUDED.volume_24h,
    last_updated = now();