import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { VideoQuestionsFlow } from './VideoQuestionsFlow';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react';
import { toast } from "sonner";

interface EnhancedVideoPlayerProps {
  videoUrl: string;
  videoTitle: string;
  videoTaskId: string;
  rewardAmount: number;
  onVideoStart?: () => void;
  onVideoComplete?: (completionId: string) => void;
  onRewardEarned?: (amount: number) => void;
}

export function EnhancedVideoPlayer({
  videoUrl,
  videoTitle,
  videoTaskId,
  rewardAmount,
  onVideoStart,
  onVideoComplete,
  onRewardEarned
}: EnhancedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasWatchedFully, setHasWatchedFully] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
        if (!isPlaying && currentTime === 0) {
          onVideoStart?.();
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      
      // Check if user has watched at least 80% of the video
      const watchPercentage = (videoRef.current.currentTime / duration) * 100;
      if (watchPercentage >= 80 && !hasWatchedFully) {
        setHasWatchedFully(true);
      }
    }
  };

  const handleVideoEnd = () => {
    setHasWatchedFully(true);
    setShowQuestions(true);
    setIsPlaying(false);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current && duration > 0) {
      const newTime = (value[0] / 100) * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        videoRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      if (!isPlaying) {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleQuestionsComplete = (earnedReward: number) => {
    onRewardEarned?.(earnedReward);
    toast.success(`Parabéns! Você ganhou R$ ${earnedReward.toFixed(2)}`);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (showQuestions) {
    return (
      <div className="space-y-4">
        <Card className="glass-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Vídeo assistido!</h3>
                <p className="text-sm text-muted-foreground">{videoTitle}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowQuestions(false);
                  setHasWatchedFully(false);
                  handleRestart();
                }}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Assistir Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <VideoQuestionsFlow
          videoTaskId={videoTaskId}
          videoTitle={videoTitle}
          rewardAmount={rewardAmount}
          onComplete={handleQuestionsComplete}
        />
      </div>
    );
  }

  return (
    <Card className="glass-card border-border overflow-hidden">
      <CardContent className="p-0 relative">
        <div className="relative bg-black rounded-t-lg overflow-hidden">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full aspect-video"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleVideoEnd}
            playsInline
          />
          
          {/* Video Controls Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
              {/* Progress Bar */}
              <div className="flex items-center gap-2">
                <span className="text-white text-xs min-w-[40px]">
                  {formatTime(currentTime)}
                </span>
                <div className="flex-1">
                  <Progress 
                    value={progressPercentage} 
                    className="h-1 cursor-pointer"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const percentage = (e.clientX - rect.left) / rect.width * 100;
                      handleSeek([percentage]);
                    }}
                  />
                </div>
                <span className="text-white text-xs min-w-[40px]">
                  {formatTime(duration)}
                </span>
              </div>
              
              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    onClick={handlePlayPause}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    onClick={handleMuteToggle}
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    onClick={handleRestart}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  {hasWatchedFully && (
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                      onClick={() => setShowQuestions(true)}
                    >
                      Responder Perguntas
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    onClick={handleFullscreen}
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Video Info */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">{videoTitle}</h3>
            <div className="text-sm text-muted-foreground">
              Recompensa: R$ {rewardAmount.toFixed(2)}
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Progresso: {progressPercentage.toFixed(0)}%</span>
            <span>
              {hasWatchedFully ? 
                '✅ Pronto para responder' : 
                'Assista pelo menos 80% para liberar as perguntas'
              }
            </span>
          </div>
          
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}