-- Create VIP plans table
CREATE TABLE public.vip_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  level INTEGER NOT NULL UNIQUE,
  benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
  video_access_level INTEGER NOT NULL DEFAULT 0,
  daily_video_limit INTEGER NOT NULL DEFAULT 10,
  reward_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user VIP subscriptions table
CREATE TABLE public.user_vip_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vip_plan_id UUID NOT NULL REFERENCES public.vip_plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add VIP fields to video_tasks table
ALTER TABLE public.video_tasks 
ADD COLUMN vip_level_required INTEGER DEFAULT 0,
ADD COLUMN is_premium BOOLEAN DEFAULT false,
ADD COLUMN view_count INTEGER DEFAULT 0;

-- Add VIP tracking to user_video_completions
ALTER TABLE public.user_video_completions
ADD COLUMN vip_bonus_applied BOOLEAN DEFAULT false,
ADD COLUMN bonus_amount NUMERIC DEFAULT 0;

-- Add VIP status to profiles
ALTER TABLE public.profiles
ADD COLUMN current_vip_level INTEGER DEFAULT 0,
ADD COLUMN vip_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN total_video_earnings NUMERIC DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE public.vip_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vip_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for vip_plans
CREATE POLICY "Everyone can view active VIP plans" 
ON public.vip_plans 
FOR SELECT 
USING (status = 'active');

CREATE POLICY "Admins can manage VIP plans" 
ON public.vip_plans 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create policies for user_vip_subscriptions
CREATE POLICY "Users can view their own VIP subscriptions" 
ON public.user_vip_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own VIP subscriptions" 
ON public.user_vip_subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all VIP subscriptions" 
ON public.user_vip_subscriptions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default VIP plans
INSERT INTO public.vip_plans (name, price, level, benefits, video_access_level, daily_video_limit, reward_multiplier) VALUES
('VIP 1', 150.00, 1, '["Acesso a vídeos premium", "Limite diário aumentado", "Bônus de 20% nos ganhos"]'::jsonb, 1, 15, 1.2),
('VIP 2', 250.00, 2, '["Acesso a todos os vídeos", "Limite diário ilimitado", "Bônus de 50% nos ganhos", "Suporte prioritário"]'::jsonb, 2, 25, 1.5),
('VIP 3', 350.00, 3, '["Acesso total", "Vídeos exclusivos", "Bônus de 100% nos ganhos", "Suporte VIP", "Cashback mensal"]'::jsonb, 3, 50, 2.0);

-- Create function to update VIP status
CREATE OR REPLACE FUNCTION public.update_user_vip_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile VIP level based on active subscription
  UPDATE public.profiles 
  SET 
    current_vip_level = (
      SELECT COALESCE(MAX(vp.level), 0)
      FROM public.user_vip_subscriptions uvs
      JOIN public.vip_plans vp ON uvs.vip_plan_id = vp.id
      WHERE uvs.user_id = NEW.user_id 
        AND uvs.status = 'active' 
        AND uvs.expires_at > now()
    ),
    vip_expires_at = (
      SELECT MAX(uvs.expires_at)
      FROM public.user_vip_subscriptions uvs
      WHERE uvs.user_id = NEW.user_id 
        AND uvs.status = 'active' 
        AND uvs.expires_at > now()
    ),
    updated_at = now()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for VIP status updates
CREATE TRIGGER update_vip_status_trigger
AFTER INSERT OR UPDATE ON public.user_vip_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_user_vip_status();

-- Create function to handle video completion with VIP bonuses
CREATE OR REPLACE FUNCTION public.handle_video_completion_with_vip(
  p_user_id UUID,
  p_video_task_id UUID,
  p_completion_id UUID
) RETURNS JSON AS $$
DECLARE
  video_reward NUMERIC;
  user_vip_level INTEGER;
  vip_multiplier NUMERIC;
  final_reward NUMERIC;
  bonus_amount NUMERIC;
  current_balance NUMERIC;
  result JSON;
BEGIN
  -- Get video reward amount
  SELECT reward_amount INTO video_reward
  FROM public.video_tasks
  WHERE id = p_video_task_id;
  
  -- Get user VIP level and multiplier
  SELECT 
    COALESCE(p.current_vip_level, 0),
    COALESCE(vp.reward_multiplier, 1.0)
  INTO user_vip_level, vip_multiplier
  FROM public.profiles p
  LEFT JOIN public.vip_plans vp ON vp.level = p.current_vip_level AND vp.status = 'active'
  WHERE p.user_id = p_user_id;
  
  -- Calculate final reward with VIP bonus
  final_reward := video_reward * vip_multiplier;
  bonus_amount := final_reward - video_reward;
  
  -- Update completion record
  UPDATE public.user_video_completions
  SET 
    reward_earned = final_reward,
    vip_bonus_applied = (user_vip_level > 0),
    bonus_amount = bonus_amount,
    status = 'completed',
    completed_at = now()
  WHERE id = p_completion_id;
  
  -- Update user balance and video earnings
  UPDATE public.profiles
  SET 
    balance = balance + final_reward,
    total_video_earnings = total_video_earnings + final_reward,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Get updated balance
  SELECT balance INTO current_balance
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  -- Create notification
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    p_user_id,
    'Vídeo Concluído!',
    'Você ganhou R$ ' || final_reward || 
    CASE WHEN bonus_amount > 0 THEN ' (incluindo bônus VIP de R$ ' || bonus_amount || ')' ELSE '' END,
    'success'
  );
  
  RETURN json_build_object(
    'success', true,
    'reward_earned', final_reward,
    'bonus_amount', bonus_amount,
    'new_balance', current_balance,
    'vip_level', user_vip_level
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create storage buckets for videos and thumbnails
INSERT INTO storage.buckets (id, name, public) VALUES 
('videos', 'videos', false),
('thumbnails', 'thumbnails', true);

-- Create storage policies for videos
CREATE POLICY "Admin can upload videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'videos' AND 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admin can update videos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'videos' AND 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admin can delete videos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'videos' AND 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Authenticated users can view videos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'videos' AND 
  auth.uid() IS NOT NULL
);

-- Create storage policies for thumbnails
CREATE POLICY "Admin can upload thumbnails" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'thumbnails' AND 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admin can update thumbnails" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'thumbnails' AND 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admin can delete thumbnails" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'thumbnails' AND 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Everyone can view thumbnails" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'thumbnails');

-- Create trigger for automatic updated_at
CREATE TRIGGER update_vip_plans_updated_at
BEFORE UPDATE ON public.vip_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_vip_subscriptions_updated_at
BEFORE UPDATE ON public.user_vip_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();