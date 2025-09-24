import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Target, PlayCircle, ArrowDownLeft, User, HelpCircle, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeUserLevel } from "@/hooks/useRealtimeUserLevel";
import { useRealtimeTransactions } from "@/hooks/useRealtime";
import { MarketingBanner } from "@/components/MarketingBanner";
import { VideosRestantesCard } from "@/components/VideosRestantesCard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { formatUSD, brlToUsd } from "@/lib/utils";
interface DashboardStats {
  balance: number;
  dailyTaskEarnings: number;
  monthlyTaskEarnings: number;
  totalEarnings: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    balance: 0,
    dailyTaskEarnings: 0,
    monthlyTaskEarnings: 0,
    totalEarnings: 0
  });
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const { userLevel } = useRealtimeUserLevel();
  const transactions = useRealtimeTransactions();
  
  useEffect(() => {
    if (user) {
      fetchTaskStats();
    }
  }, [user]);

  useEffect(() => {
    if (profile?.balance !== undefined) {
      setStats(prev => ({
        ...prev,
        balance: profile.balance
      }));
    }
  }, [profile?.balance]);
  
  const fetchTaskStats = async () => {
    if (!user) return;
    try {
      console.log('Fetching real task stats for user:', user.id);
      
      // Get video completions for today and this month
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const { data: completions, error: completionsError } = await supabase
        .from('user_video_completions')
        .select('reward_earned, completed_at')
        .eq('user_id', user.id)
        .eq('status', 'completed');

      if (completionsError) throw completionsError;

      const dailyEarnings = (completions || [])
        .filter(c => c.completed_at && new Date(c.completed_at) >= startOfDay)
        .reduce((sum, c) => sum + (c.reward_earned || 0), 0);

      const monthlyEarnings = (completions || [])
        .filter(c => c.completed_at && new Date(c.completed_at) >= startOfMonth)
        .reduce((sum, c) => sum + (c.reward_earned || 0), 0);

      const totalEarnings = userLevel?.total_earnings || 0;

      setStats(prev => ({
        ...prev,
        dailyTaskEarnings: dailyEarnings,
        monthlyTaskEarnings: monthlyEarnings,
        totalEarnings
      }));
      
      console.log('Task stats updated:', {
        dailyEarnings,
        monthlyEarnings,
        totalEarnings
      });
    } catch (error) {
      console.error('Error fetching task stats:', error);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return (
      <DashboardLayout title="Carregando..." description="">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }
  return (
    <DashboardLayout title={`Olá, ${profile?.full_name || 'Usuário'} 👋`} description="Bem-vindo à NextFund - Tarefas de Vídeo">
      <div className="space-y-4 max-w-full overflow-hidden">
        {/* Marketing Banner */}
        <MarketingBanner />

        {/* Vídeos Restantes Card */}
        <VideosRestantesCard />

        {/* Resumo de Ganhos - Mobile Optimized */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {/* Renda da Tarefa de Hoje */}
          <Card className="glass-card border-border/50 rounded-2xl overflow-hidden bg-gradient-to-br from-success/5 to-success/10 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-success/20 rounded-lg">
                  <PlayCircle className="h-4 w-4 text-success" />
                </div>
                <span className="text-xs font-medium text-success/80">Hoje</span>
              </div>
              <div className="space-y-0.5">
                <div className="text-lg md:text-xl font-bold text-success">
                  {formatUSD(brlToUsd(stats.dailyTaskEarnings))}
                </div>
                <p className="text-xs text-muted-foreground">Renda da tarefa</p>
              </div>
            </CardContent>
          </Card>

          {/* Renda da Tarefa deste Mês */}
          <Card className="glass-card border-border/50 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-primary/20 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-primary/80">Este Mês</span>
              </div>
              <div className="space-y-0.5">
                <div className="text-lg md:text-xl font-bold text-primary">
                  {formatUSD(brlToUsd(stats.monthlyTaskEarnings))}
                </div>
                <p className="text-xs text-muted-foreground">Renda da tarefa</p>
              </div>
            </CardContent>
          </Card>

          {/* Receita Total */}
          <Card className="glass-card border-border/50 rounded-2xl overflow-hidden bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-accent/20 rounded-lg">
                  <Target className="h-4 w-4 text-accent" />
                </div>
                <span className="text-xs font-medium text-accent/80">Total</span>
              </div>
              <div className="space-y-0.5">
                <div className="text-lg md:text-xl font-bold text-accent">
                  {formatUSD(brlToUsd(stats.totalEarnings))}
                </div>
                <p className="text-xs text-muted-foreground">Receita total</p>
              </div>
            </CardContent>
          </Card>

          {/* Saldo da Carteira */}
          <Card className="glass-card border-border/50 rounded-2xl overflow-hidden bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-warning/20 rounded-lg">
                  <DollarSign className="h-4 w-4 text-warning" />
                </div>
                <span className="text-xs font-medium text-warning/80">Carteira</span>
              </div>
              <div className="space-y-0.5">
                <div className="text-lg md:text-xl font-bold text-warning">
                  {formatUSD(brlToUsd(stats.balance))}
                </div>
                <p className="text-xs text-muted-foreground">Saldo disponível</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ações Rápidas - Mobile First */}
        <Card className="glass-card border-border/50 rounded-2xl overflow-hidden">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <Link to="/wallet" className="flex flex-col items-center space-y-2 p-4 rounded-xl hover:bg-white/5 transition-all duration-200 group touch-target bg-success/5 border border-success/20">
                <div className="p-3 rounded-full bg-success/20 text-success group-hover:scale-110 transition-transform duration-200">
                  <Wallet className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium text-center leading-tight text-success">
                  Recarregar
                </span>
              </Link>

              <Link to="/wallet" className="flex flex-col items-center space-y-2 p-4 rounded-xl hover:bg-white/5 transition-all duration-200 group touch-target bg-warning/5 border border-warning/20">
                <div className="p-3 rounded-full bg-warning/20 text-warning group-hover:scale-110 transition-transform duration-200">
                  <ArrowDownLeft className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium text-center leading-tight text-warning">
                  Retiradas
                </span>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Status Level Card */}
        {userLevel && (
          <Card className="glass-card border-border/50 rounded-2xl overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Status do Nível
                <Badge variant="outline" className="border-primary/30 text-primary">
                  LV{userLevel.current_level}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-success/5 rounded-xl border border-success/20">
                  <div className="text-lg font-bold text-success mb-1">
                    {userLevel.daily_tasks_completed}
                  </div>
                  <p className="text-xs text-muted-foreground">Tarefas Hoje</p>
                </div>
                <div className="text-center p-3 bg-primary/5 rounded-xl border border-primary/20">
                  <div className="text-lg font-bold text-primary mb-1">
                    {userLevel.daily_limit}
                  </div>
                  <p className="text-xs text-muted-foreground">Limite Diário</p>
                </div>
                <div className="text-center p-3 bg-accent/5 rounded-xl border border-accent/20">
                  <div className="text-lg font-bold text-accent mb-1">
                    {userLevel.commission_rate}%
                  </div>
                  <p className="text-xs text-muted-foreground">Taxa Comissão</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Links */}
        <Card className="glass-card border-border/50 rounded-2xl overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Acesso Rápido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link to="/tasks" className="flex flex-col items-center space-y-2 p-3 rounded-xl hover:bg-white/5 transition-all duration-200 group touch-target">
                <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-200">
                  <PlayCircle className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-center leading-tight">
                  Tarefas
                </span>
              </Link>

              <Link to="/team" className="flex flex-col items-center space-y-2 p-3 rounded-xl hover:bg-white/5 transition-all duration-200 group touch-target">
                <div className="p-3 rounded-full bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform duration-200">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-center leading-tight">
                  Equipe
                </span>
              </Link>

              <Link to="/profile" className="flex flex-col items-center space-y-2 p-3 rounded-xl hover:bg-white/5 transition-all duration-200 group touch-target">
                <div className="p-3 rounded-full bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform duration-200">
                  <User className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-center leading-tight">
                  Perfil
                </span>
              </Link>

              <Link to="/support" className="flex flex-col items-center space-y-2 p-3 rounded-xl hover:bg-white/5 transition-all duration-200 group touch-target">
                <div className="p-3 rounded-full bg-orange-500/10 text-orange-400 group-hover:scale-110 transition-transform duration-200">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-center leading-tight">
                  Suporte
                </span>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="text-center pt-6 pb-2">
          <p className="text-xs text-muted-foreground">
            © 2025 NextFund. Todos os direitos reservados.
          </p>
        </footer>
      </div>
    </DashboardLayout>
  );
}