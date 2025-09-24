-- Enable realtime on existing tables (only if not already done)
DO $$ 
BEGIN
    -- Enable REPLICA IDENTITY FULL for tables that need realtime
    ALTER TABLE public.notifications REPLICA IDENTITY FULL;
    ALTER TABLE public.investment_plans REPLICA IDENTITY FULL;
    ALTER TABLE public.profiles REPLICA IDENTITY FULL;
    ALTER TABLE public.affiliate_commissions REPLICA IDENTITY FULL;
    ALTER TABLE public.investment_trades REPLICA IDENTITY FULL;
    ALTER TABLE public.expert_investment_plans REPLICA IDENTITY FULL;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Some tables already have REPLICA IDENTITY FULL: %', SQLERRM;
END $$;

-- Add tables to realtime publication if not already added
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    EXCEPTION WHEN duplicate_object THEN
        -- Table already in publication, ignore
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.investment_plans;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliate_commissions;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.investment_trades;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.expert_investment_plans;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;

-- Create crypto_prices table for real crypto data
CREATE TABLE IF NOT EXISTS public.crypto_prices (
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

-- Create policies for crypto_prices if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'crypto_prices' 
        AND policyname = 'Anyone can view crypto prices'
    ) THEN
        CREATE POLICY "Anyone can view crypto prices" 
        ON public.crypto_prices 
        FOR SELECT 
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'crypto_prices' 
        AND policyname = 'Admins can manage crypto prices'
    ) THEN
        CREATE POLICY "Admins can manage crypto prices" 
        ON public.crypto_prices 
        FOR ALL 
        USING (has_role(auth.uid(), 'admin'::app_role));
    END IF;
END $$;

-- Enable realtime for crypto_prices
ALTER TABLE public.crypto_prices REPLICA IDENTITY FULL;

DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.crypto_prices;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;

-- Create investment_returns table for daily returns tracking
CREATE TABLE IF NOT EXISTS public.investment_returns (
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
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'investment_returns' 
        AND policyname = 'Users can view their own investment returns'
    ) THEN
        CREATE POLICY "Users can view their own investment returns" 
        ON public.investment_returns 
        FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'investment_returns' 
        AND policyname = 'Admins can manage all investment returns'
    ) THEN
        CREATE POLICY "Admins can manage all investment returns" 
        ON public.investment_returns 
        FOR ALL 
        USING (has_role(auth.uid(), 'admin'::app_role));
    END IF;
END $$;

-- Enable realtime for investment_returns
ALTER TABLE public.investment_returns REPLICA IDENTITY FULL;

DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.investment_returns;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;

-- Create wallet_history table for detailed wallet tracking
CREATE TABLE IF NOT EXISTS public.wallet_history (
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
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'wallet_history' 
        AND policyname = 'Users can view their own wallet history'
    ) THEN
        CREATE POLICY "Users can view their own wallet history" 
        ON public.wallet_history 
        FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'wallet_history' 
        AND policyname = 'System can insert wallet history'
    ) THEN
        CREATE POLICY "System can insert wallet history" 
        ON public.wallet_history 
        FOR INSERT 
        WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'wallet_history' 
        AND policyname = 'Admins can manage all wallet history'
    ) THEN
        CREATE POLICY "Admins can manage all wallet history" 
        ON public.wallet_history 
        FOR ALL 
        USING (has_role(auth.uid(), 'admin'::app_role));
    END IF;
END $$;

-- Enable realtime for wallet_history
ALTER TABLE public.wallet_history REPLICA IDENTITY FULL;

DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_history;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;

-- Insert real crypto prices data
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