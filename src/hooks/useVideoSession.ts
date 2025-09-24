import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface TimeSegment {
  start: number;
  end: number;
}

interface VideoSessionState {
  sessionId: string | null;
  actualWatchTime: number;
  watchedSegments: TimeSegment[];
  pauseCount: number;
  tabSwitches: number;
  seekAttempts: number;
  lastValidPosition: number;
  isValidForReward: boolean;
  minimumRequiredTime: number;
  isFraudulent: boolean;
}

interface UseVideoSessionProps {
  videoTaskId: string;
  videoDuration: number;
  requiredPercentage?: number;
}

export function useVideoSession({ 
  videoTaskId, 
  videoDuration, 
  requiredPercentage = 80 
}: UseVideoSessionProps) {
  const { user } = useAuth();
  const [sessionState, setSessionState] = useState<VideoSessionState>({
    sessionId: null,
    actualWatchTime: 0,
    watchedSegments: [],
    pauseCount: 0,
    tabSwitches: 0,
    seekAttempts: 0,
    lastValidPosition: 0,
    isValidForReward: false,
    minimumRequiredTime: Math.floor(videoDuration * requiredPercentage / 100),
    isFraudulent: false
  });

  const [isVisible, setIsVisible] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const lastHeartbeat = useRef<number>(Date.now());
  const sessionStartTime = useRef<number>(0);

  // Iniciar sessão de vídeo
  const startSession = useCallback(async () => {
    if (!user || !videoTaskId) return null;

    try {
      // Verificar se já existe uma sessão incompleta
      const { data: existingSession } = await supabase
        .from('video_watch_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('video_task_id', videoTaskId)
        .eq('is_completed', false)
        .maybeSingle();

      let session;
      if (existingSession) {
        // Continuar sessão existente
        session = existingSession;
        setSessionState(prev => ({
          ...prev,
          sessionId: session.id,
          actualWatchTime: session.actual_watch_time || 0,
          watchedSegments: session.watched_segments || [],
          pauseCount: session.pause_count || 0,
          tabSwitches: session.tab_switches || 0,
          seekAttempts: session.seek_attempts || 0,
          lastValidPosition: session.last_valid_position || 0,
          isFraudulent: session.is_fraudulent || false
        }));
        
        toast.info('Continuando de onde você parou...');
      } else {
        // Criar nova sessão
        const { data: newSession, error } = await supabase
          .from('video_watch_sessions')
          .insert({
            user_id: user.id,
            video_task_id: videoTaskId,
            started_at: new Date().toISOString(),
            minimum_required_time: Math.floor(videoDuration * requiredPercentage / 100)
          })
          .select()
          .single();

        if (error) throw error;
        session = newSession;
        setSessionState(prev => ({
          ...prev,
          sessionId: session.id
        }));
      }

      sessionStartTime.current = Date.now();
      return session;
    } catch (error) {
      console.error('Error starting video session:', error);
      toast.error('Erro ao iniciar sessão do vídeo');
      return null;
    }
  }, [user, videoTaskId, videoDuration, requiredPercentage]);

  // Heartbeat para verificar atividade
  const startHeartbeat = useCallback(() => {
    if (heartbeatInterval.current) return;

    heartbeatInterval.current = setInterval(async () => {
      if (!sessionState.sessionId || !isPlaying || !isVisible) return;

      const now = Date.now();
      const timeSinceLastHeartbeat = now - lastHeartbeat.current;
      
      // Se passou muito tempo desde o último heartbeat, pode ser fraude
      if (timeSinceLastHeartbeat > 15000) { // 15 segundos
        setSessionState(prev => ({ ...prev, isFraudulent: true }));
        await updateSessionData({ is_fraudulent: true });
        toast.warning('Comportamento suspeito detectado');
        return;
      }

      lastHeartbeat.current = now;
      
      // Atualizar sessão no banco
      if (isPlaying && isVisible) {
        const watchTimeIncrement = Math.min(10, timeSinceLastHeartbeat / 1000);
        setSessionState(prev => ({
          ...prev,
          actualWatchTime: prev.actualWatchTime + watchTimeIncrement
        }));

        await updateSessionData({
          actual_watch_time: sessionState.actualWatchTime + watchTimeIncrement
        });
      }
    }, 10000); // A cada 10 segundos
  }, [sessionState.sessionId, isPlaying, isVisible]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
  }, []);

  // Atualizar dados da sessão
  const updateSessionData = useCallback(async (updates: any) => {
    if (!sessionState.sessionId) return;

    try {
      await supabase
        .from('video_watch_sessions')
        .update(updates)
        .eq('id', sessionState.sessionId);
    } catch (error) {
      console.error('Error updating session:', error);
    }
  }, [sessionState.sessionId]);

  // Detectar mudança de aba/janela
  useEffect(() => {
    const handleVisibilityChange = async () => {
      const wasVisible = isVisible;
      const nowVisible = !document.hidden;
      setIsVisible(nowVisible);

      if (wasVisible && !nowVisible) {
        // Saiu da aba
        setSessionState(prev => ({
          ...prev,
          tabSwitches: prev.tabSwitches + 1
        }));
        
        await updateSessionData({
          tab_switches: sessionState.tabSwitches + 1
        });
        
        if (sessionState.tabSwitches > 10) {
          setSessionState(prev => ({ ...prev, isFraudulent: true }));
          await updateSessionData({ is_fraudulent: true });
          toast.error('Muitas mudanças de aba detectadas - sessão invalidada');
        }
      }
    };

    const handleBeforeUnload = async () => {
      // Salvar progresso antes de fechar
      if (sessionState.sessionId) {
        await updateSessionData({
          actual_watch_time: sessionState.actualWatchTime,
          last_valid_position: sessionState.lastValidPosition
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isVisible, sessionState, updateSessionData]);

  // Controlar reprodução
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    startHeartbeat();
  }, [startHeartbeat]);

  const handlePause = useCallback(async () => {
    setIsPlaying(false);
    stopHeartbeat();
    
    setSessionState(prev => ({
      ...prev,
      pauseCount: prev.pauseCount + 1
    }));
    
    await updateSessionData({
      pause_count: sessionState.pauseCount + 1
    });
  }, [stopHeartbeat, updateSessionData, sessionState.pauseCount]);

  // Controlar seek (pular partes do vídeo)
  const handleSeek = useCallback(async (newPosition: number) => {
    const canSeek = newPosition <= sessionState.lastValidPosition + 5; // Permite 5s de antecipação
    
    if (!canSeek) {
      setSessionState(prev => ({
        ...prev,
        seekAttempts: prev.seekAttempts + 1
      }));
      
      await updateSessionData({
        seek_attempts: sessionState.seekAttempts + 1
      });
      
      if (sessionState.seekAttempts >= 5) {
        setSessionState(prev => ({ ...prev, isFraudulent: true }));
        await updateSessionData({ is_fraudulent: true });
        toast.error('Muitas tentativas de pular detectadas - sessão invalidada');
      } else {
        toast.warning('Não é possível pular partes do vídeo');
      }
      
      return false;
    }
    
    return true;
  }, [sessionState.lastValidPosition, sessionState.seekAttempts, updateSessionData]);

  // Atualizar posição válida
  const updateValidPosition = useCallback(async (position: number) => {
    if (position > sessionState.lastValidPosition) {
      setSessionState(prev => ({
        ...prev,
        lastValidPosition: position
      }));
      
      await updateSessionData({
        last_valid_position: position
      });
    }
  }, [sessionState.lastValidPosition, updateSessionData]);

  // Completar sessão
  const completeSession = useCallback(async (): Promise<boolean> => {
    if (!sessionState.sessionId) return false;

    try {
      // Validar sessão no servidor
      const { data: isValid } = await supabase.rpc('validate_video_session', {
        session_id: sessionState.sessionId,
        required_percentage: requiredPercentage
      });

      if (!isValid) {
        toast.error('Sessão inválida - requisitos não atendidos');
        return false;
      }

      // Completar sessão
      await supabase
        .from('video_watch_sessions')
        .update({
          ended_at: new Date().toISOString(),
          is_completed: true,
          watch_duration: Math.floor((Date.now() - sessionStartTime.current) / 1000)
        })
        .eq('id', sessionState.sessionId);

      setSessionState(prev => ({ 
        ...prev, 
        isValidForReward: true 
      }));

      stopHeartbeat();
      return true;
    } catch (error) {
      console.error('Error completing session:', error);
      toast.error('Erro ao completar sessão');
      return false;
    }
  }, [sessionState.sessionId, requiredPercentage, stopHeartbeat]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopHeartbeat();
    };
  }, [stopHeartbeat]);

  return {
    sessionState,
    isVisible,
    isPlaying,
    startSession,
    handlePlay,
    handlePause,
    handleSeek,
    updateValidPosition,
    completeSession,
    canReceiveReward: sessionState.isValidForReward && !sessionState.isFraudulent
  };
}