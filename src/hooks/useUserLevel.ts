import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserLevel {
  id: string;
  user_id: string;
  current_level: number;
  daily_tasks_completed: number;
  total_tasks_completed: number;
  total_earnings: number;
  level_progress: number;
  daily_limit: number;
  commission_rate: number;
  created_at: string;
  updated_at: string;
}

const LEVEL_CONFIG = [
  { level: 0, title: 'Iniciante', dailyLimit: 5, commissionRate: 5.0, color: 'text-gray-400' },
  { level: 1, title: 'Bronze Trader', dailyLimit: 8, commissionRate: 6.0, color: 'text-amber-600' },
  { level: 2, title: 'Silver Investor', dailyLimit: 12, commissionRate: 7.5, color: 'text-gray-300' },
  { level: 3, title: 'Gold Expert', dailyLimit: 15, commissionRate: 9.0, color: 'text-yellow-400' },
  { level: 4, title: 'Platinum Master', dailyLimit: 20, commissionRate: 11.0, color: 'text-cyan-400' },
  { level: 5, title: 'Diamond Elite', dailyLimit: 25, commissionRate: 13.5, color: 'text-blue-400' },
];

export function useUserLevel() {
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserLevel = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found in fetchUserLevel');
        return;
      }

      console.log('Fetching user level for user:', user.id);

      const { data, error } = await supabase
        .from('user_levels')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('User level query result:', { data, error });

      if (error) {
        console.error('Error fetching user level:', error);
        throw error;
      }

      if (!data) {
        console.log('No user level data found, creating new one');
        // User level doesn't exist, create it
        await createUserLevel(user.id);
        return;
      }

      console.log('Setting user level:', data);
      setUserLevel(data as UserLevel);
    } catch (err) {
      console.error('fetchUserLevel error:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar nível');
    }
  };

  const createUserLevel = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_levels')
        .insert([
          {
            user_id: userId,
            current_level: 0,
            daily_tasks_completed: 0,
            total_tasks_completed: 0,
            total_earnings: 0,
            level_progress: 0,
            daily_limit: 5,
            commission_rate: 5.0
          }
        ])
        .select()
        .single();

      if (error) throw error;
      setUserLevel(data as UserLevel);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar nível');
    }
  };

  const incrementTasksCompleted = async (rewardAmount: number) => {
    if (!userLevel) return;

    try {
      const newTotalTasks = userLevel.total_tasks_completed + 1;
      const newDailyTasks = userLevel.daily_tasks_completed + 1;
      const newTotalEarnings = userLevel.total_earnings + rewardAmount;
      
      // Calculate level progression (10 tasks per level)
      const newLevel = Math.floor(newTotalTasks / 10);
      const levelConfig = LEVEL_CONFIG[Math.min(newLevel, LEVEL_CONFIG.length - 1)];
      const levelProgress = (newTotalTasks % 10) * 10; // Progress in percentage

      const { data, error } = await supabase
        .from('user_levels')
        .update({
          daily_tasks_completed: newDailyTasks,
          total_tasks_completed: newTotalTasks,
          total_earnings: newTotalEarnings,
          current_level: newLevel,
          level_progress: levelProgress,
          daily_limit: levelConfig.dailyLimit,
          commission_rate: levelConfig.commissionRate
        })
        .eq('id', userLevel.id)
        .select()
        .single();

      if (error) throw error;
      setUserLevel(data as UserLevel);
      
      return {
        leveledUp: newLevel > userLevel.current_level,
        newLevel,
        oldLevel: userLevel.current_level
      };
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao atualizar progresso');
    }
  };

  const resetDailyTasks = async () => {
    if (!userLevel) return;

    try {
      const { data, error } = await supabase
        .from('user_levels')
        .update({ daily_tasks_completed: 0 })
        .eq('id', userLevel.id)
        .select()
        .single();

      if (error) throw error;
      setUserLevel(data as UserLevel);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao resetar tarefas diárias');
    }
  };

  const getLevelInfo = (level: number) => {
    return LEVEL_CONFIG[Math.min(level, LEVEL_CONFIG.length - 1)];
  };

  const getNextLevelInfo = (level: number) => {
    const nextLevel = level + 1;
    if (nextLevel >= LEVEL_CONFIG.length) return null;
    return LEVEL_CONFIG[nextLevel];
  };

  const canCompleteMoreTasks = () => {
    if (!userLevel) return false;
    return userLevel.daily_tasks_completed < userLevel.daily_limit;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchUserLevel();
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    userLevel,
    loading,
    error,
    incrementTasksCompleted,
    resetDailyTasks,
    getLevelInfo,
    getNextLevelInfo,
    canCompleteMoreTasks,
    levelConfig: LEVEL_CONFIG,
    refetch: fetchUserLevel
  };
}