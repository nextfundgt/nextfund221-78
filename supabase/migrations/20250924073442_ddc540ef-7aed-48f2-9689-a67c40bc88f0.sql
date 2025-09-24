-- Criar função para calcular recompensa progressiva de usuários Free
CREATE OR REPLACE FUNCTION public.calculate_free_user_reward(p_user_id uuid, p_video_task_id uuid, p_completion_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_level INTEGER;
  daily_completed INTEGER;
  video_position INTEGER;
  reward_amount NUMERIC;
  current_balance NUMERIC;
  result JSON;
BEGIN
  -- Buscar nível atual do usuário
  SELECT current_level, daily_tasks_completed INTO current_level, daily_completed
  FROM user_levels
  WHERE user_id = p_user_id;
  
  -- Verificar se é usuário Free (level 0)
  IF current_level IS NULL OR current_level > 0 THEN
    RETURN json_build_object('success', false, 'error', 'User is not Free level or level not found');
  END IF;
  
  -- Calcular posição do vídeo (próximo vídeo a ser completado)
  video_position := daily_completed + 1;
  
  -- Verificar se ainda pode assistir vídeos (máximo 8)
  IF video_position > 8 THEN
    RETURN json_build_object('success', false, 'error', 'Daily limit reached');
  END IF;
  
  -- Calcular recompensa baseada na posição
  IF video_position >= 1 AND video_position <= 7 THEN
    reward_amount := 2.00; -- R$ 2,00 para vídeos 1-7
  ELSIF video_position = 8 THEN
    reward_amount := 1.00; -- R$ 1,00 para o 8º vídeo
  ELSE
    reward_amount := 0;
  END IF;
  
  -- Atualizar completion record
  UPDATE user_video_completions
  SET 
    reward_earned = reward_amount,
    vip_bonus_applied = false,
    bonus_amount = 0,
    status = 'completed',
    completed_at = now()
  WHERE id = p_completion_id;
  
  -- Atualizar saldo do usuário
  UPDATE profiles
  SET 
    balance = balance + reward_amount,
    total_video_earnings = total_video_earnings + reward_amount,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Atualizar user_levels
  UPDATE user_levels
  SET 
    daily_tasks_completed = daily_tasks_completed + 1,
    total_tasks_completed = total_tasks_completed + 1,
    total_earnings = total_earnings + reward_amount,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Buscar novo saldo
  SELECT balance INTO current_balance
  FROM profiles
  WHERE user_id = p_user_id;
  
  -- Criar notificação
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (
    p_user_id,
    'Vídeo Concluído!',
    'Você ganhou R$ ' || reward_amount || ' (' || video_position || '/8 vídeos hoje)',
    'success'
  );
  
  RETURN json_build_object(
    'success', true,
    'reward_earned', reward_amount,
    'video_position', video_position,
    'new_balance', current_balance,
    'progress', video_position || '/8'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;