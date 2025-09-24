import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface VipPlan {
  id: string;
  name: string;
  level: number;
  price: number;
  duration_days: number;
  reward_multiplier: number;
  daily_video_limit: number;
  video_access_level: number;
  benefits: string[];
  status: string;
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
  vip_plan?: VipPlan;
}

export const useRealtimeVipStatus = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<VipPlan[]>([]);
  const [userSubscription, setUserSubscription] = useState<UserVipSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch initial data
    const fetchData = async () => {
      try {
        // Fetch VIP plans
        const { data: plansData } = await supabase
          .from('vip_plans')
          .select('*')
          .eq('status', 'active')
          .order('level', { ascending: true });

        if (plansData) {
          const parsedPlans = plansData.map(plan => ({
            ...plan,
            benefits: Array.isArray(plan.benefits) ? plan.benefits.map(b => String(b)) : []
          }));
          setPlans(parsedPlans);
        }

        // Fetch user subscription if user is logged in
        if (user) {
          const { data: subscriptionData } = await supabase
            .from('user_vip_subscriptions')
            .select(`
              *,
              vip_plan:vip_plans(*)
            `)
            .eq('user_id', user.id)
            .eq('status', 'active')
            .gte('expires_at', new Date().toISOString())
            .order('expires_at', { ascending: false })
            .maybeSingle();

          if (subscriptionData) {
            setUserSubscription({
              ...subscriptionData,
              vip_plan: {
                ...subscriptionData.vip_plan,
                benefits: Array.isArray(subscriptionData.vip_plan?.benefits) 
                  ? subscriptionData.vip_plan.benefits.map(b => String(b))
                  : []
              }
            });
          }
        }
      } catch (error) {
        console.error('Error fetching VIP data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up realtime subscriptions
    const plansChannel = supabase
      .channel('vip-plans-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vip_plans'
        },
        (payload) => {
          console.log('VIP plan update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newPlan = payload.new as VipPlan;
            if (newPlan.status === 'active') {
              setPlans(prev => [...prev, {
                ...newPlan,
                benefits: Array.isArray(newPlan.benefits) ? newPlan.benefits.map(b => String(b)) : []
              }].sort((a, b) => a.level - b.level));
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedPlan = payload.new as VipPlan;
            setPlans(prev => 
              prev.map(plan => 
                plan.id === updatedPlan.id 
                  ? { ...updatedPlan, benefits: Array.isArray(updatedPlan.benefits) ? updatedPlan.benefits.map(b => String(b)) : [] }
                  : plan
              ).filter(plan => plan.status === 'active')
            );
          } else if (payload.eventType === 'DELETE') {
            setPlans(prev => prev.filter(plan => plan.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    let subscriptionsChannel;
    if (user) {
      subscriptionsChannel = supabase
        .channel('vip-subscriptions-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_vip_subscriptions',
            filter: `user_id=eq.${user.id}`
          },
          async (payload) => {
            console.log('VIP subscription update:', payload);
            
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const subscription = payload.new as UserVipSubscription;
              
              // Fetch full subscription data with plan details
              const { data: fullSubscription } = await supabase
                .from('user_vip_subscriptions')
                .select(`
                  *,
                  vip_plan:vip_plans(*)
                `)
                .eq('id', subscription.id)
                .single();

              if (fullSubscription && 
                  fullSubscription.status === 'active' && 
                  new Date(fullSubscription.expires_at) > new Date()) {
                setUserSubscription({
                  ...fullSubscription,
                  vip_plan: {
                    ...fullSubscription.vip_plan,
                    benefits: Array.isArray(fullSubscription.vip_plan?.benefits) 
                      ? fullSubscription.vip_plan.benefits.map(b => String(b))
                      : []
                  }
                });
              } else {
                setUserSubscription(null);
              }
            }
          }
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(plansChannel);
      if (subscriptionsChannel) {
        supabase.removeChannel(subscriptionsChannel);
      }
    };
  }, [user]);

  const hasVipAccess = (requiredLevel: number = 0) => {
    if (!userSubscription || !userSubscription.vip_plan) return false;
    return userSubscription.vip_plan.level >= requiredLevel;
  };

  const getCurrentVipLevel = () => {
    return userSubscription?.vip_plan?.level || 0;
  };

  const getVipMultiplier = () => {
    return userSubscription?.vip_plan?.reward_multiplier || 1.0;
  };

  const isVipExpired = () => {
    if (!userSubscription) return true;
    return new Date(userSubscription.expires_at) <= new Date();
  };

  return {
    plans,
    userSubscription,
    loading,
    hasVipAccess,
    getCurrentVipLevel,
    getVipMultiplier,
    isVipExpired
  };
};