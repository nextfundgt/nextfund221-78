import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCPF, isValidCPF } from "@/lib/cpfValidator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, QrCode, Copy, Check } from "lucide-react";

interface PushinPayCheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: {
    id: string;
    name: string;
    min_amount: number;
    expertName: string;
  };
  onPaymentSuccess: () => void;
}

interface QRCodeData {
  qr_code: string;
  qr_code_image: string;
  qr_code_id: string;
  pix_key: string;
  amount: number;
  expires_at: string;
  status: string;
}

export function PushinPayCheckoutModal({ open, onOpenChange, plan, onPaymentSuccess }: PushinPayCheckoutModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    cpf: ''
  });
  const [loading, setLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<QRCodeData | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    if (field === 'cpf') {
      value = formatCPF(value);
    } else if (field === 'phone') {
      // Format phone: (11) 99999-9999
      value = value.replace(/\D/g, '');
      if (value.length <= 11) {
        value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      }
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.phone.trim()) {
      toast({
        title: "Erro", 
        description: "Telefone é obrigatório",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast({
        title: "Erro",
        description: "Email válido é obrigatório",
        variant: "destructive"
      });
      return false;
    }

    if (!isValidCPF(formData.cpf)) {
      toast({
        title: "Erro",
        description: "CPF inválido",
        variant: "destructive"
      });
      return false;
    }

    // Validar limite de valor da Pushin Pay
    if (plan.min_amount > 150) {
      toast({
        title: "Valor Excede Limite",
        description: "O valor máximo para PIX via Pushin Pay é R$ 150,00. Entre em contato com o suporte para aumentar o limite.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleGenerateQRCode = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      // Create transaction record first
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          type: 'deposit',
          amount: plan.min_amount,
          status: 'pending',
          method: 'pushin_pay',
          name: formData.name,
          email: formData.email,
          cpf: formData.cpf,
          notes: `VIP - ${plan.name}`
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Generate QR code via Pushin Pay usando a nova edge function
      const { data, error } = await supabase.functions.invoke('pushinpay-checkout', {
        body: {
          nome: formData.name,
          telefone: formData.phone.replace(/\D/g, ''),
          email: formData.email,
          cpf: formData.cpf.replace(/\D/g, ''),
          valor: plan.min_amount,
          descricao: `VIP - ${plan.name}`
        }
      });

      if (error) throw error;

      if (!data.qrCode) {
        throw new Error('Erro ao gerar QR code');
      }

      // Update transaction with QR code data
      await supabase
        .from('transactions')
        .update({
          qr_code_id: data.transactionId,
          qr_code_image: data.qrCode,
          pix_key: data.pixKey
        })
        .eq('id', transaction.id);

      setQrCodeData({
        qr_code: data.pixKey,
        qr_code_image: data.qrCode,
        qr_code_id: data.transactionId,
        pix_key: data.pixKey,
        amount: plan.min_amount,
        expires_at: null,
        status: data.status
      });
      
      toast({
        title: "QR Code Gerado!",
        description: "Escaneie o QR code ou copie o código PIX para fazer o pagamento",
      });

    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar QR code. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPixCode = async () => {
    if (qrCodeData?.qr_code) {
      await navigator.clipboard.writeText(qrCodeData.qr_code);
      setCopied(true);
      toast({
        title: "Copiado!",
        description: "Código PIX copiado para a área de transferência",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', cpf: '' });
    setQrCodeData(null);
    setCopied(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {qrCodeData ? 'Pagamento via PIX' : 'Finalizar Compra'}
          </DialogTitle>
        </DialogHeader>

        {!qrCodeData ? (
          <div className="space-y-4">
            {/* Plan info */}
            <Card className="p-3 bg-muted/20">
              <div className="text-center">
                <h3 className="font-semibold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">Por {plan.expertName}</p>
                <div className="text-2xl font-bold text-success mt-2">
                  R$ {plan.min_amount.toFixed(2)}
                </div>
                {plan.min_amount > 150 && (
                  <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-xs text-destructive">
                      ⚠️ Valor excede limite PIX (R$ 150,00)
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Form fields */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => handleInputChange('cpf', e.target.value)}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>
            </div>

            <Button
              onClick={handleGenerateQRCode}
              disabled={loading}
              className="w-full h-12 bg-success hover:bg-success/90 text-success-foreground font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando QR Code...
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4 mr-2" />
                  Criar QR Code
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Payment info */}
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-success mb-2">
                R$ {qrCodeData.amount.toFixed(2)}
              </div>
              <Badge variant="outline" className="mb-4">
                Aguardando Pagamento
              </Badge>
              
              {/* QR Code image */}
              <div className="flex justify-center mb-4">
                {qrCodeData.qr_code_image ? (
                  <img 
                    src={qrCodeData.qr_code_image} 
                    alt="QR Code PIX" 
                    className="w-48 h-48 border rounded-lg"
                    onError={(e) => {
                      console.error('Error loading QR code image:', e);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                    <QrCode className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* PIX code to copy */}
              <div className="space-y-2">
                <Label className="text-sm">Código PIX (Copiar e Colar)</Label>
                <div className="flex gap-2">
                  <Input
                    value={qrCodeData.qr_code}
                    readOnly
                    className="text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyPixCode}
                    className="shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="text-xs text-muted-foreground mt-4 space-y-1">
                <p>1. Abra o app do seu banco</p>
                <p>2. Escaneie o QR code ou cole o código PIX</p>
                <p>3. Confirme o pagamento</p>
                <p>4. Aguarde a confirmação automática</p>
              </div>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}