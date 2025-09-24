-- Melhorar tabela video_watch_sessions para tracking detalhado
ALTER TABLE video_watch_sessions 
ADD COLUMN IF NOT EXISTS actual_watch_time integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS pause_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS tab_switches integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS seek_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_fraudulent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_valid_position integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS watched_segments jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS minimum_required_time integer DEFAULT 0;

-- Função para validar sessão de vídeo
CREATE OR REPLACE FUNCTION validate_video_session(
  session_id uuid,
  required_percentage numeric DEFAULT 80
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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