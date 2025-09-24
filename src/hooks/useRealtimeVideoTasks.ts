import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

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
  view_count: number;
  is_premium: boolean;
  vip_level_required: number;
  created_by_admin: boolean;
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
  vip_bonus_applied: boolean;
  bonus_amount: number;
  completed_at?: string;
  created_at: string;
}

export const useRealtimeVideoTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<VideoTask[]>([]);
  const [completions, setCompletions] = useState<UserVideoCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch initial data
    const fetchData = async () => {
      try {
        // Fetch only videos created by admin via admin panel
        const { data: tasksData } = await supabase
          .from('video_tasks')
          .select('*')
          .eq('status', 'active')
          .eq('created_by_admin', true)
          .order('created_at', { ascending: false });

        if (tasksData) {
          // Additional client-side validation to ensure only complete admin videos appear
          const validTasks = tasksData.filter(task => 
            task.video_url && 
            task.title && 
            task.reward_amount != null && 
            task.duration_seconds != null &&
            task.duration_seconds > 0 &&
            task.reward_amount > 0
          );
          console.log(`Loaded ${validTasks.length} valid admin videos out of ${tasksData.length} total`);
          setTasks(validTasks);
        }

        // Fetch user completions if user is logged in
        if (user) {
          const { data: completionsData } = await supabase
            .from('user_video_completions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (completionsData) {
            setCompletions(completionsData);
          }
        }
      } catch (error) {
        console.error('Error fetching video tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up realtime subscriptions
    const tasksChannel = supabase
      .channel('video-tasks-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'video_tasks'
        },
        (payload) => {
          console.log('Video task update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newTask = payload.new as VideoTask;
            // Only add if it's a complete admin-created video
            if (newTask.status === 'active' && 
                newTask.created_by_admin &&
                newTask.video_url && 
                newTask.title && 
                newTask.reward_amount != null && 
                newTask.duration_seconds != null &&
                newTask.duration_seconds > 0 &&
                newTask.reward_amount > 0) {
              console.log('Adding new valid admin video:', newTask.title);
              setTasks(prev => [newTask, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedTask = payload.new as VideoTask;
            // Apply same validation for updates
            const isValidTask = updatedTask.status === 'active' && 
                              updatedTask.created_by_admin &&
                              updatedTask.video_url && 
                              updatedTask.title && 
                              updatedTask.reward_amount != null && 
                              updatedTask.duration_seconds != null &&
                              updatedTask.duration_seconds > 0 &&
                              updatedTask.reward_amount > 0;
            
            setTasks(prev => 
              prev.map(task => 
                task.id === updatedTask.id ? updatedTask : task
              ).filter(task => {
                if (task.id === updatedTask.id) {
                  return isValidTask;
                }
                return task.status === 'active' && task.created_by_admin;
              })
            );
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(task => task.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    let completionsChannel;
    if (user) {
      completionsChannel = supabase
        .channel('video-completions-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_video_completions',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Video completion update:', payload);
            
            if (payload.eventType === 'INSERT') {
              setCompletions(prev => [payload.new as UserVideoCompletion, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setCompletions(prev => 
                prev.map(completion => 
                  completion.id === payload.new.id ? payload.new as UserVideoCompletion : completion
                )
              );
            }
          }
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(tasksChannel);
      if (completionsChannel) {
        supabase.removeChannel(completionsChannel);
      }
    };
  }, [user]);

  const getTaskCompletion = (taskId: string) => {
    return completions.find(completion => completion.video_task_id === taskId);
  };

  const getTaskProgress = (taskId: string) => {
    const completion = getTaskCompletion(taskId);
    if (!completion) return 0;
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) return 0;
    
    return Math.min((completion.watch_time_seconds / task.duration_seconds) * 100, 100);
  };

  return {
    tasks,
    completions,
    loading,
    getTaskCompletion,
    getTaskProgress
  };
};