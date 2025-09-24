import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Star, Zap, DollarSign } from 'lucide-react';
import { useRealtimeVipStatus } from '@/hooks/useRealtimeVipStatus';
import { formatUSD } from '@/lib/utils';

interface VipUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubscribe?: (planId: string) => void;
}

export function VipUpgradeDialog({ open, onOpenChange, onSubscribe }: VipUpgradeDialogProps) {
  const { plans } = useRealtimeVipStatus();
  
  const vip1Plan = plans.find(plan => plan.level === 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Crown className="h-6 w-6 text-amber-500" />
            Upgrade para VIP Necessário
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mb-4">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold">Para realizar saques, você precisa ser VIP!</h3>
            <p className="text-muted-foreground text-sm">
              Nossos usuários VIP têm acesso exclusivo aos saques e muitos outros benefícios.
            </p>
          </div>

          {vip1Plan && (
            <div className="border rounded-lg p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-500" />
                  <h4 className="font-semibold text-lg">{vip1Plan.name}</h4>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-amber-600">{formatUSD(vip1Plan.price)}</div>
                  <div className="text-xs text-muted-foreground">{vip1Plan.duration_days} dias</div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {vip1Plan.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Star className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 text-sm font-medium text-amber-600">
                  <Zap className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <span>Acesso liberado para saques</span>
                </div>
              </div>

              <Button
                onClick={() => onSubscribe && onSubscribe(vip1Plan.id)}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                Assinar VIP {vip1Plan.name}
              </Button>
            </div>
          )}

          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}