import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, ArrowUp, ArrowDown, Activity } from 'lucide-react';
import { useRealtimeWalletHistory } from '@/hooks/useRealtime';
import { formatUSD, brlToUsd } from '@/lib/utils';
export const WalletHistoryPanel = () => {
  const walletHistory = useRealtimeWalletHistory();
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
    return <Card className="glass-card">
        
        
      </Card>;
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