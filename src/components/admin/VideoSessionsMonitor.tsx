import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable } from './DataTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Eye,
  TrendingDown,
  UserX
} from 'lucide-react';

interface VideoSession {
  id: string;
  user_id: string;
  video_task_id: string;
  started_at: string;
  ended_at?: string;
  is_completed: boolean;
  actual_watch_time: number;
  pause_count: number;
  tab_switches: number;
  seek_attempts: number;
  is_fraudulent: boolean;
  last_valid_position: number;
  minimum_required_time: number;
  watch_duration: number;
  // Joined data
  user_name?: string;
  task_title?: string;
}

export function VideoSessionsMonitor() {
  const [sessions, setSessions] = useState<VideoSession[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    fraudulent: 0,
    active: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
    
    // Realtime subscription
    const channel = supabase
      .channel('video-sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'video_watch_sessions'
        },
        () => {
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('video_watch_sessions')
        .select(`
          *,
          profiles(full_name),
          video_tasks(title)
        `)
        .order('started_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const processedSessions = data.map((session: any) => ({
        ...session,
        user_name: session.profiles?.full_name || 'Usuário Desconhecido',
        task_title: session.video_tasks?.title || 'Vídeo Desconhecido'
      }));

      setSessions(processedSessions);

      // Calculate stats
      setStats({
        total: processedSessions.length,
        completed: processedSessions.filter(s => s.is_completed).length,
        fraudulent: processedSessions.filter(s => s.is_fraudulent).length,
        active: processedSessions.filter(s => !s.is_completed && !s.ended_at).length
      });

    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Erro ao carregar sessões');
    } finally {
      setLoading(false);
    }
  };

  const flagAsFraud = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('video_watch_sessions')
        .update({ is_fraudulent: true })
        .eq('id', sessionId);

      if (error) throw error;
      
      toast.success('Sessão marcada como fraudulenta');
      fetchSessions();
    } catch (error) {
      console.error('Error flagging session:', error);
      toast.error('Erro ao marcar sessão');
    }
  };

  const resetSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('video_watch_sessions')
        .update({ 
          is_fraudulent: false,
          pause_count: 0,
          tab_switches: 0,
          seek_attempts: 0
        })
        .eq('id', sessionId);

      if (error) throw error;
      
      toast.success('Sessão resetada');
      fetchSessions();
    } catch (error) {
      console.error('Error resetting session:', error);
      toast.error('Erro ao resetar sessão');
    }
  };

  const getStatusBadge = (session: VideoSession) => {
    if (session.is_fraudulent) {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Fraudulenta</Badge>;
    }
    if (session.is_completed) {
      return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Concluída</Badge>;
    }
    if (!session.ended_at) {
      return <Badge className="bg-blue-600"><Clock className="h-3 w-3 mr-1" />Ativa</Badge>;
    }
    return <Badge variant="outline">Abandonada</Badge>;
  };

  const getFraudScore = (session: VideoSession) => {
    let score = 0;
    if (session.pause_count > 10) score += 2;
    if (session.tab_switches > 5) score += 3;
    if (session.seek_attempts > 3) score += 4;
    if (session.actual_watch_time < session.minimum_required_time * 0.5) score += 5;
    
    return score;
  };

  const columns = [
    {
      key: 'user_name',
      label: 'Usuário',
      render: (session: VideoSession) => session.user_name,
    },
    {
      key: 'task_title',
      label: 'Vídeo',
      render: (session: VideoSession) => session.task_title,
    },
    {
      key: 'status',
      label: 'Status',
      render: (session: VideoSession) => getStatusBadge(session),
    },
    {
      key: 'actual_watch_time',
      label: 'Tempo Assistido',
      render: (session: VideoSession) => {
        const percentage = session.minimum_required_time > 0 
          ? Math.round((session.actual_watch_time / session.minimum_required_time) * 100)
          : 0;
        return (
          <div>
            <div className="font-medium">{Math.floor(session.actual_watch_time)}s</div>
            <div className="text-xs text-muted-foreground">{percentage}% necessário</div>
          </div>
        );
      },
    },
    {
      key: 'fraud_indicators',
      label: 'Atividade Suspeita',
      render: (session: VideoSession) => {
        const score = getFraudScore(session);
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span>Pausas: {session.pause_count}</span>
              <span>Abas: {session.tab_switches}</span>
              <span>Pulos: {session.seek_attempts}</span>
            </div>
            <Badge 
              variant={score > 5 ? 'destructive' : score > 2 ? 'outline' : 'secondary'}
              className="text-xs"
            >
              Score: {score}
            </Badge>
          </div>
        );
      },
    },
    {
      key: 'started_at',
      label: 'Iniciado',
      render: (session: VideoSession) => {
        const date = new Date(session.started_at);
        return (
          <div>
            <div className="font-medium">{date.toLocaleDateString()}</div>
            <div className="text-xs text-muted-foreground">{date.toLocaleTimeString()}</div>
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (session: VideoSession) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => flagAsFraud(session.id)}
            disabled={session.is_fraudulent}
          >
            <UserX className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => resetSession(session.id)}
          >
            <Shield className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Sessões</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ativas</p>
                <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fraudulentas</p>
                <p className="text-2xl font-bold text-red-600">{stats.fraudulent}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fraud Alert */}
      {stats.fraudulent > 0 && (
        <Alert className="border-red-500">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {stats.fraudulent} sessões foram marcadas como fraudulentas. 
            Verifique os usuários com alta pontuação de fraude.
          </AlertDescription>
        </Alert>
      )}

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Monitor de Sessões de Vídeo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            title="Sessões de Vídeo"
            columns={columns}
            data={sessions}
          />
        </CardContent>
      </Card>
    </div>
  );
}