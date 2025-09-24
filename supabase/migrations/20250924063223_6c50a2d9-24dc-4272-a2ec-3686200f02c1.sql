-- Create payment gateways table for dynamic PIX providers
CREATE TABLE public.payment_gateways (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  api_endpoint TEXT,
  required_fields JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user payment preferences
CREATE TABLE public.user_payment_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  preferred_gateway_id UUID REFERENCES public.payment_gateways(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create video watch sessions for tracking
CREATE TABLE public.video_watch_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_task_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  watch_duration INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false
);

-- Enable RLS on new tables
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_payment_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_watch_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_gateways
CREATE POLICY "Admins can manage payment gateways" 
ON public.payment_gateways 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view active payment gateways" 
ON public.payment_gateways 
FOR SELECT 
USING (is_active = true);

-- RLS Policies for user_payment_preferences
CREATE POLICY "Users can manage their own payment preferences" 
ON public.user_payment_preferences 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payment preferences" 
ON public.user_payment_preferences 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for video_watch_sessions
CREATE POLICY "Users can manage their own watch sessions" 
ON public.video_watch_sessions 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all watch sessions" 
ON public.video_watch_sessions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at triggers
CREATE TRIGGER update_payment_gateways_updated_at
BEFORE UPDATE ON public.payment_gateways
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_payment_preferences_updated_at
BEFORE UPDATE ON public.user_payment_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default PushinPay gateway
INSERT INTO public.payment_gateways (name, provider, required_fields, is_active, priority)
VALUES (
  'PushinPay',
  'pushinpay',
  '["cpf", "email", "name"]'::jsonb,
  true,
  1
);