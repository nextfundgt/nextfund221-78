import { useState, useMemo, memo, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, Share2, Users, TrendingUp, DollarSign, Award, Trophy, ExternalLink, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAffiliateData } from '@/hooks/useAffiliateData';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/DashboardLayout';

// Lazy load non-critical components
const ShareModal = lazy(() => import('@/components/ShareModal').then(module => ({ default: module.ShareModal })));

interface AffiliateStats {
  level_1_count: number;
  level_2_count: number;
  level_3_count: number;
  level_4_count: number;
  level_5_count: number;
  level_6_count: number;
  level_7_count: number;
  level_8_count: number;
  level_9_count: number;
  level_10_count: number;
  level_1_earnings: number;
  level_2_earnings: number;
  level_3_earnings: number;
  level_4_earnings: number;
  level_5_earnings: number;
  level_6_earnings: number;
  level_7_earnings: number;
  level_8_earnings: number;
  level_9_earnings: number;
  level_10_earnings: number;
  total_earnings: number;
}

// Memoize static configuration
const levelConfig = [
  { level: 1, rate: 12, color: 'bg-emerald-500', textColor: 'text-emerald-600', name: 'Esmeralda', minReferrals: 1, icon: '💎' },
  { level: 2, rate: 9, color: 'bg-green-500', textColor: 'text-green-600', name: 'Verde', minReferrals: 3, icon: '🟢' },
  { level: 3, rate: 7, color: 'bg-lime-500', textColor: 'text-lime-600', name: 'Lima', minReferrals: 5, icon: '🟡' },
  { level: 4, rate: 5, color: 'bg-blue-600', textColor: 'text-blue-600', name: 'Azul Escuro', minReferrals: 10, icon: '🔵' },
  { level: 5, rate: 10, color: 'bg-blue-500', textColor: 'text-blue-500', name: 'Azul', minReferrals: 20, icon: '🔷' },
  { level: 6, rate: 3, color: 'bg-cyan-500', textColor: 'text-cyan-600', name: 'Ciano', minReferrals: 50, icon: '🔶' },
  { level: 7, rate: 2.5, color: 'bg-yellow-500', textColor: 'text-yellow-600', name: 'Ouro', minReferrals: 100, icon: '🏆' },
  { level: 8, rate: 2, color: 'bg-orange-500', textColor: 'text-orange-600', name: 'Laranja', minReferrals: 200, icon: '🥇' },
  { level: 9, rate: 1.5, color: 'bg-red-400', textColor: 'text-red-500', name: 'Rubi', minReferrals: 500, icon: '💍' },
  { level: 10, rate: 1, color: 'bg-purple-600', textColor: 'text-purple-600', name: 'Diamante', minReferrals: 1000, icon: '👑' },
];

// Skeleton component for loading states
const StatsSkeleton = memo(() => (
  <div className="grid grid-cols-2 gap-3">
    <Card className="rounded-3xl p-6 backdrop-blur-xl border border-white/20" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
      <CardContent className="p-4">
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-16 mx-auto" />
          <Skeleton className="h-4 w-24 mx-auto" />
        </div>
      </CardContent>
    </Card>
    <Card className="rounded-3xl p-6 backdrop-blur-xl border border-white/20" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
      <CardContent className="p-4">
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-20 mx-auto" />
          <Skeleton className="h-4 w-20 mx-auto" />
        </div>
      </CardContent>
    </Card>
  </div>
));

// Memoized level card component
const LevelCard = memo(({ config, count, earnings }: { 
  config: typeof levelConfig[0], 
  count: number, 
  earnings: number 
}) => (
  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/20 touch-target">
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <span className="text-lg">{config.icon}</span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-white">Nível {config.level}</span>
            <Badge variant="outline" className={`text-xs ${config.textColor} px-2 py-0.5`}>
              {config.rate}%
            </Badge>
          </div>
          <p className="text-xs text-white/60 truncate">{config.name}</p>
        </div>
      </div>
    </div>
    
    <div className="text-right flex-shrink-0">
      <div className="text-sm font-bold text-white">{count}</div>
      <div className="text-xs text-green-400">R$ {earnings.toFixed(2)}</div>
    </div>
  </div>
));

