import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, Activity } from 'lucide-react';
import { useRealtimeBalance } from '@/hooks/useRealtime';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { formatUSD, brlToUsd } from '@/lib/utils';

export const RealtimeBalance = () => {
  const balance = useRealtimeBalance();
  const { preferences } = useUserPreferences();

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
          <p className="text-xs text-muted-foreground">Atualização em tempo real</p>
        </div>
      </CardContent>
    </Card>
  );
};