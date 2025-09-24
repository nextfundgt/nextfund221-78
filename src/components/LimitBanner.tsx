import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, PlayCircle, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useRealtimeUserLevel } from "@/hooks/useRealtimeUserLevel";
import { useRealtimeVipStatus } from "@/hooks/useRealtimeVipStatus";
import { useFreeUserRewards } from "@/hooks/useFreeUserRewards";

export function LimitBanner() {
  const { userLevel } = useRealtimeUserLevel();
  const { getCurrentVipLevel } = useRealtimeVipStatus();
  const { getProgressInfo } = useFreeUserRewards();
  
  if (!userLevel) return null;

  const vipLevel = getCurrentVipLevel();
  const isVip = vipLevel > 0;
  const videosRestantes = Math.max(0, userLevel.daily_limit - userLevel.daily_tasks_completed);
  const limitAtingido = videosRestantes === 0;
  const progressInfo = getProgressInfo();

  // Para usuários VIP - banner de status premium
  if (isVip) {
    return (
      <Alert className="glass-card border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-yellow-600/5 mb-6">
        <Crown className="h-5 w-5 text-yellow-500" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
              VIP {vipLevel}
            </Badge>
            <span className="text-yellow-600 font-medium">
              🎉 Vídeos Ilimitados! Aproveite todos os conteúdos disponíveis
            </span>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Para usuários Free - limite atingido
  if (limitAtingido) {
    return (
      <Alert className="glass-card border-destructive/30 bg-gradient-to-r from-destructive/10 to-destructive/5 mb-6">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="destructive">Limite Diário Atingido</Badge>
            <span className="text-destructive font-medium">
              Você assistiu 8/8 vídeos hoje e ganhou R$ 15,00. Renovação às 00:00h
            </span>
          </div>
          <Link to="/level">
            <Button size="sm" className="bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade VIP
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  // Para usuários Free - vídeos disponíveis
  const urgente = videosRestantes === 1;
  
  return (
    <Alert className={`glass-card mb-6 ${
      urgente 
        ? 'border-warning/30 bg-gradient-to-r from-warning/10 to-warning/5' 
        : 'border-success/30 bg-gradient-to-r from-success/10 to-success/5'
    }`}>
      {urgente ? (
        <Clock className="h-5 w-5 text-warning" />
      ) : (
        <PlayCircle className="h-5 w-5 text-success" />
      )}
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge className={urgente 
            ? 'bg-warning/20 text-warning border-warning/30' 
            : 'bg-success/20 text-success border-success/30'
          }>
            {videosRestantes} {videosRestantes === 1 ? 'Vídeo Restante' : 'Vídeos Restantes'}
          </Badge>
          <span className={`font-medium ${urgente ? 'text-warning' : 'text-success'}`}>
            {urgente ? (
              <>⏰ <strong>Último vídeo!</strong> Ganhe R$ {progressInfo?.nextReward.toFixed(2) || '1,00'} e complete R$ 15,00</>
            ) : (
              <>🎯 Complete {videosRestantes} vídeos e ganhe R$ {progressInfo?.remainingEarnings.toFixed(2) || '15,00'} hoje</>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Progress indicator */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>{progressInfo ? `R$ ${progressInfo.currentEarnings.toFixed(2)}/${progressInfo.totalPossible.toFixed(2)}` : `${userLevel.daily_tasks_completed}/8`}</span>
            <div className="w-8 h-1 bg-muted/30 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${urgente ? 'bg-warning' : 'bg-success'}`}
                style={{ width: `${progressInfo ? progressInfo.progressPercentage : (userLevel.daily_tasks_completed / 8) * 100}%` }}
              />
            </div>
          </div>
          {urgente && (
            <Link to="/level">
              <Button size="sm" variant="outline" className="border-warning/30 text-warning hover:bg-warning/10">
                <Crown className="h-3 w-3 mr-1" />
                Upgrade
              </Button>
            </Link>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}