export default memo(function Affiliate() {
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  
  // Use the optimized hook for affiliate data
  const { affiliateStats, isLoading, dataFetched, totalReferrals, totalEarnings } = useAffiliateData(profile?.user_id);

  // Memoize expensive calculations
  const topLevels = useMemo(() => {
    return levelConfig
      .filter(config => {
        const count = affiliateStats?.[`level_${config.level}_count` as keyof AffiliateStats] as number || 0;
        return count > 0;
      })
      .sort((a, b) => {
        const aCount = affiliateStats?.[`level_${a.level}_count` as keyof AffiliateStats] as number || 0;
        const bCount = affiliateStats?.[`level_${b.level}_count` as keyof AffiliateStats] as number || 0;
        return bCount - aCount;
      })
      .slice(0, 3);
  }, [affiliateStats]);

  const fetchAffiliateData = async () => {
    // This function is now handled by the custom hook
    console.log('Using custom hook for data fetching');
  };

  const copyAffiliateLink = async () => {
    if (!profile?.affiliate_code) return;

    const affiliateLink = `${window.location.origin}/?ref=${profile.affiliate_code}`;
    
    try {
      await navigator.clipboard.writeText(affiliateLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Link copiado!',
        description: 'O link de afiliado foi copiado para a área de transferência.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o link.',
        variant: 'destructive',
      });
    }
  };

  // If not authenticated, show login prompt
  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-sm mx-auto">
            <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-xl font-bold mb-3">Acesso Restrito</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Você precisa estar logado para acessar o sistema de afiliados.
            </p>
            <Button onClick={() => window.location.href = '/login'} className="w-full btn-mobile">
              Fazer Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading only when initial loading or when fetching data for the first time
  if (loading || (isLoading && !dataFetched)) {
    return (
      <DashboardLayout 
        title="Programa de Afiliados" 
        description="Sistema de 10 níveis de comissão"
        showBackButton={true}
      >
        <div className="space-y-4 max-w-full overflow-hidden">
          <StatsSkeleton />
          
          <Card className="rounded-3xl p-6 backdrop-blur-xl border border-white/20" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
            <CardContent className="space-y-4">
              <Skeleton className="h-6 w-48" />
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl p-6 backdrop-blur-xl border border-white/20" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
            <CardContent>
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Fallback for technical error - this should never happen in normal operation
  if (!profile?.affiliate_code && dataFetched) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-sm mx-auto">
            <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-xl font-bold mb-3">Erro Técnico</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Erro na geração do código de afiliado. Entre em contato com o suporte.
            </p>
            <Button onClick={() => window.location.href = '/support'} className="w-full btn-mobile">
              Contatar Suporte
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Use memoized values instead of recalculating

  return (
    <DashboardLayout 
      title="Programa de Afiliados" 
      description="Sistema de 10 níveis de comissão"
      showBackButton={true}
    >
      <div className="space-y-4 max-w-full overflow-hidden">
        {/* Header Stats - Mobile Optimized */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="rounded-3xl p-4 backdrop-blur-xl border border-white/20" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400 mb-1">{totalReferrals}</div>
                <p className="text-xs text-white/60">Total Indicados</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl p-4 backdrop-blur-xl border border-white/20" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400 mb-1">
                  R$ {totalEarnings.toFixed(2)}
                </div>
                <p className="text-xs text-white/60">Total Ganho</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Affiliate Link Card - Mobile First */}
        <Card className="rounded-3xl p-6 backdrop-blur-xl border border-white/20" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <Share2 className="h-4 w-4" />
              Seu Link de Indicação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Affiliate Code Display */}
            <div className="p-3 bg-white/5 rounded-lg border border-white/20">
              <div className="text-center space-y-2">
                <p className="text-xs text-white/60">Seu Código</p>
                <Badge variant="secondary" className="text-sm font-mono px-3 py-1 bg-white/10 text-white">
                  {profile?.affiliate_code || 'Loading...'}
                </Badge>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={copyAffiliateLink}
                className="btn-mobile flex items-center gap-2"
                disabled={!profile?.affiliate_code}
              >
                <Copy className="h-4 w-4" />
                {copied ? 'Copiado!' : 'Copiar'}
              </Button>
              <Button
                onClick={() => setShowShareModal(true)}
                className="btn-mobile flex items-center gap-2"
                disabled={!profile?.affiliate_code}
              >
                <ExternalLink className="h-4 w-4" />
                Compartilhar
              </Button>
            </div>

            {/* Reward Info */}
            <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <p className="text-xs text-white/80">
                💰 Ganhe até <span className="font-bold text-green-400">12%</span> por indicação
              </p>
            </div>
          </CardContent>
        </Card>

        {/* How it Works - Compact Mobile Version */}
        <Card className="rounded-3xl p-6 backdrop-blur-xl border border-white/20" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <Award className="h-4 w-4" />
              Como Funciona
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-green-400">1</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">Compartilhe seu link</p>
                  <p className="text-xs text-white/60">Envie para amigos e familiares</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-green-400">2</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">Eles se cadastram</p>
                  <p className="text-xs text-white/60">Usando seu código de indicação</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-green-400">3</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">Você ganha comissões</p>
                  <p className="text-xs text-white/60">Em 10 níveis de profundidade</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commission Levels - Mobile Grid */}
        <Card className="rounded-3xl p-6 backdrop-blur-xl border border-white/20" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">Níveis de Comissão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              {levelConfig.map((config) => {
                const count = affiliateStats?.[`level_${config.level}_count` as keyof AffiliateStats] as number || 0;
                const earnings = affiliateStats?.[`level_${config.level}_earnings` as keyof AffiliateStats] as number || 0;
                
                return (
                  <LevelCard 
                    key={config.level} 
                    config={config} 
                    count={count} 
                    earnings={earnings} 
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Performers - Only show if has referrals */}
        {totalReferrals > 0 && (
          <Suspense fallback={<Skeleton className="h-32 w-full" />}>
            <Card className="rounded-3xl p-6 backdrop-blur-xl border border-white/20" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-white">
                  <Trophy className="h-4 w-4" />
                  Seus Melhores Níveis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topLevels.map((config, index) => {
                    const count = affiliateStats?.[`level_${config.level}_count` as keyof AffiliateStats] as number || 0;
                    const earnings = affiliateStats?.[`level_${config.level}_earnings` as keyof AffiliateStats] as number || 0;
                    
                    return (
                      <div key={config.level} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/20">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>
                          <div>
                            <p className="font-medium text-sm text-white">Nível {config.level} - {config.name}</p>
                            <p className="text-xs text-white/60">{config.rate}% de comissão</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm text-white">{count} indicados</p>
                          <p className="text-xs text-green-400">R$ {earnings.toFixed(2)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </Suspense>
        )}

        {/* Benefits - Compact */}
        <Card className="rounded-3xl p-6 backdrop-blur-xl border border-white/20" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <Star className="h-4 w-4" />
              Vantagens do Programa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                <p className="text-sm text-white">Comissões de até <span className="font-bold text-green-400">12%</span></p>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                <p className="text-sm text-white">Pagamentos <span className="font-bold text-green-400">automáticos</span></p>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                <p className="text-sm text-white">Sistema de <span className="font-bold text-blue-400">10 níveis</span></p>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                <div className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0"></div>
                <p className="text-sm text-white">Sem limite de <span className="font-bold text-yellow-400">indicações</span></p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Empty State for No Referrals */}
        {totalReferrals === 0 && (
          <Card className="rounded-3xl p-6 backdrop-blur-xl border border-white/20" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                  <Users className="h-8 w-8 text-green-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2 text-white">Comece a Indicar!</h3>
                  <p className="text-sm text-white/60 mb-4">
                    Compartilhe seu link e ganhe comissões em 10 níveis
                  </p>
                </div>
                <Button 
                  onClick={() => setShowShareModal(true)}
                  className="btn-mobile w-full"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar Agora
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
        
      <Suspense fallback={<div />}>
        <ShareModal 
          open={showShareModal} 
          onOpenChange={setShowShareModal}
          affiliateCode={profile?.affiliate_code || ''}
        />
      </Suspense>
    </DashboardLayout>
  );
});