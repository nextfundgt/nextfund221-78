import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Plus, Clock, CheckCircle, XCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/DashboardLayout';

interface Ticket {
  id: string;
  subject: string;
  message: string;
  response?: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

const priorityOptions = [
  { value: 'low', label: 'Baixa', color: 'bg-muted text-muted-foreground' },
  { value: 'medium', label: 'Média', color: 'bg-warning text-warning-foreground' },
  { value: 'high', label: 'Alta', color: 'bg-destructive text-destructive-foreground' },
];

const faqItems = [
  {
    question: 'Como funciona o sistema de tarefas?',
    answer: 'Nossa plataforma oferece diferentes tarefas de vídeo com recompensas diárias. Você assiste aos vídeos, responde as perguntas e recebe pagamentos instantâneos via PIX.'
  },
  {
    question: 'Qual é o tempo de processamento para saques?',
    answer: 'Saques via PIX são processados instantaneamente. Transferências bancárias levam de 1 a 2 dias úteis para serem processadas.'
  },
  {
    question: 'Como funciona o programa de afiliados?',
    answer: 'Você ganha comissões em 3 níveis: 8% do nível 1 (indicados diretos), 3% do nível 2 e 1,5% do nível 3. As comissões são pagas automaticamente quando seus indicados ganham com as tarefas.'
  },
  {
    question: 'Existe valor mínimo para sacar?',
    answer: 'O saque mínimo é de R$ 10,00. Não há limite máximo, você pode sacar seus ganhos assim que atingir o valor mínimo.'
  },
  {
    question: 'Os ganhos são seguros?',
    answer: 'Sim, utilizamos tecnologias de segurança avançadas e todas as transações são criptografadas. Além disso, você tem total controle sobre seus ganhos e saques.'
  },
];

export default function Support() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('medium');
  const [isLoading, setIsLoading] = useState(false);
  
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.user_id) {
      fetchTickets();
    }
  }, [profile]);

  const fetchTickets = async () => {
    if (!profile?.user_id) return;

    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tickets:', error);
        return;
      }

      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.user_id || !subject.trim() || !message.trim()) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: profile.user_id,
          subject: subject.trim(),
          message: message.trim(),
          priority,
          status: 'open'
        });

      if (error) {
        console.error('Error creating ticket:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao enviar ticket. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Ticket enviado!',
        description: 'Seu ticket foi enviado com sucesso. Responderemos em breve.',
      });

      // Reset form
      setSubject('');
      setMessage('');
      setPriority('medium');
      
      // Refresh tickets
      fetchTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: 'Erro',
        description: 'Erro inesperado. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return Clock;
      case 'in_progress': return AlertCircle;
      case 'resolved': return CheckCircle;
      case 'closed': return XCircle;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-warning text-warning-foreground';
      case 'in_progress': return 'bg-primary text-primary-foreground';
      case 'resolved': return 'bg-success text-success-foreground';
      case 'closed': return 'bg-muted text-muted-foreground';
      default: return 'bg-warning text-warning-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Aberto';
      case 'in_progress': return 'Em Andamento';
      case 'resolved': return 'Resolvido';
      case 'closed': return 'Fechado';
      default: return 'Aberto';
    }
  };

  const getPriorityColor = (priority: string) => {
    return priorityOptions.find(p => p.value === priority)?.color || 'bg-muted text-muted-foreground';
  };

  const getPriorityText = (priority: string) => {
    return priorityOptions.find(p => p.value === priority)?.label || 'Média';
  };

  return (
    <DashboardLayout 
      title="Central de Suporte"
      description="Estamos aqui para ajudar você com qualquer dúvida ou problema"
      showBackButton
    >
      <div className="max-w-6xl mx-auto">

      <Tabs defaultValue="tickets" className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="tickets" className="text-xs sm:text-sm">Meus Tickets</TabsTrigger>
          <TabsTrigger value="faq" className="text-xs sm:text-sm">FAQ</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create New Ticket */}
            <div className="lg:col-span-2">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Novo Ticket
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Assunto</Label>
                      <Input
                        id="subject"
                        placeholder="Descreva brevemente o problema..."
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority">Prioridade</Label>
                      <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {priorityOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Mensagem</Label>
                      <Textarea
                        id="message"
                        placeholder="Descreva detalhadamente o problema ou dúvida..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={6}
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading || !subject.trim() || !message.trim()}
                    >
                      {isLoading ? 'Enviando...' : 'Enviar Ticket'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Quick Help */}
            <div>
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="h-5 w-5" />
                    Ajuda Rápida
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm">
                    <div>
                      <h4 className="font-medium mb-1">💬 Chat Online</h4>
                      <p className="text-muted-foreground text-xs">
                        Segunda a Sexta: 9h às 18h
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">📧 Email</h4>
                      <p className="text-muted-foreground text-xs">
                        suporte@nextfund.com
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">📱 WhatsApp</h4>
                      <p className="text-muted-foreground text-xs">
                        (11) 99999-9999
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">⏰ Tempo de Resposta</h4>
                      <p className="text-muted-foreground text-xs">
                        Até 24 horas úteis
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tickets List */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Seus Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tickets.length > 0 ? (
                <div className="space-y-4">
                  {tickets.map((ticket) => {
                    const StatusIcon = getStatusIcon(ticket.status);
                    return (
                      <div
                        key={ticket.id}
                        className="p-4 bg-muted/20 rounded-lg space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium text-sm sm:text-base">{ticket.subject}</h3>
                              <Badge className={getPriorityColor(ticket.priority)}>
                                {getPriorityText(ticket.priority)}
                              </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                              {ticket.message}
                            </p>
                            {ticket.response && (
                              <div className="mt-3 p-3 bg-primary/10 rounded-lg">
                                <p className="text-xs font-medium text-primary mb-1">Resposta:</p>
                                <p className="text-xs sm:text-sm">{ticket.response}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col sm:items-end gap-2">
                            <Badge className={getStatusColor(ticket.status)}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {getStatusText(ticket.status)}
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              {new Date(ticket.created_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum ticket encontrado
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Perguntas Frequentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {faqItems.map((item, index) => (
                  <div key={index} className="p-4 bg-muted/20 rounded-lg">
                    <h3 className="font-medium text-sm sm:text-base mb-2">{item.question}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{item.answer}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  );
}