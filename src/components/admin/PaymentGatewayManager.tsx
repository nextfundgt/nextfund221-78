import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit2, Trash2, Settings, Activity } from 'lucide-react';
import { toast } from "sonner";

interface PaymentGateway {
  id: string;
  name: string;
  provider: string;
  required_fields: string[];
  is_active: boolean;
  priority: number;
  api_endpoint?: string;
  webhook_url?: string;
  created_at: string;
}

interface GatewayFormData {
  name: string;
  provider: string;
  required_fields: string[];
  is_active: boolean;
  priority: number;
  api_endpoint: string;
  webhook_url: string;
}

const initialFormData: GatewayFormData = {
  name: '',
  provider: '',
  required_fields: [],
  is_active: true,
  priority: 1,
  api_endpoint: '',
  webhook_url: ''
};

const commonProviders = [
  { value: 'pushinpay', label: 'PushinPay', fields: ['cpf', 'email', 'name'] },
  { value: 'mercadopago', label: 'Mercado Pago', fields: ['email', 'phone'] },
  { value: 'pagseguro', label: 'PagSeguro', fields: ['cpf', 'email', 'phone'] },
  { value: 'picpay', label: 'PicPay', fields: ['phone', 'email'] },
  { value: 'custom', label: 'Gateway Personalizado', fields: [] }
];

const availableFields = [
  'cpf', 'email', 'name', 'phone', 'address', 'pix_key', 'birth_date'
];

