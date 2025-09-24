import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Video, DollarSign, Crown, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserDetails {
  id: string;
  full_name: string;
  balance: number;
  current_vip_level: number;
  total_video_earnings: number;
  created_at: string;
  avatar_url?: string;
  user_number: number;
}

interface VideoCompletion {
  id: string;
  video_title: string;
  completed_at: string;
  reward_earned: number;
  vip_bonus_applied: boolean;
  bonus_amount: number;
}

interface UserAnswer {
  question_text: string;
  selected_option: string;
  is_correct: boolean;
  answered_at: string;
  video_title: string;
}

interface WalletTransaction {
  id: string;
  transaction_type: string;
  amount: number;
  description: string;
  created_at: string;
  balance_after: number;
}

interface UserDetailsModalProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailsModal({ userId, open, onOpenChange }: UserDetailsModalProps) {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [videoCompletions, setVideoCompletions] = useState<VideoCompletion[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [walletHistory, setWalletHistory] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId && open) {
      fetchUserDetails();
    }
  }, [userId, open]);

  const fetchUserDetails = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);

      // Buscar dados do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profile) {
        setUserDetails(profile);
      }

      // Buscar vídeos completados
      const { data: completions } = await supabase
        .from('user_video_completions')
        .select(`
          *,
          video_tasks(title)
        `)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      const formattedCompletions = completions?.map(c => ({
        id: c.id,
        video_title: c.video_tasks?.title || 'Vídeo não encontrado',
        completed_at: c.completed_at,
        reward_earned: c.reward_earned || 0,
        vip_bonus_applied: c.vip_bonus_applied || false,
        bonus_amount: c.bonus_amount || 0
      })) || [];

      setVideoCompletions(formattedCompletions);

      // Buscar respostas do usuário
      // Buscar respostas do usuário com join manual
      const { data: answers } = await supabase
        .from('user_video_answers')
        .select(`
          *,
          video_questions(question_text)
        `)
        .eq('user_id', userId)
        .order('answered_at', { ascending: false });

      // Buscar títulos dos vídeos separadamente
      const videoIds = [...new Set(answers?.map(a => a.video_task_id))];
      const { data: videoTasks } = await supabase
        .from('video_tasks')
        .select('id, title')
        .in('id', videoIds);

      const videoTasksMap = Object.fromEntries(videoTasks?.map(v => [v.id, v.title]) || []);

      const formattedAnswers = answers?.map(a => ({
        question_text: a.video_questions?.question_text || 'Pergunta não encontrada',
        selected_option: a.selected_option,
        is_correct: a.is_correct,
        answered_at: a.answered_at,
        video_title: videoTasksMap[a.video_task_id] || 'Vídeo não encontrado'
      })) || [];

      setUserAnswers(formattedAnswers);

      // Buscar histórico da carteira
      const { data: history } = await supabase
        .from('wallet_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      setWalletHistory(history || []);

    } catch (error) {
      console.error('Erro ao carregar detalhes do usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!userDetails) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Carregando detalhes do usuário...</DialogTitle>
          </DialogHeader>
          {loading && <div className="text-center py-8">Carregando...</div>}
        </DialogContent>
      </Dialog>
    );
  }

  const correctAnswers = userAnswers.filter(a => a.is_correct).length;
  const totalAnswers = userAnswers.length;
  const accuracyRate = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;
  const vipPlanName = userDetails.current_vip_level === 0 ? 'Free' : `VIP ${userDetails.current_vip_level}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={userDetails.avatar_url} />
              <AvatarFallback>
                {userDetails.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {userDetails.full_name}
            <Badge variant={userDetails.current_vip_level > 0 ? "default" : "secondary"}>
              {vipPlanName}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div className="text-2xl font-bold text-success">R$ {userDetails.balance.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Saldo Atual</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Video className="h-5 w-5 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary">{videoCompletions.length}</div>
              <div className="text-sm text-muted-foreground">Vídeos Assistidos</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-warning" />
              </div>
              <div className="text-2xl font-bold text-warning">{accuracyRate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Taxa de Acerto</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Crown className="h-5 w-5 text-secondary" />
              </div>
              <div className="text-2xl font-bold text-secondary">R$ {userDetails.total_video_earnings.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Total Ganho</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="videos">Vídeos Assistidos</TabsTrigger>
            <TabsTrigger value="answers">Respostas</TabsTrigger>
            <TabsTrigger value="wallet">Histórico da Carteira</TabsTrigger>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
          </TabsList>

          <TabsContent value="videos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Vídeos Assistidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {videoCompletions.map((completion) => (
                    <div key={completion.id} className="flex items-center justify-between p-3 glass-card">
                      <div className="flex-1">
                        <div className="font-medium">{completion.video_title}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(completion.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-success">
                          R$ {completion.reward_earned.toFixed(2)}
                        </div>
                        {completion.vip_bonus_applied && (
                          <div className="text-xs text-secondary">
                            +R$ {completion.bonus_amount.toFixed(2)} VIP
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {videoCompletions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum vídeo assistido ainda
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="answers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Respostas</CardTitle>
                <div className="flex items-center gap-2">
                  <Progress value={accuracyRate} className="flex-1" />
                  <span className="text-sm font-medium">{accuracyRate.toFixed(1)}%</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {userAnswers.map((answer, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 glass-card">
                      <div className="mt-1">
                        {answer.is_correct ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : (
                          <XCircle className="h-5 w-5 text-destructive" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{answer.video_title}</div>
                        <div className="text-sm mt-1">{answer.question_text}</div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Resposta: {answer.selected_option} • {format(new Date(answer.answered_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                  ))}
                  {userAnswers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma resposta registrada ainda
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wallet" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico da Carteira</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {walletHistory.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 glass-card">
                      <div className="flex-1">
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(transaction.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${
                          transaction.amount > 0 ? 'text-success' : 'text-destructive'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}R$ {transaction.amount.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Saldo: R$ {transaction.balance_after.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {walletHistory.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma transação registrada ainda
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Perfil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nome Completo</label>
                    <div className="text-lg">{userDetails.full_name}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Número do Usuário</label>
                    <div className="text-lg">#{userDetails.user_number}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Plano Atual</label>
                    <div className="text-lg">{vipPlanName}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Membro desde</label>
                    <div className="text-lg">
                      {format(new Date(userDetails.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}