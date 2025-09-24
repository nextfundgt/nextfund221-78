import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Hook for realtime notifications
export const useRealtimeNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Fetch initial notifications
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    };

    fetchNotifications();

    // Set up realtime subscription
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Notification update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new as any, ...prev]);
            if (!(payload.new as any).is_read) {
              setUnreadCount(prev => prev + 1);
            }
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev => 
              prev.map(n => n.id === payload.new.id ? payload.new as any : n)
            );
            // Update unread count if notification was marked as read
            if ((payload.old as any).is_read !== (payload.new as any).is_read) {
              setUnreadCount(prev => (payload.new as any).is_read ? prev - 1 : prev + 1);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
  };

  return { notifications, unreadCount, markAsRead };
};

// Hook for realtime balance updates
// Moved to RealtimeBalance component for better encapsulation

// Hook for realtime transactions
export const useRealtimeTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    // Fetch initial transactions
    const fetchTransactions = async () => {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (data) {
        setTransactions(data);
      }
    };

    fetchTransactions();

    // Set up realtime subscription
    const channel = supabase
      .channel('transactions-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Transaction update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setTransactions(prev => [payload.new as any, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTransactions(prev => 
              prev.map(t => t.id === payload.new.id ? payload.new as any : t)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return transactions;
};


// Hook for realtime wallet history
export const useRealtimeWalletHistory = () => {
  const { user } = useAuth();
  const [walletHistory, setWalletHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    // Fetch initial wallet history
    const fetchWalletHistory = async () => {
      const { data } = await supabase
        .from('wallet_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (data) {
        setWalletHistory(data);
      }
    };

    fetchWalletHistory();

    // Set up realtime subscription
    const channel = supabase
      .channel('wallet-history-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wallet_history',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Wallet history update:', payload);
          setWalletHistory(prev => [payload.new as any, ...prev.slice(0, 49)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return walletHistory;
};