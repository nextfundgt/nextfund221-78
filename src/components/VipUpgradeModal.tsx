import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Check, X, Zap, Star, Gift } from 'lucide-react';
import { useVipPlans } from '@/hooks/useVipPlans';
import { PushinPayCheckoutModal } from '@/components/PushinPayCheckoutModal';
import { toast } from 'sonner';

interface VipUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger?: 'withdrawal' | 'video_limit' | 'manual';
}

export function VipUpgradeModal({ isOpen, onClose, trigger = 'manual' }: VipUpgradeModalProps) {
  const { plans, userSubscription, loading, subscribeToPlan } = useVipPlans();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  const getTriggerMessage = () => {
    switch (trigger) {
      case 'withdrawal':
        return {
          title: 'Upgrade Necessário para Saque',
          description: 'Para realizar saques, você precisa ser VIP. Escolha um plano e desbloqueie este benefício!'
        };
      case 'video_limit':
        return {
          title: 'Limite Diário Atingido',
          description: 'Você atingiu seu limite diário de vídeos. Upgrade para VIP e ganhe acesso a mais vídeos!'
        };
      default:
        return {
          title: 'Planos VIP',
          description: 'Escolha o plano ideal para maximizar seus ganhos com vídeos!'
        };
    }
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (transactionData: any) => {
    try {
      setProcessingPayment(true);
      
      if (selectedPlan) {
        await subscribeToPlan(selectedPlan);
        toast.success('Plano VIP ativado com sucesso!');
        onClose();
      }
    } catch (error) {
      toast.error('Erro ao ativar plano VIP');
    } finally {
      setProcessingPayment(false);
      setShowPayment(false);
    }
  };

  const { title, description } = getTriggerMessage();
  const currentVipLevel = userSubscription?.vip_plans?.level || 0;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Crown className="h-6 w-6 text-yellow-500" />
              {title}
            </DialogTitle>
            <p className="text-muted-foreground">{description}</p>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {plans.map((plan) => {
              const isCurrentPlan = currentVipLevel === plan.level;
              const isUpgrade = plan.level > currentVipLevel;
              
              return (
                <Card 
                  key={plan.id} 
                  className={`relative transition-all duration-300 ${
                    isCurrentPlan 
                      ? 'ring-2 ring-green-500 bg-green-50/50 dark:bg-green-900/20' 
                      : isUpgrade 
                        ? 'hover:shadow-lg cursor-pointer border-primary/20 hover:border-primary/40'
                        : 'opacity-60'
                  }`}
                >
                  {plan.level === 2 && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                        <Star className="h-3 w-3 mr-1" />
                        MAIS POPULAR
                      </Badge>
                    </div>
                  )}
                  
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <div className="flex items-center justify-center mb-2">
                        {plan.level === 1 && <Crown className="h-8 w-8 text-amber-600" />}
                        {plan.level === 2 && <Zap className="h-8 w-8 text-orange-500" />}
                        {plan.level === 3 && <Gift className="h-8 w-8 text-purple-500" />}
                      </div>
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                      <div className="text-3xl font-bold text-primary my-2">
                        R$ {plan.price.toFixed(2)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {plan.duration_days} dias
                      </p>
                    </div>

                    <div className="space-y-3 mb-6">
                      {(plan.benefits as string[]).map((benefit, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{benefit}</span>
                        </div>
                      ))}
                      
                      <div className="border-t pt-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Limite diário:</span>
                          <span className="font-semibold">{plan.daily_video_limit} vídeos</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Multiplicador:</span>
                          <span className="font-semibold text-green-600">
                            +{((plan.reward_multiplier - 1) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {isCurrentPlan ? (
                      <Button disabled className="w-full bg-green-600">
                        <Check className="h-4 w-4 mr-2" />
                        Plano Atual
                      </Button>
                    ) : isUpgrade ? (
                      <Button
                        onClick={() => handlePlanSelect(plan.id)}
                        className="w-full"
                        variant={plan.level === 2 ? 'default' : 'outline'}
                      >
                        Assinar Agora
                      </Button>
                    ) : (
                      <Button disabled className="w-full" variant="outline">
                        <X className="h-4 w-4 mr-2" />
                        Nível Inferior
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center text-sm text-muted-foreground mt-4">
            <p>✓ Pagamento seguro via PushinPay</p>
            <p>✓ Ativação imediata após confirmação</p>
            <p>✓ Suporte técnico incluído</p>
          </div>
        </DialogContent>
      </Dialog>

      {selectedPlan && (
        <PushinPayCheckoutModal
          open={showPayment}
          onOpenChange={setShowPayment}
          plan={{
            id: selectedPlan,
            name: plans.find(p => p.id === selectedPlan)?.name || '',
            min_amount: plans.find(p => p.id === selectedPlan)?.price || 0,
            expertName: 'NextFund VIP'
          }}
          onPaymentSuccess={() => handlePaymentSuccess(null)}
        />
      )}
    </>
  );
}