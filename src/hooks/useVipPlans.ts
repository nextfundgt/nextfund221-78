import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VipPlan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  level: number;
  benefits: string[];
  video_access_level: number;
  daily_video_limit: number;
  reward_multiplier: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface VideoCompletionResult {
  success: boolean;
  reward_earned: number;
  bonus_amount: number;
  new_balance: number;
  vip_level: number;
}

interface UserVipSubscription {
  id: string;
  user_id: string;
  vip_plan_id: string;
  status: string;
  started_at: string;
  expires_at: string;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
  vip_plans?: VipPlan;
}

export function useVipPlans() {
  const [plans, setPlans] = useState<VipPlan[]>([]);
  const [userSubscription, setUserSubscription] = useState<UserVipSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('vip_plans')
        .select('*')
        .eq('status', 'active')
        .order('level');

      if (error) throw error;
      setPlans((data || []).map(plan => ({
        ...plan,
        benefits: Array.isArray(plan.benefits) ? plan.benefits : JSON.parse(plan.benefits as string)
      })) as VipPlan[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar planos VIP');
    }
  };

  const fetchUserSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_vip_subscriptions')
        .select(`
          *,
          vip_plans (*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setUserSubscription(data ? {
        ...data,
        vip_plans: data.vip_plans ? {
          ...data.vip_plans,
          benefits: Array.isArray(data.vip_plans.benefits) 
            ? data.vip_plans.benefits as string[]
            : JSON.parse(data.vip_plans.benefits as string) as string[]
        } : undefined
      } as UserVipSubscription : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar assinatura VIP');
    }
  };

  const subscribeToPlan = async (planId: string, paymentMethod: string = 'manual') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const plan = plans.find(p => p.id === planId);
      if (!plan) throw new Error('Plano não encontrado');

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + plan.duration_days);

      const { data, error } = await supabase
        .from('user_vip_subscriptions')
        .insert([
          {
            user_id: user.id,
            vip_plan_id: planId,
            status: 'active',
            expires_at: expiresAt.toISOString()
          }
        ])
        .select(`
          *,
          vip_plans (*)
        `)
        .single();

      if (error) throw error;
      
      const processedData = data ? {
        ...data,
        vip_plans: data.vip_plans ? {
          ...data.vip_plans,
          benefits: Array.isArray(data.vip_plans.benefits) 
            ? data.vip_plans.benefits as string[]
            : JSON.parse(data.vip_plans.benefits as string) as string[]
        } : undefined
      } as UserVipSubscription : null;
      
      setUserSubscription(processedData);
      
      return { success: true, subscription: processedData };
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao criar assinatura VIP');
    }
  };

  const cancelSubscription = async (subscriptionId: string) => {
    try {
      const { error } = await supabase
        .from('user_vip_subscriptions')
        .update({ status: 'cancelled', auto_renew: false })
        .eq('id', subscriptionId);

      if (error) throw error;
      await fetchUserSubscription();
      
      return { success: true };
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao cancelar assinatura VIP');
    }
  };

  const hasVipAccess = (requiredLevel: number = 0) => {
    if (!userSubscription || !userSubscription.vip_plans) return false;
    return userSubscription.vip_plans.level >= requiredLevel;
  };

  const getCurrentVipLevel = () => {
    return userSubscription?.vip_plans?.level || 0;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPlans(), fetchUserSubscription()]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    plans,
    userSubscription,
    loading,
    error,
    subscribeToPlan,
    cancelSubscription,
    hasVipAccess,
    getCurrentVipLevel,
    refetch: () => Promise.all([fetchPlans(), fetchUserSubscription()])
  };
}