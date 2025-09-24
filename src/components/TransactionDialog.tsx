import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeVipStatus } from '@/hooks/useRealtimeVipStatus';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, CreditCard, Crown } from 'lucide-react';
import { formatCPF, isValidCPF } from '@/lib/cpfValidator';
import { formatUSD, usdToBrl, brlToUsd } from '@/lib/utils';

interface TransactionDialogProps {
  type: 'deposit' | 'withdraw';
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onVipUpgradeRequired?: () => void;
}

export function TransactionDialog({ type, trigger, open: controlledOpen, onOpenChange, onVipUpgradeRequired }: TransactionDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [formData, setFormData] = useState({
    amount: '',
    method: 'pix',
    notes: '',
    name: '',
    email: '',
    cpf: ''
  });
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();
  const { hasVipAccess } = useRealtimeVipStatus();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !formData.amount || !formData.name) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    const usdAmount = parseFloat(formData.amount);
    
    if (usdAmount < 5) {
      toast({
        title: 'Erro',
        description: 'O valor mínimo é $5.00.',
        variant: 'destructive',
      });
      return;
    }

    // Convert to BRL for backend operations
    const brlAmount = usdToBrl(usdAmount);

    // For deposits, validate limits and additional fields
    if (type === 'deposit') {
      if (usdAmount > 25) {
        toast({
          title: 'Valor Excede Limite',
          description: 'O valor máximo para depósito é $25.00.',
          variant: 'destructive',
        });
        return;
      }

      if (!formData.email || !formData.cpf) {
        toast({
          title: 'Erro',
          description: 'Email e CPF são obrigatórios para depósitos.',
          variant: 'destructive',
        });
        return;
      }

      if (!isValidCPF(formData.cpf)) {
        toast({
          title: 'CPF inválido',
          description: 'Por favor, digite um CPF válido.',
          variant: 'destructive',
        });
        return;
      }
    }

    if (type === 'withdraw' && profile && brlAmount > profile.balance) {
      toast({
        title: 'Saldo insuficiente',
        description: `Você não tem saldo suficiente. Saldo atual: ${formatUSD(brlToUsd(profile.balance))}`,
        variant: 'destructive',
      });
      return;
    }

    if (type === 'withdraw' && usdAmount < 15) {
      toast({
        title: 'Erro',
        description: 'O valor mínimo para saque é $15.00.',
        variant: 'destructive',
      });
      return;
    }

    // Check VIP requirement for withdrawals
    if (type === 'withdraw' && !hasVipAccess(1)) {
      toast({
        title: 'VIP Necessário',
        description: 'Para realizar saques, você precisa ser VIP nível 1 ou superior.',
        variant: 'destructive',
      });
      
      if (onVipUpgradeRequired) {
        onVipUpgradeRequired();
      }
      
      setOpen(false);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type,
          amount: brlAmount, // Store in BRL in database
          method: formData.method,
          notes: formData.notes ? `${formData.notes} (${formatUSD(usdAmount)})` : `${formatUSD(usdAmount)}`,
          name: formData.name,
          email: formData.email || null,
          cpf: formData.cpf || null,
          status: 'pending'
        });

      if (error) {
        throw error;
      }

      toast({
        title: type === 'deposit' ? 'Depósito solicitado!' : 'Saque solicitado!',
        description: type === 'deposit' 
          ? 'Sua solicitação de depósito foi enviada e está aguardando aprovação.'
          : 'Sua solicitação de saque foi enviada e está aguardando aprovação.',
      });

      resetForm();
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao processar solicitação. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ amount: '', method: 'pix', notes: '', name: '', email: '', cpf: '' });
    setOpen(false);
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'cpf') {
      value = formatCPF(value);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto modal-mobile">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            {type === 'deposit' ? (
              <>
                <DollarSign className="h-5 w-5" />
                Fazer Depósito
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5" />
                Solicitar Saque
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Nome Completo</Label>
            <Input
              id="name"
              type="text"
              placeholder="Seu nome completo"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              className="form-input-mobile"
            />
          </div>

          {type === 'deposit' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  className="form-input-mobile"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf" className="text-sm font-medium">CPF</Label>
                <Input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={(e) => handleInputChange('cpf', e.target.value)}
                  maxLength={14}
                  required
                  className="form-input-mobile"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">Valor ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="5"
              placeholder="5.00"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              required
              className="form-input-mobile"
            />
            <p className="text-xs text-muted-foreground">
              {type === 'deposit' ? 'Mín: $5.00 | Máx: $25.00' : 'Valor mínimo: $15.00 (VIP necessário)'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="method" className="text-sm font-medium">Método</Label>
            <Select value={formData.method} onValueChange={(value) => handleInputChange('method', value)}>
              <SelectTrigger className="form-input-mobile">
                <SelectValue placeholder="Selecione o método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="transfer">Transferência Bancária</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder={type === 'deposit' 
                ? 'Dados adicionais (opcional)'
                : 'Dados para saque (chave PIX, conta, etc.)'
              }
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="text-base resize-none min-h-[80px]"
            />
          </div>

          {type === 'withdraw' && profile && (
            <div className="p-3 bg-muted/20 rounded-lg space-y-2">
              <p className="text-sm text-muted-foreground">
                Saldo disponível: <span className="font-medium text-primary">{formatUSD(brlToUsd(profile.balance))}</span>
              </p>
              {!hasVipAccess(1) && (
                <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-md border border-amber-500/20">
                  <Crown className="h-4 w-4 text-amber-500" />
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    VIP necessário para saques
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="btn-mobile w-full"
              onClick={resetForm}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="btn-mobile w-full"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  Processando...
                </span>
              ) : (
                type === 'deposit' ? 'Solicitar Depósito' : 'Solicitar Saque'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}