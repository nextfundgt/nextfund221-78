import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, Crown, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useRealtimeUserLevel } from "@/hooks/useRealtimeUserLevel";
import { useRealtimeVipStatus } from "@/hooks/useRealtimeVipStatus";
import { useFreeUserRewards } from "@/hooks/useFreeUserRewards";

export function VideosRestantesCard() {
  const { userLevel } = useRealtimeUserLevel();
  const { hasVipAccess, getCurrentVipLevel } = useRealtimeVipStatus();
  const { getProgressInfo } = useFreeUserRewards();
  
  if (!userLevel) return null;

  const vipLevel = getCurrentVipLevel();
  const isVip = vipLevel > 0;
  const videosRestantes = Math.max(0, userLevel.daily_limit - userLevel.daily_tasks_completed);
  const limitAtingido = videosRestantes === 0;
  const progressInfo = getProgressInfo();

  // Para usuários VIP - mostrar status diferente
  if (isVip) {
    return (
      <Card className="glass-card border-border/50 rounded-2xl overflow-hidden bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Crown className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
                    VIP {vipLevel}
                  </Badge>
                  <span className="text-xs text-muted-foreground">Vídeos Ilimitados</span>
                </div>
                <h3 className="font-semibold text-yellow-600">Assistir Sem Limites</h3>
                <p className="text-xs text-muted-foreground">Aproveite todos os vídeos disponíveis</p>
              </div>
            </div>
            <Link to="/tasks">
              <Button className="bg-yellow-500/20 text-yellow-600 border border-yellow-500/30 hover:bg-yellow-500/30">
                <PlayCircle className="h-4 w-4 mr-2" />
                Assistir
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Para usuários Free
  if (limitAtingido) {
    return (
      <Card className="glass-card border-border/50 rounded-2xl overflow-hidden bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="destructive">Limite Atingido</Badge>
                  <span className="text-xs text-muted-foreground">Renovação às 00:00</span>
                </div>
                <h3 className="font-semibold text-destructive">Vídeos Hoje: 8/8</h3>
                <p className="text-xs text-muted-foreground">Você ganhou R$ 15,00 hoje! Upgrade para VIP e assista ilimitado!</p>
              </div>
            </div>
            <Link to="/level">
              <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade VIP
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Usuários Free com vídeos restantes
  const urgente = videosRestantes === 1;
  
  return (
    <Card className={`glass-card border-border/50 rounded-2xl overflow-hidden ${
      urgente 
        ? 'bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20' 
        : 'bg-gradient-to-br from-success/10 to-success/5 border-success/20'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              urgente ? 'bg-warning/20' : 'bg-success/20'
            }`}>
              {urgente ? (
                <Clock className="h-5 w-5 text-warning" />
              ) : (
                <PlayCircle className="h-5 w-5 text-success" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className={urgente ? 'bg-warning/20 text-warning border-warning/30' : 'bg-success/20 text-success border-success/30'}>
                  {videosRestantes} {videosRestantes === 1 ? 'Vídeo Restante' : 'Vídeos Restantes'}
                </Badge>
                {urgente && (
                  <span className="text-xs text-warning font-medium">⏰ Última Chance!</span>
                )}
              </div>
              <h3 className={`font-semibold ${urgente ? 'text-warning' : 'text-success'}`}>
                {urgente ? 'Último Vídeo Disponível!' : `${videosRestantes} Vídeos Disponíveis Hoje`}
              </h3>
              <p className="text-xs text-muted-foreground">
                {progressInfo ? (
                  urgente 
                    ? `Ganhe R$ ${progressInfo.nextReward.toFixed(2)} e complete R$ ${progressInfo.totalPossible.toFixed(2)} hoje!`
                    : `Próximo vídeo: R$ ${progressInfo.nextReward.toFixed(2)} • Total possível: R$ ${progressInfo.totalPossible.toFixed(2)}`
                ) : (
                  'Complete 5 vídeos hoje e ganhe R$ 15,00 total'
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Link to="/tasks">
              <Button className={urgente 
                ? 'bg-warning/20 text-warning border border-warning/30 hover:bg-warning/30' 
                : 'bg-success/20 text-success border border-success/30 hover:bg-success/30'
              }>
                <PlayCircle className="h-4 w-4 mr-2" />
                Assistir Agora
              </Button>
            </Link>
            {urgente && (
              <Link to="/level">
                <Button variant="outline" size="sm" className="text-xs border-warning/30 text-warning hover:bg-warning/10">
                  <Crown className="h-3 w-3 mr-1" />
                  Upgrade VIP
                </Button>
              </Link>
            )}
          </div>
        </div>
        
        {/* Barra de progresso */}
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progresso Diário</span>
            <span className={urgente ? 'text-warning' : 'text-success'}>
              {progressInfo ? `R$ ${progressInfo.currentEarnings.toFixed(2)} de R$ ${progressInfo.totalPossible.toFixed(2)}` : `${userLevel.daily_tasks_completed}/8 vídeos`}
            </span>
          </div>
          <div className="w-full bg-muted/30 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                urgente ? 'bg-warning' : 'bg-success'
              }`}
              style={{ width: `${progressInfo ? progressInfo.progressPercentage : (userLevel.daily_tasks_completed / 5) * 100}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}