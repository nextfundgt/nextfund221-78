import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Crown, DollarSign, Calendar, Users, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VipPlan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  level: number;
  benefits: string[];
  video_access_level: number;
  daily_video_limit: number;
  reward_multiplier: number;
  status: string;
  created_at: string;
}

interface PlanFormData {
  name: string;
  price: number;
  duration_days: number;
  level: number;
  benefits: string;
  video_access_level: number;
  daily_video_limit: number;
  reward_multiplier: number;
  status: string;
}

const initialFormData: PlanFormData = {
  name: '',
  price: 0,
  duration_days: 30,
  level: 1,
  benefits: '',
  video_access_level: 0,
  daily_video_limit: 15,
  reward_multiplier: 1.1,
  status: 'active'
};

export function VipPlanManager() {
  const [plans, setPlans] = useState<VipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<VipPlan | null>(null);
  const [formData, setFormData] = useState<PlanFormData>(initialFormData);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPlans();
    
    // Setup realtime subscription
    const channel = supabase
      .channel('vip-plans-admin-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'vip_plans' }, 
        (payload) => {
          console.log('VIP plan realtime update:', payload);
          fetchPlans();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPlans = async () => {
    try {
      console.log('Fetching real VIP plans from Supabase...');
      
      const { data, error } = await supabase
        .from('vip_plans')
        .select('*')
        .order('level');

      if (error) throw error;
      
      console.log('Fetched VIP plans:', data?.length || 0, 'records');

      const formattedPlans = data?.map(plan => ({
        ...plan,
        benefits: Array.isArray(plan.benefits) ? plan.benefits : JSON.parse(plan.benefits as string)
      })) || [];

      setPlans(formattedPlans);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os planos VIP",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const benefitsList = formData.benefits.split('\n').filter(b => b.trim());
      
      const planData = {
        ...formData,
        benefits: benefitsList,
        price: Number(formData.price),
        reward_multiplier: Number(formData.reward_multiplier)
      };

      if (editingPlan) {
        const { error } = await supabase
          .from('vip_plans')
          .update(planData)
          .eq('id', editingPlan.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Plano VIP atualizado com sucesso!"
        });
      } else {
        const { error } = await supabase
          .from('vip_plans')
          .insert([planData]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Plano VIP criado com sucesso!"
        });
      }

      setIsDialogOpen(false);
      setEditingPlan(null);
      setFormData(initialFormData);
      fetchPlans();
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o plano VIP",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (plan: VipPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price,
      duration_days: plan.duration_days,
      level: plan.level,
      benefits: plan.benefits.join('\n'),
      video_access_level: plan.video_access_level,
      daily_video_limit: plan.daily_video_limit,
      reward_multiplier: plan.reward_multiplier,
      status: plan.status
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('Tem certeza que deseja excluir este plano VIP?')) return;

    try {
      const { error } = await supabase
        .from('vip_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Plano VIP excluído com sucesso!"
      });

      fetchPlans();
    } catch (error) {
      console.error('Erro ao excluir plano:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o plano VIP",
        variant: "destructive"
      });
    }
  };

  const togglePlanStatus = async (planId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      const { error } = await supabase
        .from('vip_plans')
        .update({ status: newStatus })
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Plano ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso!`
      });

      fetchPlans();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do plano",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando planos VIP...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestão de Planos VIP</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingPlan(null);
              setFormData(initialFormData);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano VIP
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? 'Editar Plano VIP' : 'Criar Novo Plano VIP'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Básico</TabsTrigger>
                  <TabsTrigger value="benefits">Benefícios</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome do Plano</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: VIP Premium"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="level">Nível</Label>
                      <Input
                        id="level"
                        type="number"
                        min="1"
                        value={formData.level}
                        onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Preço (R$)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="duration">Duração (dias)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="1"
                        value={formData.duration_days}
                        onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="daily_limit">Limite Diário de Vídeos</Label>
                      <Input
                        id="daily_limit"
                        type="number"
                        min="1"
                        value={formData.daily_video_limit}
                        onChange={(e) => setFormData({ ...formData, daily_video_limit: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="multiplier">Multiplicador de Recompensa</Label>
                      <Input
                        id="multiplier"
                        type="number"
                        step="0.1"
                        min="1"
                        value={formData.reward_multiplier}
                        onChange={(e) => setFormData({ ...formData, reward_multiplier: parseFloat(e.target.value) })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="status"
                      checked={formData.status === 'active'}
                      onCheckedChange={(checked) => setFormData({ ...formData, status: checked ? 'active' : 'inactive' })}
                    />
                    <Label htmlFor="status">Plano Ativo</Label>
                  </div>
                </TabsContent>

                <TabsContent value="benefits" className="space-y-4">
                  <div>
                    <Label htmlFor="benefits">Benefícios (um por linha)</Label>
                    <Textarea
                      id="benefits"
                      value={formData.benefits}
                      onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                      placeholder="Acesso a vídeos premium&#10;Multiplicador de recompensas&#10;Suporte prioritário"
                      rows={8}
                      className="resize-none"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Digite cada benefício em uma linha separada
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="space-y-4">
                  <Card className="glass-card">
                    <CardHeader className="text-center">
                      <CardTitle className="flex items-center justify-center gap-2">
                        <Crown className="h-5 w-5 text-primary" />
                        {formData.name || 'Nome do Plano'}
                      </CardTitle>
                      <div className="text-3xl font-bold text-primary">
                        R$ {formData.price.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        por {formData.duration_days} dias
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-warning" />
                          {formData.reward_multiplier}x recompensa
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-secondary" />
                          {formData.daily_video_limit} vídeos/dia
                        </div>
                      </div>
                      
                      {formData.benefits && (
                        <div>
                          <h4 className="font-medium mb-2">Benefícios:</h4>
                          <ul className="space-y-1 text-sm">
                            {formData.benefits.split('\n').filter(b => b.trim()).map((benefit, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                                {benefit.trim()}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingPlan ? 'Atualizar Plano' : 'Criar Plano'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={`glass-card ${plan.status === 'inactive' ? 'opacity-60' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  {plan.name}
                </CardTitle>
                <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                  {plan.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <div className="text-2xl font-bold text-primary">R$ {plan.price.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">por {plan.duration_days} dias</div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-warning" />
                  {plan.reward_multiplier}x recompensa
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-secondary" />
                  {plan.daily_video_limit} vídeos/dia
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2">Benefícios:</h4>
                <ul className="space-y-1 text-xs">
                  {plan.benefits.slice(0, 3).map((benefit, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-primary rounded-full" />
                      {benefit}
                    </li>
                  ))}
                  {plan.benefits.length > 3 && (
                    <li className="text-muted-foreground">+{plan.benefits.length - 3} mais...</li>
                  )}
                </ul>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(plan)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant={plan.status === 'active' ? 'secondary' : 'default'}
                  size="sm"
                  onClick={() => togglePlanStatus(plan.id, plan.status)}
                >
                  {plan.status === 'active' ? 'Desativar' : 'Ativar'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(plan.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {plans.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum plano VIP configurado</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro plano VIP para começar a monetizar sua plataforma
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Plano
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}