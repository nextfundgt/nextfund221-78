import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Wallet as WalletIcon, 
  ArrowDownLeft, 
  ArrowUpRight, 
  History, 
  DollarSign, 
  CreditCard, 
  TrendingUp,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useVipPlans } from '@/hooks/useVipPlans';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/DashboardLayout';
import { TransactionDialog } from '@/components/TransactionDialog';
import { VipUpgradeDialog } from '@/components/VipUpgradeDialog';
import { WalletPixDeposit } from '@/components/WalletPixDeposit';
import { formatUSD, brlToUsd } from '@/lib/utils';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  method?: string;
  notes?: string;
  created_at: string;
  processed_at?: string;
  name?: string;
}


export default function Wallet() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [fetchedUserId, setFetchedUserId] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const [showPixDeposit, setShowPixDeposit] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showVipUpgrade, setShowVipUpgrade] = useState(false);
  
  const { user, profile } = useAuth();
  const { subscribeToPlan } = useVipPlans();

  // Cache duration: 30 seconds
  const CACHE_DURATION = 30 * 1000;

  // Only fetch data when user_id changes and is available, or cache is expired
  useEffect(() => {
    const userId = profile?.user_id;
    const now = Date.now();
    const shouldFetch = userId && (
      userId !== fetchedUserId || 
      now - lastFetch > CACHE_DURATION
    );
    
    if (shouldFetch) {
      setFetchedUserId(userId);
      setLastFetch(now);
      fetchData(userId);
    }
  }, [profile?.user_id, fetchedUserId, lastFetch]);

  const fetchData = useCallback(async (userId: string) => {
    // Only show loading if we don't have any data yet
    if (transactions.length === 0) {
      setLoading(true);
    }

    try {
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
      } else {
        setTransactions(transactionsData || []);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  }, [transactions.length]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success text-success-foreground';
      case 'rejected': return 'bg-destructive text-destructive-foreground';
      case 'active': return 'bg-primary text-primary-foreground';
      case 'completed': return 'bg-success text-success-foreground';
      default: return 'bg-warning text-warning-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprovado';
      case 'rejected': return 'Rejeitado';
      case 'active': return 'Ativo';
      case 'completed': return 'Finalizado';
      default: return 'Pendente';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return CheckCircle;
      case 'rejected': return XCircle;
      case 'active': return TrendingUp;
      case 'completed': return CheckCircle;
      default: return Clock;
    }
  };

  const getTransactionIcon = (type: string) => {
    return type === 'deposit' ? ArrowDownLeft : ArrowUpRight;
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      if (filterStatus !== 'all' && transaction.status !== filterStatus) return false;
      if (filterType !== 'all' && transaction.type !== filterType) return false;
      return true;
    });
  }, [transactions, filterStatus, filterType]);

  const displayedTransactions = useMemo(() => {
    if (!showAllTransactions) {
      return filteredTransactions.slice(0, 5);
    }
    return filteredTransactions;
  }, [filteredTransactions, showAllTransactions]);

  // Calculate wallet stats with memoization
  const walletStats = useMemo(() => {
    const totalDeposited = transactions
      .filter(t => t.type === 'deposit' && t.status === 'approved')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalWithdrawn = transactions
      .filter(t => t.type === 'withdraw' && t.status === 'approved')
      .reduce((sum, t) => sum + t.amount, 0);

    const pendingTransactions = transactions.filter(t => t.status === 'pending').length;

    return {
      totalDeposited,
      totalWithdrawn,
      pendingTransactions
    };
  }, [transactions]);

  // Show loading only if we haven't fetched data yet and don't have user data
  if (loading && !user) {
    return (
      <DashboardLayout 
        title="Carteira"
        description="Gerencie depósitos, saques e histórico"
        showBackButton
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card-mobile p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-muted rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Carteira"
      description="Gerencie depósitos, saques e histórico"
      showBackButton
    >
      <div className="space-y-4 max-w-full overflow-hidden">
        {/* Wallet Stats */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Card className="glass-card-mobile border-primary/20">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-primary/20 rounded-lg">
                  <WalletIcon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-primary/80 hidden sm:inline">Saldo</span>
              </div>
              <div className="space-y-0.5">
                <div className="text-base md:text-lg font-bold text-primary">
                  {formatUSD(brlToUsd(profile?.balance || 0))}
                </div>
                <p className="text-xs text-muted-foreground">Disponível</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card-mobile border-success/20">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-success/20 rounded-lg">
                  <ArrowDownLeft className="h-4 w-4 text-success" />
                </div>
                <span className="text-xs font-medium text-success/80 hidden sm:inline">Depositado</span>
              </div>
              <div className="space-y-0.5">
                <div className="text-base md:text-lg font-bold text-success">
                  {formatUSD(brlToUsd(walletStats.totalDeposited))}
                </div>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card-mobile border-warning/20">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-warning/20 rounded-lg">
                  <ArrowUpRight className="h-4 w-4 text-warning" />
                </div>
                <span className="text-xs font-medium text-warning/80 hidden sm:inline">Sacado</span>
              </div>
              <div className="space-y-0.5">
                <div className="text-base md:text-lg font-bold text-warning">
                  {formatUSD(brlToUsd(walletStats.totalWithdrawn))}
                </div>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* PIX Deposit via Pushin Pay */}
          <Button 
            onClick={() => setShowPixDeposit(true)}
            className="w-full h-12 md:h-14 bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70 text-success-foreground rounded-xl shadow-lg text-sm md:text-base font-medium"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Depósito PIX (Instantâneo)
          </Button>
          
          <TransactionDialog 
            type="withdraw"
            trigger={
              <Button variant="outline" className="w-full h-12 md:h-14 border-warning/30 text-warning hover:bg-warning/10 rounded-xl text-sm md:text-base font-medium">
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Sacar
              </Button>
            }
            onVipUpgradeRequired={() => setShowVipUpgrade(true)}
          />
        </div>

        {/* Transactions Content */}

          <div className="space-y-4">
            {/* Filters */}
            <Card className="glass-card-mobile">
              <CardHeader className="pb-2 md:pb-3">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Filter className="h-5 w-5" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-medium">Status</label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="form-input-mobile h-10 md:h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="approved">Aprovado</SelectItem>
                        <SelectItem value="rejected">Rejeitado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-medium">Tipo</label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="form-input-mobile h-10 md:h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="deposit">Depósito</SelectItem>
                        <SelectItem value="withdraw">Saque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transactions List */}
            <Card className="glass-card-mobile">
              <CardHeader className="pb-2 md:pb-3">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <History className="h-5 w-5" />
                  Histórico de Transações
                </CardTitle>
              </CardHeader>
              <CardContent>
                {displayedTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {displayedTransactions.map((transaction, index) => {
                      const IconComponent = getTransactionIcon(transaction.type);
                      const StatusIcon = getStatusIcon(transaction.status);
                      
                      return (
                        <div
                          key={transaction.id}
                          className="flex items-start justify-between p-3 md:p-4 bg-muted/20 rounded-lg gap-3 touch-target"
                        >
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className={`p-2 md:p-2.5 rounded-lg flex-shrink-0 ${
                              transaction.type === 'deposit' 
                                ? 'bg-success/10 text-success'
                                : 'bg-warning/10 text-warning'
                            }`}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-xs md:text-sm">
                                  {transaction.type === 'deposit' ? 'Depósito' : 'Saque'}
                                </p>
                                <StatusIcon className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                              </div>
                              <p className="text-xs md:text-sm text-muted-foreground">
                                {transaction.method?.toUpperCase() || 'Manual'}
                              </p>
                              {transaction.name && (
                                <p className="text-xs md:text-sm text-muted-foreground truncate">
                                  {transaction.name}
                                </p>
                              )}
                              {transaction.notes && (
                                <p className="text-xs md:text-sm text-muted-foreground mt-1 truncate">
                                  {transaction.notes}
                                </p>
                              )}
                              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                                {new Date(transaction.created_at).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <span className={`font-bold text-xs md:text-sm ${
                              transaction.type === 'deposit' ? 'text-success' : 'text-warning'
                            }`}>
                              {transaction.type === 'deposit' ? '+' : '-'}{formatUSD(brlToUsd(transaction.amount))}
                            </span>
                            <Badge className={`${getStatusColor(transaction.status)} text-xs px-2 py-0.5`}>
                              {getStatusText(transaction.status)}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Ver Tudo Button */}
                    {filteredTransactions.length > 5 && (
                      <div className="pt-3 md:pt-4 border-t border-muted/20">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full h-10 md:h-12 text-primary text-sm md:text-base"
                          onClick={() => setShowAllTransactions(!showAllTransactions)}
                        >
                          {showAllTransactions ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-2" />
                              Ver Menos
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-2" />
                              Ver Todas ({filteredTransactions.length - 5} mais)
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <History className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-sm md:text-base text-muted-foreground">Nenhuma transação encontrada</p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">
                      Suas transações aparecerão aqui
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 gap-4">
          <Card className="glass-card-mobile">
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <DollarSign className="h-5 w-5" />
                Informações Importantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Depósito mínimo:</span>
                  <span className="font-medium">$2,00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Saque mínimo:</span>
                  <span className="font-medium">$2,00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Taxa PIX:</span>
                  <span className="text-success font-medium">Grátis</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Taxa TED:</span>
                  <span className="font-medium">$1,00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Processamento PIX:</span>
                  <span className="font-medium">Instantâneo</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Processamento TED:</span>
                  <span className="font-medium">1-2 dias úteis</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Pushin Pay Modal for PIX Deposits */}
        <WalletPixDeposit
          open={showPixDeposit}
          onOpenChange={setShowPixDeposit}
          onPaymentSuccess={() => {
            setShowPixDeposit(false);
            // Refresh data to show new transaction
            if (profile?.user_id) {
              fetchData(profile.user_id);
            }
          }}
        />

        {/* VIP Upgrade Modal */}
        <VipUpgradeDialog
          open={showVipUpgrade}
          onOpenChange={setShowVipUpgrade}
          onSubscribe={async (planId) => {
            try {
              await subscribeToPlan(planId);
              setShowVipUpgrade(false);
            } catch (error) {
              console.error('Error subscribing to plan:', error);
            }
          }}
        />
      </div>
    </DashboardLayout>
  );
}