export function PaymentGatewayManager() {
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGateway, setEditingGateway] = useState<PaymentGateway | null>(null);
  const [formData, setFormData] = useState<GatewayFormData>(initialFormData);
  const [fieldInput, setFieldInput] = useState('');

  useEffect(() => {
    fetchGateways();
    
    // Setup realtime subscription
    const channel = supabase
      .channel('payment-gateways-admin-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'payment_gateways' }, 
        (payload) => {
          console.log('Payment gateway realtime update:', payload);
          fetchGateways();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchGateways = async () => {
    try {
      console.log('Fetching real payment gateways from Supabase...');
      
      const { data, error } = await supabase
        .from('payment_gateways')
        .select('*')
        .order('priority', { ascending: false });

      if (error) throw error;
      
      console.log('Fetched payment gateways:', data?.length || 0, 'records');
      
      setGateways((data || []).map(gateway => ({
        ...gateway,
        required_fields: Array.isArray(gateway.required_fields) 
          ? gateway.required_fields as string[]
          : JSON.parse(gateway.required_fields as string) as string[]
      })) as PaymentGateway[]);
    } catch (error) {
      console.error('Error fetching gateways:', error);
      toast.error('Erro ao carregar gateways de pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const gatewayData = {
        ...formData,
        required_fields: JSON.stringify(formData.required_fields)
      };

      let result;
      if (editingGateway) {
        result = await supabase
          .from('payment_gateways')
          .update(gatewayData)
          .eq('id', editingGateway.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('payment_gateways')
          .insert([gatewayData])
          .select()
          .single();
      }

      if (result.error) throw result.error;

      toast.success(editingGateway ? 'Gateway atualizado!' : 'Gateway criado!');
      setIsDialogOpen(false);
      resetForm();
      fetchGateways();
    } catch (error) {
      console.error('Error saving gateway:', error);
      toast.error('Erro ao salvar gateway');
    }
  };

  const handleEdit = (gateway: PaymentGateway) => {
    setEditingGateway(gateway);
    setFormData({
      name: gateway.name,
      provider: gateway.provider,
      required_fields: gateway.required_fields,
      is_active: gateway.is_active,
      priority: gateway.priority,
      api_endpoint: gateway.api_endpoint || '',
      webhook_url: gateway.webhook_url || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este gateway?')) return;

    try {
      const { error } = await supabase
        .from('payment_gateways')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Gateway excluído!');
      fetchGateways();
    } catch (error) {
      console.error('Error deleting gateway:', error);
      toast.error('Erro ao excluir gateway');
    }
  };

  const toggleGatewayStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('payment_gateways')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      toast.success(isActive ? 'Gateway desativado' : 'Gateway ativado');
      fetchGateways();
    } catch (error) {
      console.error('Error toggling gateway status:', error);
      toast.error('Erro ao alterar status');
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingGateway(null);
    setFieldInput('');
  };

  const handleProviderChange = (provider: string) => {
    const selectedProvider = commonProviders.find(p => p.value === provider);
    setFormData(prev => ({
      ...prev,
      provider,
      required_fields: selectedProvider?.fields || []
    }));
  };

  const addRequiredField = () => {
    if (fieldInput && !formData.required_fields.includes(fieldInput)) {
      setFormData(prev => ({
        ...prev,
        required_fields: [...prev.required_fields, fieldInput]
      }));
      setFieldInput('');
    }
  };

  const removeRequiredField = (field: string) => {
    setFormData(prev => ({
      ...prev,
      required_fields: prev.required_fields.filter(f => f !== field)
    }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 glass-card rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gateways de Pagamento</h2>
          <p className="text-muted-foreground">Gerencie os provedores PIX disponíveis</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Gateway
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingGateway ? 'Editar Gateway' : 'Novo Gateway'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Gateway</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: PushinPay Principal"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="provider">Provedor</Label>
                <Select value={formData.provider} onValueChange={handleProviderChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um provedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonProviders.map(provider => (
                      <SelectItem key={provider.value} value={provider.value}>
                        {provider.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Campos Obrigatórios</Label>
                <div className="flex gap-2">
                  <Select value={fieldInput} onValueChange={setFieldInput}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Adicionar campo" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields.map(field => (
                        <SelectItem key={field} value={field}>
                          {field.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={addRequiredField} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.required_fields.map(field => (
                    <Badge key={field} variant="secondary" className="gap-1">
                      {field.toUpperCase()}
                      <button
                        type="button"
                        onClick={() => removeRequiredField(field)}
                        className="text-xs hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_endpoint">Endpoint da API (opcional)</Label>
                <Input
                  id="api_endpoint"
                  value={formData.api_endpoint}
                  onChange={(e) => setFormData(prev => ({ ...prev, api_endpoint: e.target.value }))}
                  placeholder="https://api.gateway.com/v1/payments"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook_url">Webhook URL (opcional)</Label>
                <Input
                  id="webhook_url"
                  value={formData.webhook_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, webhook_url: e.target.value }))}
                  placeholder="https://app.com/webhook/gateway"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Gateway ativo</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingGateway ? 'Atualizar' : 'Criar'} Gateway
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {gateways.length === 0 ? (
        <Card className="glass-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum gateway configurado
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              Configure seu primeiro gateway de pagamento PIX
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {gateways.map((gateway) => (
            <Card key={gateway.id} className="glass-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${gateway.is_active ? 'bg-success' : 'bg-muted'}`} />
                    <div>
                      <CardTitle className="text-lg">{gateway.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {gateway.provider.toUpperCase()} • Prioridade: {gateway.priority}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={gateway.is_active ? 'default' : 'secondary'}>
                      <Activity className="h-3 w-3 mr-1" />
                      {gateway.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm text-foreground mb-2">Campos Obrigatórios:</h4>
                    <div className="flex flex-wrap gap-1">
                      {gateway.required_fields.map(field => (
                        <Badge key={field} variant="outline" className="text-xs">
                          {field.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {gateway.api_endpoint && (
                    <div>
                      <h4 className="font-medium text-sm text-foreground mb-1">Endpoint:</h4>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {gateway.api_endpoint}
                      </code>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleGatewayStatus(gateway.id, gateway.is_active)}
                    >
                      {gateway.is_active ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(gateway)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(gateway.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}