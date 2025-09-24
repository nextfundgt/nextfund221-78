import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ProtectedVideoPlayer } from '@/components/ProtectedVideoPlayer';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface VideoTask {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  reward_amount: number;
  duration_seconds: number;
  vip_level_required?: number;
  is_premium?: boolean;
  thumbnail_url?: string;
}

export default function Watch() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<VideoTask | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (taskId) {
      fetchTask();
    }
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const { data, error } = await supabase
        .from('video_tasks')
        .select('*')
        .eq('id', taskId)
        .eq('status', 'active')
        .single();

      if (error) throw error;
      setTask(data);
    } catch (error) {
      console.error('Error fetching task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    navigate('/tasks');
  };

  const handleBack = () => {
    navigate('/tasks');
  };

  if (!taskId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Vídeo não encontrado</h1>
          <p className="text-muted-foreground">O ID da tarefa não foi fornecido.</p>
          <Button onClick={handleBack} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Tarefas
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando vídeo...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Vídeo não encontrado</h1>
          <p className="text-muted-foreground">A tarefa solicitada não existe ou foi removida.</p>
          <Button onClick={handleBack} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Tarefas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedVideoPlayer
      taskId={task.id}
      videoUrl={task.video_url}
      title={task.title}
      description={task.description}
      rewardAmount={task.reward_amount}
      duration={task.duration_seconds}
      vipLevelRequired={task.vip_level_required}
      isPremium={task.is_premium}
      thumbnailUrl={task.thumbnail_url}
      onComplete={handleComplete}
      onBack={handleBack}
    />
  );
}