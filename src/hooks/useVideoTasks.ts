import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VideoTask {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration_seconds: number;
  reward_amount: number;
  category: string;
  status: string;
  is_premium?: boolean;
  vip_level_required?: number;
  view_count?: number;
  created_at: string;
  updated_at: string;
}

interface UserVideoCompletion {
  id: string;
  user_id: string;
  video_task_id: string;
  status: string;
  watch_time_seconds: number;
  reward_earned: number;
  completed_at?: string;
  created_at: string;
}

export function useVideoTasks() {
  const [tasks, setTasks] = useState<VideoTask[]>([]);
  const [completions, setCompletions] = useState<UserVideoCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      // Using any to bypass TypeScript errors until migration is approved
      const { data, error } = await (supabase as any)
        .from('video_tasks')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks((data as VideoTask[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar tarefas');
    }
  };

  const fetchCompletions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Using any to bypass TypeScript errors until migration is approved
      const { data, error } = await (supabase as any)
        .from('user_video_completions')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setCompletions((data as UserVideoCompletion[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar progresso');
    }
  };

  const startWatching = async (taskId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Check if already started
      const existingCompletion = completions.find(c => c.video_task_id === taskId);
      if (existingCompletion) {
        return existingCompletion;
      }

      // Increment view count
      const { data: currentTask } = await (supabase as any)
        .from('video_tasks')
        .select('view_count')
        .eq('id', taskId)
        .single();
      
      if (currentTask) {
        await (supabase as any)
          .from('video_tasks')
          .update({ view_count: (currentTask.view_count || 0) + 1 })
          .eq('id', taskId);
      }

      // Using any to bypass TypeScript errors until migration is approved
      const { data, error } = await (supabase as any)
        .from('user_video_completions')
        .insert([
          {
            user_id: user.id,
            video_task_id: taskId,
            status: 'in_progress',
            watch_time_seconds: 0,
            reward_earned: 0
          }
        ])
        .select()
        .single();

      if (error) throw error;
      setCompletions(prev => [...prev, data as UserVideoCompletion]);
      
      // Refresh tasks to get updated view count
      await fetchTasks();
      
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao iniciar tarefa');
    }
  };

  const updateProgress = async (completionId: string, watchTimeSeconds: number) => {
    try {
      // Using any to bypass TypeScript errors until migration is approved
      const { data, error } = await (supabase as any)
        .from('user_video_completions')
        .update({ 
          watch_time_seconds: watchTimeSeconds,
          status: 'in_progress'
        })
        .eq('id', completionId)
        .select()
        .single();

      if (error) throw error;
      setCompletions(prev => 
        prev.map(comp => comp.id === completionId ? data as UserVideoCompletion : comp)
      );
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao atualizar progresso');
    }
  };

  const completeTask = async (completionId: string, taskId: string) => {
    try {
      // Get task details for reward amount
      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Tarefa não encontrada');

      // Using any to bypass TypeScript errors until migration is approved
      const { data, error } = await (supabase as any)
        .from('user_video_completions')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          reward_earned: task.reward_amount
        })
        .eq('id', completionId)
        .select()
        .single();

      if (error) throw error;
      setCompletions(prev => 
        prev.map(comp => comp.id === completionId ? data as UserVideoCompletion : comp)
      );
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao completar tarefa');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTasks(), fetchCompletions()]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    tasks,
    completions,
    loading,
    error,
    startWatching,
    updateProgress,
    completeTask,
    refetch: () => Promise.all([fetchTasks(), fetchCompletions()])
  };
}