import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, DollarSign, CheckCircle, Eye, Crown, Lock } from 'lucide-react';
import { useVideoTasks } from '@/hooks/useVideoTasks';
import { formatUSD, brlToUsd } from '@/lib/utils';

interface VideoTaskCardProps {
  task: {
    id: string;
    title: string;
    description?: string;
    video_url: string;
    thumbnail_url?: string;
    duration_seconds: number;
    reward_amount: number;
    category: string;
    is_premium?: boolean;
    vip_level_required?: number;
    view_count?: number;
  };
  onWatch: (taskId: string) => Promise<void>;
  isCompleted?: boolean;
  isInProgress?: boolean;
  progress?: number;
  userVipLevel?: number;
  isLocked?: boolean;
  isLoading?: boolean;
  earningsPreview?: {
    amount: number;
    isSpecial: boolean;
    description: string;
  };
}

export function VideoTaskCard({ 
  task, 
  onWatch, 
  isCompleted = false, 
  isInProgress = false,
  progress = 0,
  userVipLevel = 0,
  isLocked = false,
  isLoading: externalLoading = false,
  earningsPreview
}: VideoTaskCardProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = externalLoading || internalLoading;

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleWatch = async () => {
    setInternalLoading(true);
    try {
      await onWatch(task.id);
    } finally {
      setInternalLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (isCompleted) {
      return (
        <Badge variant="default" className="bg-success/20 text-success border-success/30">
          <CheckCircle className="h-3 w-3 mr-1" />
          Concluído
        </Badge>
      );
    }
    if (isInProgress) {
      return (
        <Badge variant="outline" className="border-warning/30 text-warning">
          <Clock className="h-3 w-3 mr-1" />
          Em andamento
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-primary/30 text-primary">
        Disponível
      </Badge>
    );
  };

  return (
    <Card className="glass-card border-border/50 rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-200 group">
      <CardContent className="p-0">
        {/* Thumbnail */}
        <div className="relative h-32 bg-muted/20 rounded-t-2xl overflow-hidden">
          {task.thumbnail_url ? (
            <img 
              src={task.thumbnail_url} 
              alt={task.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <Play className="h-12 w-12 text-primary/60" />
            </div>
          )}
          
          {/* Play button overlay */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="p-3 bg-primary/90 rounded-full">
              <Play className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>

          {/* Duration badge */}
          <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
            {formatDuration(task.duration_seconds)}
          </div>

          {/* Category and VIP badges */}
          <div className="absolute top-2 left-2 flex gap-1">
            <Badge variant="secondary" className="text-xs">
              {task.category}
            </Badge>
            {task.vip_level_required && task.vip_level_required > 0 && (
              <Badge 
                variant="outline" 
                className="text-xs bg-yellow-500/20 text-yellow-600 border-yellow-500/30"
              >
                <Crown className="h-3 w-3 mr-1" />
                VIP {task.vip_level_required}
              </Badge>
            )}
          </div>

          {/* View count */}
          {task.view_count && task.view_count > 0 && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/70 text-white px-2 py-1 rounded text-xs">
              <Eye className="h-3 w-3" />
              {task.view_count.toLocaleString()}
            </div>
          )}

          {/* Lock overlay for VIP content */}
          {isLocked && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="text-center text-white">
                <Lock className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <div className="text-xs font-medium">VIP Level {task.vip_level_required}</div>
                <div className="text-xs opacity-80">Necessário</div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title and status */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm line-clamp-2 flex-1">
              {task.title}
            </h3>
            {getStatusBadge()}
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Progress bar for in-progress tasks */}
          {isInProgress && progress > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progresso</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-muted/30 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Earnings preview */}
          {earningsPreview && (
            <div className={`p-2 rounded-lg text-xs ${
              earningsPreview.isSpecial 
                ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20' 
                : 'bg-muted/20'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ganho:</span>
                <span className={`font-bold ${earningsPreview.isSpecial ? 'text-yellow-600' : 'text-success'}`}>
                  +R$ {earningsPreview.amount.toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {earningsPreview.description}
              </div>
            </div>
          )}

          {/* Reward and action */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-success">
              <DollarSign className="h-4 w-4" />
              <span className="font-bold text-sm">
                +{formatUSD(brlToUsd(task.reward_amount))}
              </span>
            </div>

            <Button 
              onClick={handleWatch}
              disabled={isCompleted || isLoading || isLocked}
              size="sm"
              variant={isCompleted ? "secondary" : isLocked ? "outline" : "default"}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              ) : isLocked ? (
                <>
                  <Lock className="h-3 w-3 mr-1" />
                  VIP
                </>
              ) : isCompleted ? (
                'Concluído'
              ) : isInProgress ? (
                'Continuar'
              ) : (
                'Assistir'
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}