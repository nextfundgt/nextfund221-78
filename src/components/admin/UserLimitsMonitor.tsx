import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Users, Clock, Crown, AlertTriangle, RefreshCw, Search } from "lucide-react";
import { toast } from 'sonner';

interface UserLimitData {
  id: string;
  user_id: string;
  full_name: string;
  current_level: number;
  daily_tasks_completed: number;
  daily_limit: number;
  current_vip_level: number;
  total_tasks_completed: number;
  updated_at: string;
}

interface LimitStats {
  totalUsers: number;
  freeUsers: number;
  limitReachedFree: number;
  vipUsers: number;
  activeToday: number;
}

export function UserLimitsMonitor() {
  const [users, setUsers] = useState<UserLimitData[]>([]);
  const [stats, setStats] = useState<LimitStats>({
    totalUsers: 0,
    freeUsers: 0,
    limitReachedFree: 0,
    vipUsers: 0,
    activeToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchUserLimits();
    
    // Configurar realtime
    const channel = supabase
      .channel('user-limits-admin')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_levels'
        },
        () => {
          console.log('User limits updated, refreshing data...');
          fetchUserLimits();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUserLimits = async () => {
    try {
      const { data: userLimits, error } = await supabase
        .from('user_levels')
        .select(`
          id,
          user_id,
          current_level,
          daily_tasks_completed,
          daily_limit,
          total_tasks_completed,
          updated_at,
          profiles!inner (
            full_name,
            current_vip_level
          )
        `)
        .order('daily_tasks_completed', { ascending: false });

      if (error) throw error;

      const formattedData: UserLimitData[] = (userLimits || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        full_name: item.profiles.full_name,
        current_level: item.current_level,
        daily_tasks_completed: item.daily_tasks_completed,
        daily_limit: item.daily_limit,
        current_vip_level: item.profiles.current_vip_level,
        total_tasks_completed: item.total_tasks_completed,
        updated_at: item.updated_at
      }));

      setUsers(formattedData);
      
      // Calcular estatísticas
      const freeUsers = formattedData.filter(u => u.current_vip_level === 0);
      const vipUsers = formattedData.filter(u => u.current_vip_level > 0);
      const limitReachedFree = freeUsers.filter(u => u.daily_tasks_completed >= u.daily_limit);
      const activeToday = formattedData.filter(u => u.daily_tasks_completed > 0);

      setStats({
        totalUsers: formattedData.length,
        freeUsers: freeUsers.length,
        limitReachedFree: limitReachedFree.length,
        vipUsers: vipUsers.length,
        activeToday: activeToday.length
      });
    } catch (error) {
      console.error('Error fetching user limits:', error);
      toast.error('Erro ao carregar dados dos usuários');
    } finally {
      setLoading(false);
    }
  };

  const resetUserLimit = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_levels')
        .update({ 
          daily_tasks_completed: 0,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Limite do usuário resetado com sucesso');
    } catch (error) {
      console.error('Error resetting user limit:', error);
      toast.error('Erro ao resetar limite do usuário');
    }
  };

  const resetAllLimits = async () => {
    try {
      const { error } = await supabase
        .from('user_levels')
        .update({ 
          daily_tasks_completed: 0,
          updated_at: new Date().toISOString()
        })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all records
      
      if (error) throw error;

      toast.success('Limites de todos os usuários resetados com sucesso');
      fetchUserLimits();
    } catch (error) {
      console.error('Error resetting all limits:', error);
      toast.error('Erro ao resetar todos os limites');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'free' && user.current_vip_level === 0) ||
      (statusFilter === 'vip' && user.current_vip_level > 0) ||
      (statusFilter === 'limit_reached' && user.daily_tasks_completed >= user.daily_limit) ||
      (statusFilter === 'available' && user.daily_tasks_completed < user.daily_limit);
    
    return matchesSearch && matchesStatus;
  });

  const getUserStatus = (user: UserLimitData) => {
    if (user.current_vip_level > 0) return { label: `VIP ${user.current_vip_level}`, variant: 'default' as const, color: 'text-yellow-600' };
    if (user.daily_tasks_completed >= user.daily_limit) return { label: 'Limite Atingido', variant: 'destructive' as const, color: 'text-red-600' };
    if (user.daily_tasks_completed > 0) return { label: 'Ativo', variant: 'default' as const, color: 'text-green-600' };
    return { label: 'Inativo', variant: 'secondary' as const, color: 'text-gray-600' };
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Usuários</p>
                <p className="text-2xl font-bold text-primary">{stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Usuários Free</p>
                <p className="text-2xl font-bold text-green-600">{stats.freeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Limite Atingido</p>
                <p className="text-2xl font-bold text-red-600">{stats.limitReachedFree}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Usuários VIP</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.vipUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Ativos Hoje</p>
                <p className="text-2xl font-bold text-blue-600">{stats.activeToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Monitor de Limites em Tempo Real
            <Button onClick={resetAllLimits} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Todos os Limites
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="free">Usuários Free</SelectItem>
                <SelectItem value="vip">Usuários VIP</SelectItem>
                <SelectItem value="limit_reached">Limite Atingido</SelectItem>
                <SelectItem value="available">Vídeos Disponíveis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista de Usuários */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredUsers.map((user) => {
              const status = getUserStatus(user);
              const videosRestantes = Math.max(0, user.daily_limit - user.daily_tasks_completed);
              
              return (
                <div key={user.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.full_name}</span>
                        <Badge variant={status.variant} className="text-xs">
                          {status.label}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Vídeos: {user.daily_tasks_completed}/{user.daily_limit} • 
                        Total: {user.total_tasks_completed} • 
                        Nível: {user.current_level}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {user.current_vip_level === 0 && (
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          videosRestantes === 0 ? 'text-red-600' : 
                          videosRestantes === 1 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {videosRestantes === 0 ? 'Sem vídeos' : 
                           videosRestantes === 1 ? '1 vídeo restante' : 
                           `${videosRestantes} vídeos restantes`}
                        </div>
                        <div className="w-16 h-1 bg-muted/30 rounded-full overflow-hidden mt-1">
                          <div 
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${(user.daily_tasks_completed / user.daily_limit) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {user.current_vip_level === 0 && user.daily_tasks_completed > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resetUserLimit(user.user_id)}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Reset
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário encontrado com os filtros selecionados
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}