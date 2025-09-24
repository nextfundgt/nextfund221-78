import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserLevel {
  id: string;
  user_id: string;
  current_level: number;
  total_tasks_completed: number;
  daily_tasks_completed: number;
  total_earnings: number;
  level_progress: number;
  daily_limit: number;
  commission_rate: number;
  created_at: string;
  updated_at: string;
}

const LEVEL_CONFIG = [
  { level: 0, title: 'Iniciante (Free)', dailyLimit: 5, commissionRate: 5.00, color: 'bg-slate-500' }, // Free: 5 vídeos por dia, R$15 total
  { level: 1, title: 'Bronze', dailyLimit: 15, commissionRate: 6.00, color: 'bg-amber-600' },
  { level: 2, title: 'Prata', dailyLimit: 20, commissionRate: 7.00, color: 'bg-slate-400' },
  { level: 3, title: 'Ouro', dailyLimit: 25, commissionRate: 8.00, color: 'bg-yellow-500' },
  { level: 4, title: 'Platina', dailyLimit: 30, commissionRate: 9.00, color: 'bg-purple-500' },
  { level: 5, title: 'Diamante', dailyLimit: 35, commissionRate: 10.00, color: 'bg-blue-500' },
];

export const useRealtimeUserLevel = () => {
  const { user } = useAuth();
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch initial user level data
    const fetchUserLevel = async () => {
      try {
        const { data } = await supabase
          .from('user_levels')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          setUserLevel(data);
        } else {
          // Create initial user level if doesn't exist
          const { data: newLevel } = await supabase
            .from('user_levels')
            .insert({
              user_id: user.id,
              current_level: 0,
              total_tasks_completed: 0,
              daily_tasks_completed: 0,
              total_earnings: 0,
              level_progress: 0,
              daily_limit: 5, // Free users têm limite de 5 vídeos por dia
              commission_rate: 5.00
            })
            .select()
            .single();

          if (newLevel) {
            setUserLevel(newLevel);
          }
        }
      } catch (error) {
        console.error('Error fetching user level:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserLevel();

    // Set up realtime subscription
    const channel = supabase
      .channel('user-level-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_levels',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('User level update:', payload);
          
          if (payload.eventType === 'UPDATE') {
            setUserLevel(payload.new as UserLevel);
          } else if (payload.eventType === 'INSERT') {
            setUserLevel(payload.new as UserLevel);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getLevelInfo = (level: number) => {
    return LEVEL_CONFIG.find(config => config.level === level) || LEVEL_CONFIG[0];
  };

  const getNextLevelInfo = (level: number) => {
    return LEVEL_CONFIG.find(config => config.level === level + 1);
  };

  const canCompleteMoreTasks = () => {
    if (!userLevel) return false;
    return userLevel.daily_tasks_completed < userLevel.daily_limit;
  };

  const getProgressToNextLevel = () => {
    if (!userLevel) return 0;
    const tasksForNextLevel = (userLevel.current_level + 1) * 10; // 10 tasks per level
    const currentProgress = userLevel.total_tasks_completed % 10;
    return (currentProgress / 10) * 100;
  };

  return {
    userLevel,
    loading,
    getLevelInfo,
    getNextLevelInfo,
    canCompleteMoreTasks,
    getProgressToNextLevel
  };
};