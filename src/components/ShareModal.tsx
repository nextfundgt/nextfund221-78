import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, MessageCircle, Send, Mail, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  affiliateCode: string;
}

export function ShareModal({ open, onOpenChange, affiliateCode }: ShareModalProps) {
  const { toast } = useToast();
  
  const affiliateLink = `${window.location.origin}/?ref=${affiliateCode}`;
  const shareMessage = `🚀 Descubra a NextFund - a plataforma de ganhos com vídeos que está revolucionando os ganhos online!

💰 Ganhe dinheiro assistindo vídeos
📈 Acompanhe seus ganhos em tempo real  
🎯 Tarefas simples e recompensas garantidas

Use meu código de indicação: ${affiliateCode}

Cadastre-se agora: ${affiliateLink}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(affiliateLink);
      toast({
        title: 'Link copiado!',
        description: 'O link foi copiado para a área de transferência.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o link.',
        variant: 'destructive',
      });
    }
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      toast({
        title: 'Mensagem copiada!',
        description: 'A mensagem foi copiada para a área de transferência.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar a mensagem.',
        variant: 'destructive',
      });
    }
  };

  const shareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
  };

  const shareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(affiliateLink)}&text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
  };

  const shareEmail = () => {
    const subject = 'Convite para NextFund - Plataforma de Ganhos';
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shareMessage)}`;
    window.open(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Compartilhar Link de Indicação
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Share Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={shareWhatsApp}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
            
            <Button
              onClick={shareTelegram}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Telegram
            </Button>
            
            <Button
              onClick={shareEmail}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>
            
            <Button
              onClick={copyMessage}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copiar Texto
            </Button>
          </div>

          {/* Link Section */}
          <div className="space-y-2">
            <Label htmlFor="link">Seu Link de Indicação</Label>
            <div className="flex gap-2">
              <Input
                id="link"
                value={affiliateLink}
                readOnly
                className="flex-1"
              />
              <Button onClick={copyLink} size="sm" variant="outline">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Message Preview */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem de Convite</Label>
            <textarea
              id="message"
              value={shareMessage}
              readOnly
              className="w-full p-3 border rounded-md resize-none text-sm bg-muted/20"
              rows={8}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}