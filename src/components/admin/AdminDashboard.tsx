import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, Video, DollarSign, Crown, TrendingUp, Calendar, Eye, Trophy } from "lucide-react";
import { StatsCard } from "./StatsCard";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  videosWatchedToday: number;
  totalPaidBalance: number;
  totalUsers: number;
  usersByPlan: Array<{ plan: string; count: number; color: string }>;
  topVideos: Array<{ title: string; views: number; reward: number }>;
  dailyViews: Array<{ date: string; views: number }>;
  conversionRate: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    videosWatchedToday: 0,
    totalPaidBalance: 0,
    totalUsers: 0,
    usersByPlan: [],
    topVideos: [],
    dailyViews: [],
    conversionRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      // Vídeos assistidos hoje
      const today = new Date().toISOString().split('T')[0];
      const { data: todayViews } = await supabase
        .from('user_video_completions')
        .select('id')
        .gte('completed_at', `${today}T00:00:00.000Z`)
        .lte('completed_at', `${today}T23:59:59.999Z`)
        .eq('status', 'completed');

      // Saldo total pago (transações aprovadas)
      const { data: approvedTransactions } = await supabase
        .from('transactions')
        .select('amount')
        .eq('status', 'approved')
        .eq('type', 'withdraw');

      const totalPaid = approvedTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Total de usuários
      const { data: users } = await supabase
        .from('profiles')
        .select('id, current_vip_level');

      // Usuários por plano
      const planCounts = {
        'Free': 0,
        'VIP 1': 0,
        'VIP 2': 0,
        'VIP 3+': 0
      };

      users?.forEach(user => {
        const level = user.current_vip_level || 0;
        if (level === 0) planCounts['Free']++;
        else if (level === 1) planCounts['VIP 1']++;
        else if (level === 2) planCounts['VIP 2']++;
        else planCounts['VIP 3+']++;
      });

      const usersByPlan = Object.entries(planCounts).map(([plan, count], index) => ({
        plan,
        count,
        color: COLORS[index]
      }));

      // Top vídeos mais assistidos
      const { data: topVideosData } = await supabase
        .from('video_tasks')
        .select('title, view_count, reward_amount')
        .order('view_count', { ascending: false })
        .limit(10);

      const topVideos = topVideosData?.map(video => ({
        title: video.title.length > 30 ? video.title.substring(0, 30) + '...' : video.title,
        views: video.view_count || 0,
        reward: Number(video.reward_amount)
      })) || [];

      // Vídeos assistidos por dia (últimos 7 dias)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const dailyViewsPromises = last7Days.map(async (date) => {
        const { data } = await supabase
          .from('user_video_completions')
          .select('id')
          .gte('completed_at', `${date}T00:00:00.000Z`)
          .lte('completed_at', `${date}T23:59:59.999Z`)
          .eq('status', 'completed');
        
        return {
          date: date.split('-').slice(1).join('/'),
          views: data?.length || 0
        };
      });

      const dailyViews = await Promise.all(dailyViewsPromises);

      // Taxa de conversão (usuários VIP / total)
      const vipUsers = users?.filter(u => (u.current_vip_level || 0) > 0).length || 0;
      const conversionRate = users?.length ? (vipUsers / users.length) * 100 : 0;

      setStats({
        videosWatchedToday: todayViews?.length || 0,
        totalPaidBalance: totalPaid,
        totalUsers: users?.length || 0,
        usersByPlan,
        topVideos,
        dailyViews,
        conversionRate
      });

    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Carregando estatísticas...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Vídeos Hoje"
          value={stats.videosWatchedToday}
          icon={Video}
          color="primary"
        />
        <StatsCard
          title="Total Pago"
          value={`R$ ${stats.totalPaidBalance.toFixed(2)}`}
          icon={DollarSign}
          color="success"
        />
        <StatsCard
          title="Total Usuários"
          value={stats.totalUsers}
          icon={Users}
          color="secondary"
        />
        <StatsCard
          title="Taxa Conversão"
          value={`${stats.conversionRate.toFixed(1)}%`}
          icon={TrendingUp}
          color="warning"
        />
      </div>

      {/* Gráficos */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Usuários por Plano</TabsTrigger>
          <TabsTrigger value="daily">Vídeos por Dia</TabsTrigger>
          <TabsTrigger value="top">Top Vídeos</TabsTrigger>
          <TabsTrigger value="conversion">Conversão</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Distribuição de Usuários por Plano
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.usersByPlan}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ plan, count, percent }) => `${plan}: ${count} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {stats.usersByPlan.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.usersByPlan}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="plan" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Vídeos Assistidos por Dia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.dailyViews}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="views" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Top 10 Vídeos Mais Assistidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stats.topVideos} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="title" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="views" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Métricas de Conversão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 glass-card">
                  <div className="text-2xl font-bold text-primary">{stats.usersByPlan.find(p => p.plan === 'Free')?.count || 0}</div>
                  <div className="text-sm text-muted-foreground">Usuários Free</div>
                </div>
                <div className="text-center p-4 glass-card">
                  <div className="text-2xl font-bold text-secondary">
                    {stats.usersByPlan.filter(p => p.plan !== 'Free').reduce((sum, p) => sum + p.count, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Usuários VIP</div>
                </div>
                <div className="text-center p-4 glass-card">
                  <div className="text-2xl font-bold text-accent">{stats.conversionRate.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Taxa de Conversão</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}