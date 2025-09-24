-- Adicionar coluna para vídeos extras ganhos por indicação
ALTER TABLE public.profiles ADD COLUMN extra_videos_available INTEGER DEFAULT 0;

-- Atualizar função handle_new_user para dar vídeos extras ao indicador
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public 
AS $$
DECLARE
  affiliate_code_generated TEXT;
  referrer_user_id UUID;
BEGIN
  -- Generate affiliate code
  affiliate_code_generated := generate_affiliate_code();
  
  -- Insert profile with affiliate code
  INSERT INTO public.profiles (user_id, full_name, affiliate_code)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    affiliate_code_generated
  );
  
  -- Create default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Create affiliate entry
  INSERT INTO public.affiliates (user_id, code, clicks_count, signups_count, rewards_total)
  VALUES (NEW.id, affiliate_code_generated, 0, 0, 0);
  
  -- Create affiliate levels entry
  INSERT INTO public.affiliate_levels (user_id) 
  VALUES (NEW.id);
  
  -- Check if user was referred by someone using user_number
  IF NEW.raw_user_meta_data->>'referred_by' IS NOT NULL THEN
    -- Find referrer by user_number
    SELECT user_id INTO referrer_user_id
    FROM public.profiles 
    WHERE user_number = (NEW.raw_user_meta_data->>'referred_by')::integer;
    
    IF referrer_user_id IS NOT NULL THEN
      -- Update referrer's profile with extra videos (2 videos per referral)
      UPDATE public.profiles 
      SET 
        extra_videos_available = extra_videos_available + 2,
        updated_at = now()
      WHERE user_id = referrer_user_id;
      
      -- Update referred_by in new user's profile
      UPDATE public.profiles 
      SET referred_by = referrer_user_id
      WHERE user_id = NEW.id;
      
      -- Create referral record
      INSERT INTO public.affiliate_referrals (affiliate_user_id, referred_user_id, reward_amount)
      VALUES (referrer_user_id, NEW.id, 10);
      
      -- Update affiliate stats
      UPDATE public.affiliates 
      SET 
        signups_count = signups_count + 1,
        rewards_total = rewards_total + 10
      WHERE user_id = referrer_user_id;
      
      -- Create notification for referrer about extra videos
      INSERT INTO public.notifications (user_id, title, message, type)
      VALUES (
        referrer_user_id,
        'Vídeos Extras Ganhos!',
        'Você ganhou 2 vídeos extras por indicar um novo usuário!',
        'success'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;