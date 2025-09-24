import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAffiliateData } from '@/hooks/useAffiliateData';
import { useAuth } from '@/hooks/useAuth';
import { Users, UserPlus, TrendingUp, Share2, Copy, ExternalLink } from 'lucide-react';
import { formatUSD, brlToUsd } from '@/lib/utils';
import { toast } from 'sonner';

export default function Team() {
  const { profile } = useAuth();
  const { 
    totalReferrals,
    totalEarnings,
    affiliateStats,
    isLoading,
    error 
  } = useAffiliateData();

  const copyReferralLink = () => {
    if (profile?.user_number) {
      const referralLink = `${window.location.origin}/cadastro?ref=${profile.user_number}`;
      navigator.clipboard.writeText(referralLink);
      toast.success('Link de afiliado copiado!');
    }
  };

  const shareReferralLink = () => {
    if (profile?.user_number) {
      const referralLink = `${window.location.origin}/cadastro?ref=${profile.user_number}`;
      const shareText = `Junte-se à NextFund e comece a ganhar dinheiro assistindo vídeos! Use meu código de convite: ${profile.user_number}`;
      
      if (navigator.share) {
        navigator.share({
          title: 'NextFund - Ganhe Dinheiro Assistindo Vídeos',
          text: shareText,
          url: referralLink,
        });
      } else {
        // Fallback to copying the text
        navigator.clipboard.writeText(`${shareText}\n\n${referralLink}`);
        toast.success('Texto de convite copiado!');
      }
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Gestão de Equipe" description="Convide amigos e ganhe comissões">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const totalCommissions = totalEarnings;
  const pendingCommissions = 0; // We'll calculate this when we have the data structure

  return (
    <DashboardLayout title="Gestão de Equipe" description="Convide amigos e ganhe comissões">
      <div className="space-y-6">
        {/* Referral Section */}
        <Card className="glass-card border-border/50 rounded-2xl overflow-hidden bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Seu Link de Convite
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profile?.user_number && (
                <>
                  <div className="p-3 bg-muted/20 rounded-lg border border-border/30">
                    <p className="text-sm font-mono text-center break-all">
                      {window.location.origin}/cadastro?ref={profile.user_number}
                    </p>
                    <p className="text-xs text-primary font-medium mt-2 text-center">
                      🎁 Ganhe 2 vídeos extras para cada pessoa que se cadastrar!
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={copyReferralLink} className="flex-1">
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar Link
                    </Button>
                    <Button onClick={shareReferralLink} variant="outline" className="flex-1">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Compartilhar
                    </Button>
                  </div>

                  <div className="text-center">
                    <Badge variant="outline" className="border-primary/30 text-primary">
                      Código: {profile.user_number}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card border-border/50 rounded-2xl overflow-hidden bg-gradient-to-br from-success/5 to-success/10 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-success/20 rounded-lg">
                  <Users className="h-4 w-4 text-success" />
                </div>
                <span className="text-xs font-medium text-success/80">Total de Convidados</span>
              </div>
              <div className="space-y-0.5">
                <div className="text-2xl font-bold text-success">
                  {totalReferrals}
                </div>
                <p className="text-xs text-muted-foreground">Pessoas</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-primary/20 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-primary/80">Comissões Totais</span>
              </div>
              <div className="space-y-0.5">
                <div className="text-2xl font-bold text-primary">
                  {formatUSD(brlToUsd(totalCommissions))}
                </div>
                <p className="text-xs text-muted-foreground">Acumulado</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50 rounded-2xl overflow-hidden bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-warning/20 rounded-lg">
                  <UserPlus className="h-4 w-4 text-warning" />
                </div>
                <span className="text-xs font-medium text-warning/80">Pendentes</span>
              </div>
              <div className="space-y-0.5">
                <div className="text-2xl font-bold text-warning">
                  {formatUSD(brlToUsd(pendingCommissions))}
                </div>
                <p className="text-xs text-muted-foreground">Processando</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Commission Levels - Simplified for now */}
        <Card className="glass-card border-border/50 rounded-2xl overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Comissões por Nível</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Dados detalhados de comissões estarão disponíveis após a migração do banco de dados.</p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Commissions - Simplified for now */}
        <Card className="glass-card border-border/50 rounded-2xl overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Comissões Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Histórico de comissões estará disponível após a migração do banco de dados.</p>
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="glass-card border-border/50 rounded-2xl overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Como Funciona</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/20 rounded-lg flex-shrink-0">
                  <Share2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">1. Compartilhe seu link</h4>
                  <p className="text-sm text-muted-foreground">
                    Convide amigos usando seu link personalizado ou código de convite.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-success/20 rounded-lg flex-shrink-0">
                  <UserPlus className="h-4 w-4 text-success" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">2. Eles se cadastram</h4>
                  <p className="text-sm text-muted-foreground">
                    Quando alguém se cadastra com seu código, <span className="font-semibold text-success">você ganha 2 vídeos extras imediatamente!</span>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}