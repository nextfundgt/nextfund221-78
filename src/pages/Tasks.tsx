import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DashboardLayout } from '@/components/DashboardLayout';
import { VideoTaskCard } from '@/components/VideoTaskCard';
import { VideoTaskSkeletonGrid } from '@/components/VideoTaskSkeleton';
import { VipUpgradeModal } from '@/components/VipUpgradeModal';
import { VipContentNotification } from '@/components/VipContentNotification';
import { VideoPlayer } from '@/components/VideoPlayer';
import { VideoQuestionDialog } from '@/components/VideoQuestionDialog';
import { LimitBanner } from '@/components/LimitBanner';
import { useRealtimeVideoTasks } from '@/hooks/useRealtimeVideoTasks';
import { useRealtimeUserLevel } from '@/hooks/useRealtimeUserLevel';
import { useRealtimeVipStatus } from '@/hooks/useRealtimeVipStatus';
import { useVideoTasks } from '@/hooks/useVideoTasks';
import { Lock, Play, Crown, Crosshair, Clock, TrendingUp, Search, Filter, Star, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function Tasks() {
  const { tasks, completions, loading, getTaskCompletion, getTaskProgress } = useRealtimeVideoTasks();
  const { userLevel, canCompleteMoreTasks, getLevelInfo } = useRealtimeUserLevel();
  const { hasVipAccess, getCurrentVipLevel } = useRealtimeVipStatus();
  const { startWatching } = useVideoTasks();
  const [startingTaskId, setStartingTaskId] = useState<string | null>(null);
  const [showVipUpgrade, setShowVipUpgrade] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [vipLevelFilter, setVipLevelFilter] = useState('all');
  const [currentVideoTaskId, setCurrentVideoTaskId] = useState<string | null>(null);
  const [showQuestions, setShowQuestions] = useState(false);
  const [completedVideoTaskId, setCompletedVideoTaskId] = useState<string | null>(null);

  // Debug logs to monitor component behavior
  useEffect(() => {
    console.log('Tasks component render - tasks:', tasks.length, 'loading:', loading);
  }, [tasks.length, loading]);

  useEffect(() => {
    console.log('User level updated:', userLevel);
  }, [userLevel]);

  const handleWatchVideo = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    
    // Check VIP access first
    if (task?.vip_level_required && task.vip_level_required > 0) {
      if (!hasVipAccess(task.vip_level_required)) {
        setShowVipUpgrade(true);
        return;
      }
    }
    
    // Check daily limit
    if (!canCompleteMoreTasks()) {
      setShowVipUpgrade(true);
      return;
    }

    setStartingTaskId(taskId);
    try {
      await startWatching(taskId);
      setCurrentVideoTaskId(taskId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao iniciar tarefa');
    } finally {
      setStartingTaskId(null);
    }
  };

  const handleVideoComplete = (taskId: string) => {
    setCurrentVideoTaskId(null);
    setCompletedVideoTaskId(taskId);
    setShowQuestions(true);
  };

  const handleQuestionsComplete = () => {
    setShowQuestions(false);
    setCompletedVideoTaskId(null);
    toast.success('Vídeo concluído com sucesso! Ganhos adicionados à sua carteira.');
  };

  const getEarningsPreview = (task: any) => {
    const userVipLevel = getCurrentVipLevel();
    const completedToday = userLevel?.daily_tasks_completed || 0;
    
    // Sistema Free: 5 vídeos assistidos = R$15 fixos
    if (userVipLevel === 0) {
      if (completedToday < 5) {
        return {
          amount: 3.00, // R$3 por vídeo (5 vídeos = R$15)
          isSpecial: true,
          description: `Plano Free: R$3 por vídeo (${5 - completedToday} restantes para R$15)`
        };
      } else {
        return {
          amount: 0,
          isSpecial: false,
          description: 'Limite diário atingido (Plano Free)'
        };
      }
    }
    
    // Sistema VIP: usar valores configurados por vídeo
    return {
      amount: task.reward_amount,
      isSpecial: false,
      description: `Plano VIP ${userVipLevel}: Ganho configurado`
    };
  };

  const getTaskStatus = (taskId: string) => {
    const completion = getTaskCompletion(taskId);
    if (!completion) return { isCompleted: false, isInProgress: false, progress: 0 };
    
    const isCompleted = completion.status === 'completed';
    const isInProgress = completion.status === 'in_progress';
    const progress = getTaskProgress(taskId);
    
    return { isCompleted, isInProgress, progress };
  };

  // Filter and sort tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;
    
    // VIP level filter
    const matchesVipLevel = 
      vipLevelFilter === 'all' ||
      (vipLevelFilter === 'free' && (!task.vip_level_required || task.vip_level_required === 0)) ||
      (vipLevelFilter === 'vip1' && task.vip_level_required === 1) ||
      (vipLevelFilter === 'vip2' && task.vip_level_required === 2) ||
      (vipLevelFilter === 'vip3' && task.vip_level_required === 3);
    
    return matchesSearch && matchesCategory && matchesVipLevel;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'reward_high':
        return b.reward_amount - a.reward_amount;
      case 'reward_low':
        return a.reward_amount - b.reward_amount;
      case 'duration_short':
        return a.duration_seconds - b.duration_seconds;
      case 'duration_long':
        return b.duration_seconds - a.duration_seconds;
      case 'views':
        return (b.view_count || 0) - (a.view_count || 0);
      case 'newest':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const availableTasks = sortedTasks.filter(task => {
    const { isCompleted } = getTaskStatus(task.id);
    return !isCompleted;
  });

  const freeTasks = availableTasks.filter(task => !task.vip_level_required || task.vip_level_required === 0);
  const vipTasks = availableTasks.filter(task => task.vip_level_required && task.vip_level_required > 0);

  const completedTasks = sortedTasks.filter(task => {
    const { isCompleted } = getTaskStatus(task.id);
    return isCompleted;
  });

  // Get unique categories for filter
  const categories = Array.from(new Set(tasks.map(task => task.category))).sort();

  const currentLevelInfo = userLevel ? getLevelInfo(userLevel.current_level) : null;
  const tasksRemaining = userLevel ? userLevel.daily_limit - userLevel.daily_tasks_completed : 0;

  if (loading) {
    return (
      <DashboardLayout title="Tarefas de Vídeo" description="Assista vídeos e ganhe recompensas">
        <div className="space-y-4">
          {/* Status Header Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="glass-card border-border/50 rounded-2xl overflow-hidden">
                <CardContent className="p-4">
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-muted/50 rounded w-3/4"></div>
                    <div className="h-8 bg-muted/50 rounded w-1/2"></div>
                    <div className="h-3 bg-muted/50 rounded w-1/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Search and Filters Skeleton */}
          <Card className="glass-card border-border/50 rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 h-10 bg-muted/50 rounded animate-pulse"></div>
                <div className="w-full md:w-48 h-10 bg-muted/50 rounded animate-pulse"></div>
                <div className="w-full md:w-48 h-10 bg-muted/50 rounded animate-pulse"></div>
              </div>
            </CardContent>
          </Card>

          {/* Video Tasks Skeleton */}
          <Card className="glass-card border-border/50 rounded-2xl overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                Carregando vídeos...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VideoTaskSkeletonGrid count={6} />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Tarefas de Vídeo" description="Assista vídeos e ganhe recompensas">
      <div className="space-y-4">
        {/* Banner de Limite */}
        <LimitBanner />
        {/* Status Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card border-border/50 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-primary/20 rounded-lg">
                  <Crosshair className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-primary/80">Tarefas Restantes</span>
              </div>
              <div className="space-y-0.5">
                <div className="text-2xl font-bold text-primary">
                  {tasksRemaining}
                </div>
                <p className="text-xs text-muted-foreground">Hoje</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50 rounded-2xl overflow-hidden bg-gradient-to-br from-success/5 to-success/10 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-success/20 rounded-lg">
                  <Clock className="h-4 w-4 text-success" />
                </div>
                <span className="text-xs font-medium text-success/80">Concluídas Hoje</span>
              </div>
              <div className="space-y-0.5">
                <div className="text-2xl font-bold text-success">
                  {userLevel?.daily_tasks_completed || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  de {userLevel?.daily_limit || 0}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50 rounded-2xl overflow-hidden bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-accent/20 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-accent" />
                </div>
                <span className="text-xs font-medium text-accent/80">Nível Atual</span>
              </div>
              <div className="space-y-0.5">
                <div className="text-lg font-bold text-accent">
                  {currentLevelInfo?.title || 'Iniciante'}
                </div>
                <p className="text-xs text-muted-foreground">
                  LV{userLevel?.current_level || 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Level Progress */}
        {userLevel && (
          <Card className="glass-card border-border/50 rounded-2xl overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Badge variant="outline" className={currentLevelInfo?.color}>
                  {currentLevelInfo?.title}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso do Nível</span>
                  <span>{userLevel.level_progress}%</span>
                </div>
                <div className="w-full bg-muted/30 rounded-full h-3">
                  <div 
                    className="bg-primary h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${userLevel.level_progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {10 - (userLevel.total_tasks_completed % 10)} tarefas até o próximo nível
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* VIP Content Notification */}
        <VipContentNotification onUpgrade={() => setShowVipUpgrade(true)} />

        {/* Search and Filters */}
        <Card className="glass-card border-border/50 rounded-2xl overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar vídeos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Mais recentes</SelectItem>
                    <SelectItem value="reward_high">Maior recompensa</SelectItem>
                    <SelectItem value="reward_low">Menor recompensa</SelectItem>
                    <SelectItem value="duration_short">Mais curtos</SelectItem>
                    <SelectItem value="duration_long">Mais longos</SelectItem>
                    <SelectItem value="views">Mais vistos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* VIP Level Filter */}
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant={vipLevelFilter === 'all' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setVipLevelFilter('all')}
                  className="text-xs"
                >
                  Todos
                </Button>
                <Button 
                  variant={vipLevelFilter === 'free' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setVipLevelFilter('free')}
                  className="text-xs bg-green-500/10 border-green-500/30 text-green-600 hover:bg-green-500/20"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Gratuitos
                </Button>
                <Button 
                  variant={vipLevelFilter === 'vip1' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setVipLevelFilter('vip1')}
                  className="text-xs bg-yellow-500/10 border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/20"
                >
                  <Crown className="h-3 w-3 mr-1" />
                  VIP 1
                </Button>
                <Button 
                  variant={vipLevelFilter === 'vip2' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setVipLevelFilter('vip2')}
                  className="text-xs bg-yellow-500/10 border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/20"
                >
                  <Crown className="h-3 w-3 mr-1" />
                  VIP 2
                </Button>
                <Button 
                  variant={vipLevelFilter === 'vip3' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setVipLevelFilter('vip3')}
                  className="text-xs bg-yellow-500/10 border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/20"
                >
                  <Crown className="h-3 w-3 mr-1" />
                  VIP 3
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card className="glass-card border-border/50 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Star className="h-5 w-5 text-purple-600" />
              Estatísticas dos Vídeos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{tasks.length}</div>
                <div className="text-xs text-muted-foreground">Total de vídeos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-success">{completedTasks.length}</div>
                <div className="text-xs text-muted-foreground">Assistidos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{vipTasks.length}</div>
                <div className="text-xs text-muted-foreground">VIP exclusivos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {tasks.reduce((acc, task) => acc + (task.view_count || 0), 0).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Total de views</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Free Tasks */}
        {freeTasks.length > 0 && (
          <Card className="glass-card border-border/50 rounded-2xl overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                Vídeos Gratuitos ({freeTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {freeTasks.map((task) => {
                  const { isInProgress, progress } = getTaskStatus(task.id);
                  const earnings = getEarningsPreview(task);
                  return (
                    <VideoTaskCard
                      key={task.id}
                      task={task}
                      onWatch={handleWatchVideo}
                      isInProgress={isInProgress}
                      progress={progress}
                      userVipLevel={getCurrentVipLevel()}
                      earningsPreview={earnings}
                      isLoading={startingTaskId === task.id}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* VIP Tasks */}
        {vipTasks.length > 0 && (
          <Card className="glass-card border-border/50 rounded-2xl overflow-hidden bg-gradient-to-br from-yellow-500/5 to-orange-500/5 border-yellow-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-600" />
                Vídeos VIP ({vipTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vipTasks.map((task) => {
                  const { isInProgress, progress } = getTaskStatus(task.id);
                  const hasAccess = hasVipAccess(task.vip_level_required || 0);
                  const earnings = getEarningsPreview(task);
                  return (
                    <VideoTaskCard
                      key={task.id}
                      task={task}
                      onWatch={handleWatchVideo}
                      isInProgress={isInProgress}
                      progress={progress}
                      userVipLevel={getCurrentVipLevel()}
                      isLocked={!hasAccess}
                      earningsPreview={earnings}
                      isLoading={startingTaskId === task.id}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <Card className="glass-card border-border/50 rounded-2xl overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-success" />
                Tarefas Concluídas ({completedTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedTasks.slice(0, 4).map((task) => {
                  const { progress } = getTaskStatus(task.id);
                  return (
                    <VideoTaskCard
                      key={task.id}
                      task={task}
                      onWatch={() => Promise.resolve()}
                      isCompleted={true}
                      progress={progress}
                      userVipLevel={getCurrentVipLevel()}
                    />
                  );
                })}
              </div>
              {completedTasks.length > 4 && (
                <div className="text-center mt-4">
                  <Button variant="outline" size="sm">
                    Ver todas as tarefas concluídas
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {availableTasks.length === 0 && completedTasks.length === 0 && (
          <Card className="glass-card border-border/50 rounded-2xl overflow-hidden">
            <CardContent className="text-center py-12">
              <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma tarefa disponível</h3>
              <p className="text-muted-foreground">
                Novas tarefas de vídeo serão adicionadas em breve.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Video Player Modal */}
        <Dialog open={!!currentVideoTaskId} onOpenChange={() => setCurrentVideoTaskId(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
            {currentVideoTaskId && (
              <VideoPlayer 
                taskId={currentVideoTaskId} 
                onComplete={() => handleVideoComplete(currentVideoTaskId)}
                isModal={true}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Video Questions Dialog */}
        {completedVideoTaskId && (
          <VideoQuestionDialog
            open={showQuestions}
            onClose={() => setShowQuestions(false)}
            videoTaskId={completedVideoTaskId}
            onAllAnswered={handleQuestionsComplete}
          />
        )}

        {/* VIP Upgrade Modal */}
        <VipUpgradeModal 
          isOpen={showVipUpgrade}
          onClose={() => setShowVipUpgrade(false)}
        />
      </div>
    </DashboardLayout>
  );
}