import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, ArrowUp, ArrowDown, Activity } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatUSD, brlToUsd } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const WalletHistoryPanel = () => {
  const { user } = useAuth();
  const [walletHistory, setWalletHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    console.log('Setting up realtime wallet history for user:', user.id);

    // Fetch initial wallet history
    const fetchWalletHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('wallet_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (error) throw error;
        
        console.log('Fetched wallet history:', data?.length || 0, 'records');
        setWalletHistory(data || []);
      } catch (error) {
        console.error('Error fetching wallet history:', error);
      } finally {
        setLoading(false);
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
          console.log('Wallet history realtime update:', payload);
          setWalletHistory(prev => [payload.new as any, ...prev.slice(0, 49)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5" />
            Histórico da Carteira
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    });
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  if (walletHistory.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5" />
            Histórico da Carteira
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-muted-foreground">Nenhuma transação ainda</p>
            <p className="text-sm text-muted-foreground mt-1">
              Suas transações aparecerão aqui
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5" />
          Histórico da Carteira
          <Badge variant="outline" className="text-xs">
            <Activity className="h-2 w-2 mr-1" />
            Tempo Real
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {walletHistory.map(entry => {
          const isCredit = entry.transaction_type === 'credit';
          const Icon = isCredit ? ArrowUp : ArrowDown;
          return <div key={entry.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isCredit ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  <div>
                    <p className="font-medium text-sm">
                      {entry.description || (isCredit ? 'Crédito' : 'Débito')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(entry.created_at)}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`font-bold text-sm ${isCredit ? 'text-success' : 'text-warning'}`}>
                    {isCredit ? '+' : '-'}{formatUSD(brlToUsd(entry.amount))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Saldo: {formatUSD(brlToUsd(entry.balance_after))}
                  </p>
                </div>
              </div>;
        })}
        </div>
      </CardContent>
    </Card>;
};