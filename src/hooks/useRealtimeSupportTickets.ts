import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  response?: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export const useRealtimeSupportTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch initial tickets
    const fetchTickets = async () => {
      try {
        const { data } = await supabase
          .from('support_tickets')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (data) {
          setTickets(data);
        }
      } catch (error) {
        console.error('Error fetching support tickets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();

    // Set up realtime subscription
    const channel = supabase
      .channel('support-tickets-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Support ticket update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setTickets(prev => [payload.new as SupportTicket, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTickets(prev => 
              prev.map(ticket => 
                ticket.id === payload.new.id ? payload.new as SupportTicket : ticket
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setTickets(prev => prev.filter(ticket => ticket.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getOpenTicketsCount = () => {
    return tickets.filter(ticket => ticket.status === 'open').length;
  };

  const getPendingTicketsCount = () => {
    return tickets.filter(ticket => ticket.status === 'pending').length;
  };

  const getTicketsByStatus = (status: string) => {
    return tickets.filter(ticket => ticket.status === status);
  };

  return {
    tickets,
    loading,
    getOpenTicketsCount,
    getPendingTicketsCount,
    getTicketsByStatus
  };
};