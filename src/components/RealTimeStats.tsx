import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RealTimeStatsProps {
  type: 'paid_today' | 'active_users' | 'videos_watched';
}

export function RealTimeStats({ type }: RealTimeStatsProps) {
  const [value, setValue] = useState<string>('...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStat();
    setupRealtimeSubscription();
  }, [type]);

  const fetchStat = async () => {
    try {
      switch (type) {
        case 'paid_today':
          await fetchPaidToday();
          break;
        case 'active_users':
          await fetchActiveUsers();
          break;
        case 'videos_watched':
          await fetchVideosWatched();
          break;
      }
    } catch (error) {
      console.error('Error fetching stat:', error);
      setValue('0');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaidToday = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('transactions')
      .select('amount')
      .eq('status', 'approved')
      .eq('type', 'withdraw')
      .gte('processed_at', `${today}T00:00:00.000Z`)
      .lte('processed_at', `${today}T23:59:59.999Z`);

    if (error) throw error;
    
    const total = data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    setValue(formatCurrency(total));
  };

  const fetchActiveUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    if (error) throw error;
    setValue(formatNumber(data || 0));
  };

  const fetchVideosWatched = async () => {
    const { data, error } = await supabase
      .from('user_video_completions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed');

    if (error) throw error;
    setValue(formatNumber(data || 0));
  };

  const setupRealtimeSubscription = () => {
    let channel;
    
    switch (type) {
      case 'paid_today':
        channel = supabase
          .channel('paid-today-stats')
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'transactions' }, 
            () => fetchPaidToday()
          )
          .subscribe();
        break;
      case 'active_users':
        channel = supabase
          .channel('active-users-stats')
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'profiles' }, 
            () => fetchActiveUsers()
          )
          .subscribe();
        break;
      case 'videos_watched':
        channel = supabase
          .channel('videos-watched-stats')
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'user_video_completions' }, 
            () => fetchVideosWatched()
          )
          .subscribe();
        break;
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `R$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `R$${(amount / 1000).toFixed(1)}K`;
    }
    return `R$${amount.toFixed(0)}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  if (loading) {
    return <span className="animate-pulse">...</span>;
  }

  return <span>{value}</span>;
}