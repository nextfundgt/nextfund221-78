import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import { VipUpgradeModal } from '@/components/VipUpgradeModal';
import { useVipPlans } from '@/hooks/useVipPlans';
import { Crown, Zap, Gift, Star, Check, ArrowRight, User } from 'lucide-react';
import { formatBRL } from '@/lib/utils';

export default function Level() {
  const { plans, userSubscription, loading } = useVipPlans();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (loading) {
    return (
      <DashboardLayout title="Planos VIP" description="Escolha o plano ideal para maximizar seus ganhos">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const currentVipLevel = userSubscription?.vip_plans?.level || 0;

  const getPlanIcon = (level: number) => {
    if (level === 0) return User;
    if (level === 1) return Crown;
    if (level === 2) return Zap;
    if (level === 3) return Gift;
    return User;
  };

  const getPlanGradient = (level: number) => {
    if (level === 0) return 'from-gray-500/10 to-gray-600/10 border-gray-500/20';
    if (level === 1) return 'from-amber-500/10 to-amber-600/10 border-amber-500/20';
    if (level === 2) return 'from-orange-500/10 to-red-500/10 border-orange-500/20';
    if (level === 3) return 'from-purple-500/10 to-purple-600/10 border-purple-500/20';
    return 'from-gray-500/10 to-gray-600/10 border-gray-500/20';
  };

  const getPlanColor = (level: number) => {
    if (level === 0) return 'text-gray-500';
    if (level === 1) return 'text-amber-600';
    if (level === 2) return 'text-orange-500';
    if (level === 3) return 'text-purple-500';
    return 'text-gray-500';
  };

  const calculateDailyEarnings = (dailyLimit: number, rewardMultiplier: number) => {
    const baseReward = 2.00; // Base reward per task
    const multipliedReward = baseReward * rewardMultiplier;
    return dailyLimit * multipliedReward;
  };

  // Create stages including free plan (Etapa 0)
  const stages = [
    {
      level: 0,
      name: 'Gratuito',
      etapa: 'Etapa 0',
      price: 0,
      duration_days: 0,
      daily_video_limit: 10,
      reward_multiplier: 1,
      benefits: ['Acesso básico aos vídeos', 'Suporte por email'],
      isFree: true
    },
    ...plans.map(plan => ({
      ...plan,
      etapa: `VIP ${plan.level}`,
      isFree: false
    }))
  ];

  return (
    <DashboardLayout title="Planos VIP" description="Evolua por etapas e maximize seus ganhos">
      <div className="space-y-8">
        {/* Sequential Stages Layout */}
        <div className="w-full">
          <h2 className="text-2xl font-bold text-center mb-8">Evolução por Etapas</h2>
          
          {/* Desktop Layout */}
          <div className="hidden lg:block">
            <div className="flex items-center justify-between relative px-4">
              {stages.map((stage, index) => {
                const Icon = getPlanIcon(stage.level);
                const isCurrentStage = currentVipLevel === stage.level;
                const isCompleted = currentVipLevel > stage.level;
                const isUpgrade = stage.level > currentVipLevel;
                const dailyEarnings = calculateDailyEarnings(stage.daily_video_limit, stage.reward_multiplier);

                return (
                  <div key={stage.level} className="flex items-center">
                    {/* Stage Card */}
                    <Card className={`w-56 transition-all duration-300 ${
                      isCurrentStage 
                        ? `bg-gradient-to-br ${getPlanGradient(stage.level)} ring-2 ring-primary shadow-lg scale-105` 
                        : isCompleted
                          ? `bg-gradient-to-br ${getPlanGradient(stage.level)} opacity-80`
                          : isUpgrade 
                            ? `bg-gradient-to-br ${getPlanGradient(stage.level)} hover:shadow-lg cursor-pointer border-primary/20 hover:border-primary/40`
                            : 'bg-muted/30'
                    }`}>
                      <CardHeader className="text-center pb-3">
                        <div className="flex justify-center mb-2">
                          <div className={`p-3 rounded-full ${
                            isCurrentStage ? 'bg-primary/20' : isCompleted ? 'bg-success/20' : 'bg-background/50'
                          }`}>
                            <Icon className={`h-8 w-8 ${
                              isCurrentStage ? 'text-primary' : isCompleted ? 'text-success' : getPlanColor(stage.level)
                            }`} />
                          </div>
                        </div>
                        <div className="text-xs font-medium text-muted-foreground">{stage.etapa}</div>
                        <CardTitle className="text-lg">{stage.name}</CardTitle>
                        {!stage.isFree && (
                          <div className="text-xl font-bold text-primary">
                            {formatBRL(stage.price)}
                          </div>
                        )}
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        {/* Key Metrics */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-center p-2 bg-background/50 rounded">
                            <div className="font-bold">{stage.daily_video_limit}</div>
                            <div className="text-muted-foreground">Tarefas/Dia</div>
                          </div>
                          <div className="text-center p-2 bg-background/50 rounded">
                            <div className="font-bold text-success">
                              {formatBRL(2.00 * stage.reward_multiplier)}
                            </div>
                            <div className="text-muted-foreground">Por Tarefa</div>
                          </div>
                        </div>

                        <div className="text-center p-2 bg-primary/10 rounded border border-primary/20">
                          <div className="text-xs font-medium text-primary mb-1">
                            Máximo/Dia
                          </div>
                          <div className="font-bold text-primary">
                            {formatBRL(dailyEarnings)}
                          </div>
                        </div>

                        {/* Status Button */}
                        <div className="pt-2">
                          {isCurrentStage ? (
                            <Button disabled className="w-full bg-success text-white" size="sm">
                              <Check className="h-4 w-4 mr-1" />
                              Atual
                            </Button>
                          ) : isCompleted ? (
                            <Button disabled className="w-full bg-muted" size="sm" variant="outline">
                              <Check className="h-4 w-4 mr-1" />
                              Concluído
                            </Button>
                          ) : isUpgrade && !stage.isFree ? (
                            <Button
                              onClick={() => setShowUpgradeModal(true)}
                              className="w-full"
                              size="sm"
                              variant={stage.level === 2 ? 'default' : 'outline'}
                            >
                              Upgrade
                            </Button>
                          ) : stage.isFree ? (
                            <Button disabled className="w-full" size="sm" variant="outline">
                              Grátis
                            </Button>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Connector Arrow */}
                    {index < stages.length - 1 && (
                      <div className="mx-4 flex-shrink-0">
                        <ArrowRight className={`h-6 w-6 ${
                          currentVipLevel > stage.level ? 'text-success' : 'text-muted-foreground'
                        }`} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden space-y-4">
            {stages.map((stage) => {
              const Icon = getPlanIcon(stage.level);
              const isCurrentStage = currentVipLevel === stage.level;
              const isCompleted = currentVipLevel > stage.level;
              const isUpgrade = stage.level > currentVipLevel;
              const dailyEarnings = calculateDailyEarnings(stage.daily_video_limit, stage.reward_multiplier);

              return (
                <Card key={stage.level} className={`transition-all duration-300 ${
                  isCurrentStage 
                    ? `bg-gradient-to-br ${getPlanGradient(stage.level)} ring-2 ring-primary shadow-lg` 
                    : isCompleted
                      ? `bg-gradient-to-br ${getPlanGradient(stage.level)} opacity-80`
                      : isUpgrade 
                        ? `bg-gradient-to-br ${getPlanGradient(stage.level)} hover:shadow-lg cursor-pointer border-primary/20 hover:border-primary/40`
                        : 'bg-muted/30'
                }`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-full ${
                        isCurrentStage ? 'bg-primary/20' : isCompleted ? 'bg-success/20' : 'bg-background/50'
                      }`}>
                        <Icon className={`h-8 w-8 ${
                          isCurrentStage ? 'text-primary' : isCompleted ? 'text-success' : getPlanColor(stage.level)
                        }`} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">{stage.etapa}</div>
                        <CardTitle className="text-xl">{stage.name}</CardTitle>
                        {!stage.isFree && (
                          <div className="text-2xl font-bold text-primary">
                            {formatBRL(stage.price)}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-background/50 rounded-lg">
                        <div className="font-bold text-lg">{stage.daily_video_limit}</div>
                        <div className="text-xs text-muted-foreground">Tarefas/Dia</div>
                      </div>
                      <div className="text-center p-3 bg-background/50 rounded-lg">
                        <div className="font-bold text-lg text-success">
                          {formatBRL(2.00 * stage.reward_multiplier)}
                        </div>
                        <div className="text-xs text-muted-foreground">Por Tarefa</div>
                      </div>
                      <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <div className="font-bold text-lg text-primary">
                          {formatBRL(dailyEarnings)}
                        </div>
                        <div className="text-xs text-muted-foreground">Máximo/Dia</div>
                      </div>
                    </div>

                    {/* Benefits */}
                    <div className="space-y-2">
                      {(stage.benefits as string[]).slice(0, 3).map((benefit, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{benefit}</span>
                        </div>
                      ))}
                    </div>

                    {/* Status Button */}
                    <div className="pt-2">
                      {isCurrentStage ? (
                        <Button disabled className="w-full bg-success text-white">
                          <Check className="h-4 w-4 mr-2" />
                          Plano Atual
                        </Button>
                      ) : isCompleted ? (
                        <Button disabled className="w-full bg-muted" variant="outline">
                          <Check className="h-4 w-4 mr-2" />
                          Etapa Concluída
                        </Button>
                      ) : isUpgrade && !stage.isFree ? (
                        <Button
                          onClick={() => setShowUpgradeModal(true)}
                          className="w-full"
                          variant={stage.level === 2 ? 'default' : 'outline'}
                        >
                          Fazer Upgrade
                        </Button>
                      ) : stage.isFree ? (
                        <Button disabled className="w-full" variant="outline">
                          Plano Gratuito
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Current Stage Highlight (Mobile only) */}
        {currentVipLevel >= 0 && (
          <Card className="lg:hidden glass-card border-primary/50 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-primary mb-2">Sua Etapa Atual</h3>
                <div className="text-3xl font-bold">
                  {currentVipLevel === 0 ? 'Etapa 0 - Gratuito' : `VIP ${currentVipLevel}`}
                </div>
                <p className="text-muted-foreground mt-2">
                  Continue evoluindo para desbloquear mais benefícios!
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Benefits Summary */}
        <Card className="glass-card border-border/50 rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Benefícios da Evolução</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="space-y-2">
                <p>✓ Pagamento seguro via Pushin Pay</p>
                <p>✓ Ativação imediata após confirmação</p>
                <p>✓ Mais tarefas diárias disponíveis</p>
              </div>
              <div className="space-y-2">
                <p>✓ Multiplicador de recompensas crescente</p>
                <p>✓ Suporte técnico incluído</p>
                <p>✓ Acesso a vídeos exclusivos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <VipUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        trigger="manual"
      />
    </DashboardLayout>
  );
}