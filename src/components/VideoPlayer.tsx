import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Volume2, VolumeX, ArrowLeft, Crown } from 'lucide-react';
import { useVideoTasks } from '@/hooks/useVideoTasks';
import { useUserLevel } from '@/hooks/useUserLevel';
import { useVipPlans } from '@/hooks/useVipPlans';
import { useVideoQuestions } from '@/hooks/useVideoQuestions';
import { VideoQuestionDialog } from '@/components/VideoQuestionDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VideoCompletionResult {
  success: boolean;
  reward_earned: number;
  bonus_amount: number;
  new_balance: number;
  vip_level: number;
}

interface VideoPlayerProps {
  taskId: string;
  onComplete?: (taskId: string) => void;
  isModal?: boolean;
}

export function VideoPlayer({ taskId, onComplete, isModal = false }: VideoPlayerProps) {
  const navigate = useNavigate();
  const { tasks, completions, updateProgress, completeTask, startWatching } = useVideoTasks();
  const { incrementTasksCompleted, canCompleteMoreTasks } = useUserLevel();
  const { hasVipAccess, getCurrentVipLevel } = useVipPlans();
  const { questions, hasAnsweredAllQuestions } = useVideoQuestions(taskId);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [watchProgress, setWatchProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completion, setCompletion] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [showQuestions, setShowQuestions] = useState(false);

  const task = tasks.find(t => t.id === taskId);
  const existingCompletion = completions.find(c => c.video_task_id === taskId);

  // Anti-fraud measures
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
      if (document.hidden && isPlaying) {
        videoRef.current?.pause();
        setIsPlaying(false);
        toast.warning('Vídeo pausado - mantenha a aba ativa');
      }
    };

    const handleBlur = () => {
      if (isPlaying && videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
        toast.warning('Vídeo pausado - mantenha o foco na janela');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isPlaying]);

  useEffect(() => {
    if (!task) return;

    // Check VIP access
    if (task.vip_level_required && task.vip_level_required > 0 && !hasVipAccess(task.vip_level_required)) {
      toast.error('Acesso VIP necessário para este vídeo');
      navigate('/tasks');
      return;
    }

    // Check daily limit
    if (!canCompleteMoreTasks()) {
      toast.error('Limite diário de tarefas atingido');
      navigate('/tasks');
      return;
    }

    // Initialize completion if not exists
    if (!existingCompletion) {
      startWatching(taskId).then(setCompletion);
    } else {
      setCompletion(existingCompletion);
      setWatchProgress((existingCompletion.watch_time_seconds / task.duration_seconds) * 100);
    }
  }, [task, existingCompletion, hasVipAccess, canCompleteMoreTasks]);

  const handleTimeUpdate = async () => {
    if (!videoRef.current || !task || !completion) return;

    const current = Math.floor(videoRef.current.currentTime);
    setCurrentTime(current);

    // Update progress every 5 seconds
    if (current > 0 && current % 5 === 0 && current > completion.watch_time_seconds) {
      try {
        await updateProgress(completion.id, current);
        setWatchProgress((current / task.duration_seconds) * 100);
      } catch (error) {
        console.error('Error updating progress:', error);
      }
    }

    // Check if video is completed (watched at least 80%)
    const progressPercent = (current / task.duration_seconds) * 100;
    if (progressPercent >= 80 && !isCompleted) {
      if (questions.length > 0) {
        // Show questions if they exist
        setShowQuestions(true);
        setIsPlaying(false);
      } else {
        // Complete immediately if no questions
        handleVideoCompletion();
      }
    }
  };

  const handleVideoCompletion = async () => {
    if (!completion || !task || isCompleted) return;

    try {
      setIsCompleted(true);
      
      // Special logic for Free vs VIP plans
      let finalReward = task.reward_amount;
      
      if (task.vip_level_required === 0) {
        // Free plan: Fixed R$6 per video (2 videos = R$12 total)
        finalReward = 6.00;
      }
      
      // Complete the task
      await completeTask(completion.id, task.id);
      
      // Update user level with VIP bonus
      const { data } = await supabase.rpc('handle_video_completion_with_vip', {
        p_user_id: completion.user_id,
        p_video_task_id: task.id,
        p_completion_id: completion.id
      });

      if (data) {
        const result = data as any;
        if (result && result.success) {
          const vipBonus = result.bonus_amount > 0 ? ` (bônus VIP: +R$ ${result.bonus_amount.toFixed(2)})` : '';
          toast.success(`Parabéns! Você ganhou R$ ${result.reward_earned.toFixed(2)}${vipBonus}`);
          
          // Free plan: Fixed R$3 per video (5 videos = R$15 total)
          finalReward = 3.00;
        }
      }

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/tasks');
      }, 3000);
      
    } catch (error) {
      toast.error('Erro ao completar vídeo');
      console.error('Error completing video:', error);
    }
  };

  const handleQuestionsCompleted = () => {
    if (onComplete) {
      onComplete(taskId);
    } else {
      handleVideoCompletion();
    }
  };

  const togglePlay = () => {
    if (!videoRef.current || !isVisible) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!task) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Vídeo não encontrado</p>
          <Button onClick={() => navigate('/tasks')} className="mt-4">
            Voltar para Tarefas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/tasks')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Tarefas
        </Button>

        <Card className="glass-card border-border/50">
          <CardContent className="p-6">
            {/* Video Header */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-bold">{task.title}</h1>
                <div className="flex items-center gap-2">
                  {task.is_premium && (
                    <Badge variant="outline" className="text-yellow-600">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                  {task.vip_level_required && task.vip_level_required > 0 && (
                    <Badge variant="outline">
                      VIP {task.vip_level_required}
                    </Badge>
                  )}
                  <Badge>R$ {task.reward_amount}</Badge>
                </div>
              </div>
              {task.description && (
                <p className="text-muted-foreground">{task.description}</p>
              )}
            </div>

            {/* Video Player */}
            <div className="relative bg-black rounded-lg overflow-hidden mb-4">
              <video
                ref={videoRef}
                src={task.video_url}
                className="w-full aspect-video"
                onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                poster={task.thumbnail_url}
                disablePictureInPicture
                controlsList="nodownload nofullscreen noremoteplayback"
                onContextMenu={(e) => e.preventDefault()}
              />
              
              {/* Custom Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center gap-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={togglePlay}
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
                    <div className="flex-1 bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-white rounded-full h-2 transition-all"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                      />
                    </div>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progresso do Vídeo</span>
                <span>{watchProgress.toFixed(0)}%</span>
              </div>
              <Progress value={watchProgress} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {isCompleted 
                  ? '✅ Vídeo completado! Redirecionando...' 
                  : watchProgress >= 80 
                    ? '🎉 Quase lá! Continue assistindo...'
                    : 'Assista pelo menos 80% do vídeo para ganhar a recompensa'
                }
              </p>
            </div>

            {/* VIP Bonus Info */}
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