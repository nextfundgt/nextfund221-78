import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, Activity } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { formatUSD, brlToUsd } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const RealtimeBalance = () => {
  const { user, profile } = useAuth();
  const { preferences } = useUserPreferences();
  const [balance, setBalance] = useState<number>(0);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (profile?.balance !== undefined) {
      setBalance(profile.balance);
    }
  }, [profile?.balance]);

  useEffect(() => {
    if (!user) return;

    console.log('Setting up realtime balance subscription for user:', user.id);

    // Set up realtime subscription for profile balance changes
    const channel = supabase
      .channel('balance-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Balance update received:', payload);
          const newProfile = payload.new as any;
          setBalance(newProfile.balance);
          setLastUpdate(new Date());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <Card className="glass-card-mobile border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-primary/20 rounded-lg">
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <span className="text-xs font-medium text-primary/80">Saldo</span>
          <Badge variant="outline" className="text-xs h-5 px-1.5">
            <Activity className="h-2 w-2 mr-1" />
            Live
          </Badge>
        </div>
        <div className="space-y-0.5">
          <div className="text-lg font-bold text-primary">
            {preferences?.show_balance ? formatUSD(brlToUsd(balance)) : "***"}
          </div>
          <p className="text-xs text-muted-foreground">
            Atualizado: {lastUpdate.toLocaleTimeString('pt-BR')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};