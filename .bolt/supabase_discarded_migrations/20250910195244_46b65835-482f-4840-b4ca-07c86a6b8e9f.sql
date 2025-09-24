-- Create investment_plans table for Beefund-style investment system
CREATE TABLE public.investment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('starter', 'premium', 'vip')),
  amount DECIMAL(12,2) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_days INTEGER NOT NULL,
  daily_rate DECIMAL(6,4) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  current_value DECIMAL(12,2) DEFAULT NULL,
  projected_total DECIMAL(12,2) DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create support_tickets table
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  response TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.investment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for investment_plans
CREATE POLICY "Users can view their own investment plans" 
ON public.investment_plans 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own investment plans" 
ON public.investment_plans 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investment plans" 
ON public.investment_plans 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all investment plans" 
ON public.investment_plans 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all investment plans" 
ON public.investment_plans 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for notifications  
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notifications" 
ON public.notifications 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for support_tickets
CREATE POLICY "Users can view their own support tickets" 
ON public.support_tickets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own support tickets" 
ON public.support_tickets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own support tickets" 
ON public.support_tickets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all support tickets" 
ON public.support_tickets 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at columns
CREATE TRIGGER update_investment_plans_updated_at
BEFORE UPDATE ON public.investment_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default investment plans configuration
INSERT INTO public.investment_plans (user_id, plan_type, amount, duration_days, daily_rate, status) VALUES
  ('00000000-0000-0000-0000-000000000000', 'starter', 100, 15, 0.03, 'cancelled'),
  ('00000000-0000-0000-0000-000000000000', 'premium', 500, 30, 0.04, 'cancelled'), 
  ('00000000-0000-0000-0000-000000000000', 'vip', 2000, 60, 0.05, 'cancelled')
ON CONFLICT DO NOTHING;