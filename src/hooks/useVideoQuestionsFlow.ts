import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useVideoQuestions } from './useVideoQuestions';
import { useVideoTasks } from './useVideoTasks';
import { toast } from 'sonner';

export function useVideoQuestionsFlow(videoTaskId: string) {
  const { user } = useAuth();
  const { submitAnswer, questions, hasAnsweredAllQuestions } = useVideoQuestions(videoTaskId);
  const { completeTask, startWatching } = useVideoTasks();
  const [watchSession, setWatchSession] = useState<any>(null);

  const startVideoSession = async () => {
    if (!user || !videoTaskId) return;

    try {
      // Start watching the video task
      const completion = await startWatching(videoTaskId);
      
      // Create watch session
      const { data: session, error } = await supabase
        .from('video_watch_sessions')
        .insert({
          user_id: user.id,
          video_task_id: videoTaskId,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      setWatchSession(session);
      
      return completion;
    } catch (error) {
      console.error('Error starting video session:', error);
      toast.error('Erro ao iniciar sessão do vídeo');
    }
  };

  const completeVideoSession = async (watchDuration: number) => {
    if (!watchSession || !user) return;

    try {
      // Update watch session
      await supabase
        .from('video_watch_sessions')
        .update({
          ended_at: new Date().toISOString(),
          watch_duration: watchDuration,
          is_completed: true
        })
        .eq('id', watchSession.id);

      return watchSession;
    } catch (error) {
      console.error('Error completing video session:', error);
    }
  };

  const handleQuestionAnswer = async (questionId: string, selectedOption: 'a' | 'b') => {
    const result = await submitAnswer(questionId, selectedOption);
    
    // Check if all questions are answered
    if (hasAnsweredAllQuestions() && watchSession) {
      // Complete the video task
      try {
        await completeTask(watchSession.id, videoTaskId);
      } catch (error) {
        console.error('Error completing task:', error);
      }
    }
    
    return result;
  };

  const calculateFreeUserReward = (questionsAnswered: number) => {
    // Deprecated - now handled by calculate_free_user_reward database function
    return 0;
  };

  const processVideoCompletion = async (watchDuration: number) => {
    try {
      if (!user || !videoTaskId || !watchSession) return;

      // Complete video session
      await completeVideoSession(watchDuration);

      // Get user profile to check VIP status
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_vip_level')
        .eq('user_id', user.id)
        .single();

      const isVipUser = profile?.current_vip_level && profile.current_vip_level > 0;

      if (isVipUser) {
        // VIP users get the configured reward using existing function
        const result = await supabase.rpc('handle_video_completion_with_vip', {
          p_user_id: user.id,
          p_video_task_id: videoTaskId,
          p_completion_id: watchSession.id
        });
        
        const resultData = result.data as any;
        if (resultData?.success) {
          toast.success(`Vídeo concluído! Você ganhou R$ ${resultData.reward_earned.toFixed(2)}`);
          return resultData.reward_earned;
        }
      } else {
        // Free users get progressive reward using new function
        const result = await supabase.rpc('calculate_free_user_reward', {
          p_user_id: user.id,
          p_video_task_id: videoTaskId,
          p_completion_id: watchSession.id
        });
        
        const resultData = result.data as any;
        if (resultData?.success) {
          const { reward_earned, video_position } = resultData;
          toast.success(`Vídeo ${video_position}/8 concluído! Você ganhou R$ ${reward_earned.toFixed(2)}`);
          return reward_earned;
        } else {
          toast.error(resultData?.error || 'Erro ao processar vídeo');
          return 0;
        }
      }
      
      return 0;
    } catch (error) {
      console.error('Error processing video completion:', error);
      toast.error('Erro ao processar vídeo');
      return 0;
    }
  };

  return {
    watchSession,
    startVideoSession,
    completeVideoSession,
    handleQuestionAnswer,
    processVideoCompletion,
    hasWatchedFully: watchSession?.is_completed || false
  };
}