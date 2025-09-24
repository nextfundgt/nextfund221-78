import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  status: string;
  method: string;
  gateway_used?: string;
  pix_key?: string;
  qr_code_image?: string;
  created_at: string;
  updated_at: string;
}

export function useRealtimePayments() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTransactions();
      subscribeToTransactionUpdates();
    }
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setTransactions(data || []);
      setPendingTransactions((data || []).filter(t => t.status === 'pending'));
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToTransactionUpdates = () => {
    if (!user) return;

    const channel = supabase
      .channel('transaction-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newTransaction = payload.new as Transaction;
            setTransactions(prev => [newTransaction, ...prev]);
            
            if (newTransaction.status === 'pending') {
              setPendingTransactions(prev => [newTransaction, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedTransaction = payload.new as Transaction;
            
            setTransactions(prev => 
              prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t)
            );
            
            // Update pending transactions
            if (updatedTransaction.status === 'pending') {
              setPendingTransactions(prev => {
                const exists = prev.find(t => t.id === updatedTransaction.id);
                if (exists) {
                  return prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t);
                } else {
                  return [updatedTransaction, ...prev];
                }
              });
            } else {
              // Remove from pending if status changed
              setPendingTransactions(prev => 
                prev.filter(t => t.id !== updatedTransaction.id)
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const createTransaction = async (
    type: 'deposit' | 'withdraw',
    amount: number,
    gatewayId?: string,
    paymentData?: Record<string, any>
  ) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const transactionData = {
        user_id: user.id,
        type,
        amount,
        status: 'pending',
        method: 'pix',
        gateway_used: gatewayId,
        ...paymentData
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  };

  const getTransactionStatus = (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    return transaction?.status || 'unknown';
  };

  const getTransactionsByStatus = (status: string) => {
    return transactions.filter(t => t.status === status);
  };

  const getTransactionsByType = (type: string) => {
    return transactions.filter(t => t.type === type);
  };

  const getTransactionsByGateway = (gatewayId: string) => {
    return transactions.filter(t => t.gateway_used === gatewayId);
  };

  const getTotalAmountByStatus = (status: string) => {
    return transactions
      .filter(t => t.status === status)
      .reduce((total, t) => total + t.amount, 0);
  };

  const hasPendingPayments = () => {
    return pendingTransactions.length > 0;
  };

  const getLatestTransaction = () => {
    return transactions.length > 0 ? transactions[0] : null;
  };

  return {
    transactions,
    pendingTransactions,
    loading,
    createTransaction,
    getTransactionStatus,
    getTransactionsByStatus,
    getTransactionsByType,
    getTransactionsByGateway,
    getTotalAmountByStatus,
    hasPendingPayments,
    getLatestTransaction,
    refetch: fetchTransactions
  };
}