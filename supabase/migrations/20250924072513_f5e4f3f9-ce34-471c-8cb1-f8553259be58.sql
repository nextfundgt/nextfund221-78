-- Corrigir funções com search_path inseguro
CREATE OR REPLACE FUNCTION public.validate_video_session(
  session_id uuid,
  required_percentage numeric DEFAULT 80
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  session_record video_watch_sessions%ROWTYPE;
  task_duration integer;
  required_time integer;
  segments_watched integer;
BEGIN
  -- Buscar sessão
  SELECT * INTO session_record 
  FROM video_watch_sessions 
  WHERE id = session_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Buscar duração do vídeo
  SELECT duration_seconds INTO task_duration
  FROM video_tasks 
  WHERE id = session_record.video_task_id;
  
  -- Calcular tempo mínimo necessário
  required_time := (task_duration * required_percentage / 100)::integer;
  
  -- Verificar se assistiu tempo suficiente
  IF session_record.actual_watch_time < required_time THEN
    RETURN false;
  END IF;
  
  -- Verificar se não há sinais de fraude
  IF session_record.is_fraudulent THEN
    RETURN false;
  END IF;
  
  -- Verificar se não teve muitas tentativas de pular
  IF session_record.seek_attempts > 5 THEN
    UPDATE video_watch_sessions 
    SET is_fraudulent = true 
    WHERE id = session_id;
    RETURN false;
  END IF;
  
  -- Verificar se não mudou de aba muitas vezes
  IF session_record.tab_switches > 10 THEN
    UPDATE video_watch_sessions 
    SET is_fraudulent = true 
    WHERE id = session_id;
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Corrigir função reset_daily_video_limits
CREATE OR REPLACE FUNCTION public.reset_daily_video_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Reset daily tasks para todos os usuários
  UPDATE user_levels 
  SET daily_tasks_completed = 0, updated_at = now()
  WHERE daily_tasks_completed > 0;
  
  -- Log da operação
  INSERT INTO admin_audit_log (admin_user_id, action, details)
  VALUES (
    (SELECT id FROM auth.users WHERE email = 'admin@nextfund.com' LIMIT 1),
    'reset_daily_limits',
    jsonb_build_object('reset_at', now(), 'affected_users', 
      (SELECT count(*) FROM user_levels WHERE daily_tasks_completed > 0))
  );
END;
$$;

-- Corrigir função handle_video_completion_with_vip  
CREATE OR REPLACE FUNCTION public.handle_video_completion_with_vip(p_user_id uuid, p_video_task_id uuid, p_completion_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
  FROM video_tasks
  WHERE id = p_video_task_id;
  
  -- Get user VIP level and multiplier
  SELECT 
    COALESCE(p.current_vip_level, 0),
    COALESCE(vp.reward_multiplier, 1.0)
  INTO user_vip_level, vip_multiplier
  FROM profiles p
  LEFT JOIN vip_plans vp ON vp.level = p.current_vip_level AND vp.status = 'active'
  WHERE p.user_id = p_user_id;
  
  -- Calculate final reward with VIP bonus
  final_reward := video_reward * vip_multiplier;
  bonus_amount := final_reward - video_reward;
  
  -- Update completion record
  UPDATE user_video_completions
  SET 
    reward_earned = final_reward,
    vip_bonus_applied = (user_vip_level > 0),
    bonus_amount = bonus_amount,
    status = 'completed',
    completed_at = now()
  WHERE id = p_completion_id;
  
  -- Update user balance and video earnings
  UPDATE profiles
  SET 
    balance = balance + final_reward,
    total_video_earnings = total_video_earnings + final_reward,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Get updated balance
  SELECT balance INTO current_balance
  FROM profiles
  WHERE user_id = p_user_id;
  
  -- Create notification
  INSERT INTO notifications (user_id, title, message, type)
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
$$;