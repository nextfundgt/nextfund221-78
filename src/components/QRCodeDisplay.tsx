import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QRCodeDisplayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCodeData: {
    id: string;
    qr_code: string;
    qr_code_base64: string;
    amount: number;
    expires_at: string;
  } | null;
  onPaymentConfirmed: () => void;
}

export function QRCodeDisplay({ open, onOpenChange, qrCodeData, onPaymentConfirmed }: QRCodeDisplayProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (!qrCodeData?.expires_at) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(qrCodeData.expires_at).getTime();
      const diff = expiry - now;

      if (diff > 0) {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeLeft('Expirado');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [qrCodeData?.expires_at]);

  const handleCopyPixCode = async () => {
    if (qrCodeData?.qr_code) {
      await navigator.clipboard.writeText(qrCodeData.qr_code);
      toast({
        title: 'Copiado!',
        description: 'Código PIX copiado para a área de transferência',
      });
    }
  };

  if (!qrCodeData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pagamento PIX
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                R$ {qrCodeData.amount.toFixed(2)}
              </CardTitle>
              <div className="flex justify-center gap-2">
                <Badge variant="secondary">
                  Aguardando pagamento
                </Badge>
                {timeLeft && timeLeft !== 'Expirado' && (
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    {timeLeft}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <>
                <div className="flex justify-center">
                  {qrCodeData.qr_code_base64 ? (
                    <img 
                      src={qrCodeData.qr_code_base64.startsWith('data:') 
                        ? qrCodeData.qr_code_base64 
                        : `data:image/png;base64,${qrCodeData.qr_code_base64}`}
                      alt="QR Code PIX"
                      className="w-48 h-48 border rounded-lg bg-white p-2"
                      onError={(e) => {
                        console.error('Error loading QR code image');
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-48 h-48 border rounded-lg bg-muted/20 flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">QR Code não disponível</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Código PIX Copia e Cola:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={qrCodeData.qr_code}
                      readOnly
                      className="flex-1 p-2 text-xs border rounded bg-muted/20 font-mono"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyPixCode}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-3 bg-muted/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div className="text-xs text-muted-foreground">
                      <p>• Abra o app do seu banco</p>
                      <p>• Escaneie o QR Code ou cole o código PIX</p>
                      <p>• Confirme o pagamento</p>
                      <p>• O depósito será processado automaticamente</p>
                    </div>
                  </div>
                </div>
              </>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}