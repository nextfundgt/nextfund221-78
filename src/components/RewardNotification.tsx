import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, DollarSign, Crown, Star, X } from 'lucide-react';

interface RewardNotificationProps {
  reward: {
    amount: number;
    videoTitle: string;
    vipBonus?: number;
    vipLevel?: number;
  } | null;
  onClose: () => void;
}

export function RewardNotification({ reward, onClose }: RewardNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (reward) {
      setIsVisible(true);
      
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [reward, onClose]);

  if (!reward || !isVisible) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
      <Card className="glass-card border-border/50 rounded-2xl overflow-hidden bg-gradient-to-br from-success/10 to-green-500/10 border-success/30 shadow-2xl min-w-[300px]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-success/20 rounded-full">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-success">Vídeo Completado!</h4>
                <button
                  onClick={() => setIsVisible(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-1">
                {reward.videoTitle}
              </p>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-success" />
                  <span className="font-bold text-success">
                    +R$ {reward.amount.toFixed(2)}
                  </span>
                  {reward.vipBonus && reward.vipBonus > 0 && (
                    <Badge variant="outline" className="text-xs bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
                      <Crown className="h-3 w-3 mr-1" />
                      Bônus VIP: +R$ {reward.vipBonus.toFixed(2)}
                    </Badge>
                  )}
                </div>
                
                {reward.vipLevel && reward.vipLevel > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 text-yellow-600" />
                    <span>VIP Level {reward.vipLevel} ativo</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}