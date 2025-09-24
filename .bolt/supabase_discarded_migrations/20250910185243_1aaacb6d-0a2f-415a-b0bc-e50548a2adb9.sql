-- RLS Policies for user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

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
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can update transactions" ON public.transactions;

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
DROP POLICY IF EXISTS "Users can manage their own trades" ON public.investment_trades;
DROP POLICY IF EXISTS "Admins can view all trades" ON public.investment_trades;

CREATE POLICY "Users can manage their own trades" 
ON public.investment_trades 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all trades" 
ON public.investment_trades 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for affiliates
DROP POLICY IF EXISTS "Users can view their own affiliate data" ON public.affiliates;
DROP POLICY IF EXISTS "Admins can view all affiliate data" ON public.affiliates;

CREATE POLICY "Users can view their own affiliate data" 
ON public.affiliates 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all affiliate data" 
ON public.affiliates 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for affiliate_referrals
DROP POLICY IF EXISTS "Users can view their own referrals" ON public.affiliate_referrals;
DROP POLICY IF EXISTS "Admins can manage all referrals" ON public.affiliate_referrals;

CREATE POLICY "Users can view their own referrals" 
ON public.affiliate_referrals 
FOR SELECT 
USING (auth.uid() = affiliate_user_id);

CREATE POLICY "Admins can manage all referrals" 
ON public.affiliate_referrals 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Add triggers for updated_at columns
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
DROP TRIGGER IF EXISTS update_investment_trades_updated_at ON public.investment_trades;
DROP TRIGGER IF EXISTS update_affiliates_updated_at ON public.affiliates;
DROP TRIGGER IF EXISTS handle_transaction_approval ON public.transactions;

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