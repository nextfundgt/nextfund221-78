import { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, X, Star, TrendingUp } from 'lucide-react';
import { useVipPlans } from '@/hooks/useVipPlans';
import { useVideoTasks } from '@/hooks/useVideoTasks';

interface VipContentNotificationProps {
  onUpgrade: () => void;
}

export function VipContentNotification({ onUpgrade }: VipContentNotificationProps) {
  const { hasVipAccess, getCurrentVipLevel } = useVipPlans();
  const { tasks } = useVideoTasks();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Memoize current VIP level to avoid recalculations
  const currentVipLevel = useMemo(() => getCurrentVipLevel(), [getCurrentVipLevel]);
  
  // Memoize VIP content filtering
  const newVipContent = useMemo(() => {
    if (currentVipLevel > 0 || !tasks.length) return [];
    
    return tasks.filter(task => 
      task.vip_level_required && 
      task.vip_level_required > currentVipLevel && 
      task.vip_level_required <= 3
    ).slice(0, 3);
  }, [tasks, currentVipLevel]);

  // Check dismissal status on mount
  useEffect(() => {
    const dismissed = localStorage.getItem('vip-notification-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const now = new Date();
      const hoursSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceDismissed < 24) {
        setIsDismissed(true);
        return;
      }
    }
    setIsDismissed(false);
  }, []);

  // Update visibility based on conditions
  useEffect(() => {
    if (isDismissed || currentVipLevel > 0 || newVipContent.length === 0) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
  }, [isDismissed, currentVipLevel, newVipContent.length]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('vip-notification-dismissed', new Date().toISOString());
  }, []);

  if (!isVisible || newVipContent.length === 0) {
    return null;
  }

  return (
    <Card className="glass-card border-border/50 rounded-2xl overflow-hidden bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30 relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDismiss}
        className="absolute top-4 right-4 h-8 w-8 p-0 text-muted-foreground hover:text-foreground z-10"
      >
        <X className="h-4 w-4" />
      </Button>
      
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-yellow-500/20 rounded-full">
            <Crown className="h-6 w-6 text-yellow-600" />
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-yellow-600 mb-1">
                Conteúdo VIP Exclusivo Disponível!
              </h3>
              <p className="text-sm text-muted-foreground">
                Desbloqueie {newVipContent.length} vídeos premium com maiores recompensas
              </p>
            </div>
            
            <div className="space-y-2">
              {newVipContent.map((task, index) => (
                <div key={task.id} className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium truncate max-w-[200px]">
                      {task.title}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      VIP {task.vip_level_required}
                    </Badge>
                  </div>
                  <div className="text-sm font-semibold text-success">
                    +R$ {task.reward_amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-2 pt-2">
              <Button onClick={onUpgrade} className="bg-yellow-600 hover:bg-yellow-700">
                <Crown className="h-4 w-4 mr-2" />
                Tornar-se VIP
              </Button>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>Até 3x mais recompensas</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}