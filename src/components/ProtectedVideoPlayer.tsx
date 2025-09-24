import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  ArrowLeft, 
  Crown, 
  Shield,
  AlertTriangle,
  CheckCircle 
} from 'lucide-react';
import { VideoQuestionDialog } from './VideoQuestionDialog';
import { useVideoSession } from '@/hooks/useVideoSession';
import { useAuth } from '@/hooks/useAuth';
import { useVipPlans } from '@/hooks/useVipPlans';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProtectedVideoPlayerProps {
  taskId: string;
  videoUrl: string;
  title: string;
  description?: string;
  rewardAmount: number;
  duration: number;
  vipLevelRequired?: number;
  isPremium?: boolean;
  thumbnailUrl?: string;
  onComplete?: (taskId: string) => void;
  onBack?: () => void;
}

export function ProtectedVideoPlayer({
  taskId,
  videoUrl,
  title,
  description,
  rewardAmount,
  duration,
  vipLevelRequired = 0,
  isPremium = false,
  thumbnailUrl,
  onComplete,
  onBack
}: ProtectedVideoPlayerProps) {
  const { user } = useAuth();
  const { getCurrentVipLevel } = useVipPlans();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const {
    sessionState,
    isVisible,
    isPlaying,
    startSession,
    handlePlay,
    handlePause,
    handleSeek,
    updateValidPosition,
    completeSession,
    canReceiveReward
  } = useVideoSession({
    videoTaskId: taskId,
    videoDuration: duration,
    requiredPercentage: 80
  });

  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);

  // Inicializar sessão
  useEffect(() => {
    if (user && taskId) {
      startSession().then(session => {
        if (session && session.last_valid_position > 0) {
          setShowResumeModal(true);
        }
      });
    }
  }, [user, taskId, startSession]);

  // Controles do vídeo
  const togglePlay = async () => {
    if (!videoRef.current || !isVisible || sessionState.isFraudulent) return;

    if (isPlaying) {
      videoRef.current.pause();
      await handlePause();
    } else {
      videoRef.current.play();
      await handlePlay();
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Controle de tempo e progresso
  const handleTimeUpdate = async () => {
    if (!videoRef.current) return;

    const current = videoRef.current.currentTime;
    setCurrentTime(current);
    
    // Atualizar posição válida apenas se o usuário está assistindo sequencialmente
    await updateValidPosition(current);

    // Verificar se atingiu o mínimo para completar
    const progressPercent = (current / duration) * 100;
    if (progressPercent >= 80 && !isCompleted && canReceiveReward) {
      setShowQuestions(true);
      videoRef.current.pause();
      await handlePause();
    }
  };

  // Controle de seek bloqueado
  const handleVideoSeek = async (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = (clickX / rect.width) * 100;
    const targetTime = (percentage / 100) * duration;

    const canSeek = await handleSeek(targetTime);
    if (canSeek && videoRef.current) {
      videoRef.current.currentTime = targetTime;
    }
  };

  // Retomar vídeo
  const resumeVideo = () => {
    if (videoRef.current && sessionState.lastValidPosition > 0) {
      videoRef.current.currentTime = sessionState.lastValidPosition;
      setCurrentTime(sessionState.lastValidPosition);
    }
    setShowResumeModal(false);
  };

  // Completar vídeo com perguntas
  const handleQuestionsCompleted = async () => {
    const sessionCompleted = await completeSession();
    if (sessionCompleted) {
      try {
        // Processar recompensa
        const { data } = await supabase.rpc('handle_video_completion_with_vip', {
          p_user_id: user?.id,
          p_video_task_id: taskId,
          p_completion_id: sessionState.sessionId
        });

        const result = data as any;
        if (result?.success) {
          const vipBonus = result.bonus_amount > 0 ? ` (bônus VIP: +R$ ${result.bonus_amount.toFixed(2)})` : '';
          toast.success(`Parabéns! Você ganhou R$ ${result.reward_earned.toFixed(2)}${vipBonus}`);
          setIsCompleted(true);
          
          setTimeout(() => {
            onComplete?.(taskId);
          }, 3000);
        }
      } catch (error) {
        console.error('Error processing completion:', error);
        toast.error('Erro ao processar recompensa');
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const watchedPercentage = duration > 0 ? (sessionState.actualWatchTime / sessionState.minimumRequiredTime) * 100 : 0;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-green-500 text-green-600">
              <Shield className="h-3 w-3 mr-1" />
              Protegido
            </Badge>
            {sessionState.isFraudulent && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Sessão Inválida
              </Badge>
            )}
          </div>
        </div>

        {/* Status Alerts */}
        {!isVisible && (
          <Alert className="mb-4 border-yellow-500">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Mantenha esta aba ativa para continuar assistindo ao vídeo
            </AlertDescription>
          </Alert>
        )}

        {sessionState.isFraudulent && (
          <Alert className="mb-4 border-red-500">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Comportamento suspeito detectado. Esta sessão foi invalidada.
            </AlertDescription>
          </Alert>
        )}

        <Card className="glass-card border-border/50">
          <CardContent className="p-6">
            {/* Video Header */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-bold">{title}</h1>
                <div className="flex items-center gap-2">
                  {isPremium && (
                    <Badge variant="outline" className="text-yellow-600">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                  {vipLevelRequired > 0 && (
                    <Badge variant="outline">
                      VIP {vipLevelRequired}
                    </Badge>
                  )}
                  <Badge>R$ {rewardAmount}</Badge>
                </div>
              </div>
              {description && (
                <p className="text-muted-foreground">{description}</p>
              )}
            </div>

            {/* Video Player */}
            <div className="relative bg-black rounded-lg overflow-hidden mb-4">
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full aspect-video"
                onTimeUpdate={handleTimeUpdate}
                onPlay={handlePlay}
                onPause={handlePause}
                poster={thumbnailUrl}
                disablePictureInPicture
                controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
                onContextMenu={(e) => e.preventDefault()}
                onSeeking={(e) => {
                  // Bloquear seek manual
                  if (videoRef.current) {
                    const currentPos = videoRef.current.currentTime;
                    if (currentPos > sessionState.lastValidPosition + 5) {
                      videoRef.current.currentTime = sessionState.lastValidPosition;
                      toast.warning('Não é possível pular partes do vídeo');
                    }
                  }
                }}
              />
              
              {/* Bloqueio quando fora de foco */}
              {(!isVisible || sessionState.isFraudulent) && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Shield className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {sessionState.isFraudulent ? 'Sessão Inválida' : 'Vídeo Pausado'}
                    </h3>
                    <p className="text-sm text-gray-300">
                      {sessionState.isFraudulent 
                        ? 'Comportamento suspeito detectado'
                        : 'Mantenha o foco na janela para continuar'
                      }
                    </p>
                  </div>
                </div>
              )}
              
              {/* Controles customizados */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center gap-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={togglePlay}
                    disabled={!isVisible || sessionState.isFraudulent}
                    className="text-white hover:bg-white/20"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={toggleMute}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  
                  <div className="flex-1 flex items-center gap-2 text-white text-sm">
                    <span>{formatTime(currentTime)}</span>
                    <div 
                      className="flex-1 bg-white/20 rounded-full h-2 cursor-pointer"
                      onClick={handleVideoSeek}
                    >
                      <div 
                        className="bg-white rounded-full h-2 transition-all"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progresso Anti-Fraude */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span>Tempo Assistido</span>
                    <span>{Math.floor(sessionState.actualWatchTime)}s / {sessionState.minimumRequiredTime}s</span>
                  </div>
                  <Progress value={Math.min(watchedPercentage, 100)} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span>Progresso do Vídeo</span>
                    <span>{progressPercentage.toFixed(0)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              </div>

              {/* Estatísticas da Sessão */}
              <div className="grid grid-cols-4 gap-4 text-xs text-muted-foreground">
                <div className="text-center">
                  <div className="font-semibold">{sessionState.pauseCount}</div>
                  <div>Pausas</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{sessionState.tabSwitches}</div>
                  <div>Mudanças de Aba</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{sessionState.seekAttempts}</div>
                  <div>Tentativas de Pulo</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">
                    {canReceiveReward ? <CheckCircle className="h-4 w-4 text-green-500 mx-auto" /> : '⏳'}
                  </div>
                  <div>Status</div>
                </div>
              </div>

              <div className="text-center text-sm">
                {isCompleted 
                  ? '✅ Vídeo completado! Redirecionando...' 
                  : watchedPercentage >= 100 && canReceiveReward
                    ? '🎉 Pronto para responder as perguntas!'
                    : 'Continue assistindo para liberar a recompensa'
                }
              </div>
            </div>

            {/* VIP Info */}
            {getCurrentVipLevel() > 0 && (
              <div className="mt-4 p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">Bônus VIP Ativo</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Você ganhará bônus adicional por ser VIP {getCurrentVipLevel()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resume Modal */}
        {showResumeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-96">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold mb-4">Continuar de onde parou?</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Você pode continuar assistindo do minuto {formatTime(sessionState.lastValidPosition)}
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowResumeModal(false)}>
                    Começar do Início
                  </Button>
                  <Button onClick={resumeVideo}>
                    Continuar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Video Questions */}
        <VideoQuestionDialog
          open={showQuestions}
          onClose={() => setShowQuestions(false)}
          videoTaskId={taskId}
          onAllAnswered={handleQuestionsCompleted}
        />
      </div>
    </div>
  );
}