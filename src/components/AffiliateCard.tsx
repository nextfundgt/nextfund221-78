import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Users, TrendingUp, DollarSign } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AffiliateStats {
  clicks_count: number;
  signups_count: number;
  rewards_total: number;
}

export function AffiliateCard() {
  const [affiliateStats, setAffiliateStats] = useState<AffiliateStats | null>(null);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.user_id) {
      fetchAffiliateStats();
    }
  }, [profile]);

  const fetchAffiliateStats = async () => {
    if (!profile?.user_id) return;

    try {
      const { data, error } = await supabase
        .from('affiliates')
        .select('clicks_count, signups_count, rewards_total')
        .eq('user_id', profile.user_id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching affiliate stats:', error);
        return;
      }

      setAffiliateStats(data || { clicks_count: 0, signups_count: 0, rewards_total: 0 });
    } catch (error) {
      console.error('Error fetching affiliate stats:', error);
    }
  };

  const copyAffiliateLink = async () => {
    if (!profile?.affiliate_code) return;

    const affiliateLink = `${window.location.origin}/?ref=${profile.affiliate_code}`;
    
    try {
      await navigator.clipboard.writeText(affiliateLink);
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

  if (!profile?.affiliate_code) {
    return null;
  }

  return (
    <Card className="glass-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Users className="h-5 w-5" />
          Programa de Afiliados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-muted/20 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium">Seu Código de Afiliado:</p>
              <Badge variant="secondary" className="mt-1">
                {profile.affiliate_code}
              </Badge>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={copyAffiliateLink}
              className="flex items-center gap-2 min-h-[40px]"
            >
              <Copy className="h-4 w-4" />
              <span className="hidden xs:inline">Copiar Link</span>
              <span className="xs:hidden">Copiar</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 sm:gap-4">
          <div className="text-center p-2 sm:p-0">
            <div className="text-base sm:text-lg font-bold text-primary">
              {affiliateStats?.clicks_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">Cliques</p>
          </div>
          <div className="text-center p-2 sm:p-0">
            <div className="text-base sm:text-lg font-bold text-success">
              {affiliateStats?.signups_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">Cadastros</p>
          </div>
          <div className="text-center p-2 sm:p-0">
            <div className="text-base sm:text-lg font-bold text-accent">
              R$ {(affiliateStats?.rewards_total || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Recompensas</p>
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-center px-2">
          Ganhe R$ 10 por cada pessoa que se cadastrar usando seu link de afiliado
        </div>
      </CardContent>
    </Card>
  );
}