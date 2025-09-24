import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Check, Settings } from 'lucide-react';
import { toast } from "sonner";

interface PaymentGateway {
  id: string;
  name: string;
  provider: string;
  required_fields: string[];
  is_active: boolean;
  priority: number;
}

interface GatewaySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGatewaySelect: (gateway: PaymentGateway) => void;
  amount: number;
}

export function GatewaySelectionModal({
  isOpen,
  onClose,
  onGatewaySelect,
  amount
}: GatewaySelectionModalProps) {
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  const [savePreference, setSavePreference] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchGateways();
    }
  }, [isOpen]);

  const fetchGateways = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_gateways')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) throw error;
      setGateways((data || []).map(gateway => ({
        ...gateway,
        required_fields: Array.isArray(gateway.required_fields) 
          ? gateway.required_fields as string[]
          : JSON.parse(gateway.required_fields as string) as string[]
      })) as PaymentGateway[]);
      
      // Auto-select highest priority gateway
      if (data && data.length > 0) {
        setSelectedGateway(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching gateways:', error);
      toast.error('Erro ao carregar gateways de pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = async () => {
    if (!selectedGateway) {
      toast.error('Selecione um gateway de pagamento');
      return;
    }

    const gateway = gateways.find(g => g.id === selectedGateway);
    if (!gateway) return;

    try {
      // Save user preference if requested
      if (savePreference) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('user_payment_preferences')
            .upsert({
              user_id: user.id,
              preferred_gateway_id: selectedGateway
            });
        }
      }

      onGatewaySelect(gateway);
      onClose();
    } catch (error) {
      console.error('Error saving preference:', error);
      // Continue anyway
      onGatewaySelect(gateway);
      onClose();
    }
  };

  const getProviderIcon = (provider: string) => {
    const iconMap: Record<string, string> = {
      pushinpay: '🚀',
      mercadopago: '💳',
      pagseguro: '🔒',
      picpay: '📱',
      custom: '⚙️'
    };
    return iconMap[provider] || '💰';
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Selecionando Gateway...</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 glass-card rounded-lg"></div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Escolha o Gateway PIX
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="text-center py-4">
            <div className="text-2xl font-bold text-primary">
              R$ {amount.toFixed(2).replace('.', ',')}
            </div>
            <p className="text-sm text-muted-foreground">
              Valor do pagamento PIX
            </p>
          </div>

          {gateways.length === 0 ? (
            <Card className="glass-card border-border">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Settings className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-center text-muted-foreground">
                  Nenhum gateway de pagamento ativo encontrado
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {gateways.length === 1 
                  ? 'Gateway de pagamento disponível:'
                  : 'Selecione o gateway de pagamento:'
                }
              </p>
              
              {gateways.map((gateway) => (
                <Card
                  key={gateway.id}
                  className={`glass-card border cursor-pointer transition-all ${
                    selectedGateway === gateway.id
                      ? 'ring-2 ring-primary border-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedGateway(gateway.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-xl">
                          {getProviderIcon(gateway.provider)}
                        </div>
                        <div>
                          <CardTitle className="text-base">{gateway.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {gateway.provider.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      {selectedGateway === gateway.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Dados necessários:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {gateway.required_fields.map(field => (
                            <Badge key={field} variant="outline" className="text-xs">
                              {field.toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {gateways.length > 1 && (
                <div className="flex items-center space-x-2 py-2">
                  <Checkbox
                    id="save-preference"
                    checked={savePreference}
                    onCheckedChange={(checked) => setSavePreference(checked as boolean)}
                  />
                  <label
                    htmlFor="save-preference"
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    Lembrar minha escolha para próximos pagamentos
                  </label>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleProceed} 
              disabled={!selectedGateway || gateways.length === 0}
              className="flex-1"
            >
              Continuar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}