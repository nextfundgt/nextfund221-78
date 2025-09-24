import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  Bell, 
  Ticket, 
  Gift, 
  Target, 
  Settings, 
  CheckCircle, 
  XCircle,
  Video,
  HelpCircle,
  BarChart3,
  Receipt,
  Activity,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatsCard } from "@/components/admin/StatsCard";
import { VideoManagement } from '@/components/admin/VideoManagement';
import { VideoQuestionsManagement } from '@/components/admin/VideoQuestionsManagement';
import { DataTable } from '@/components/admin/DataTable';
import { FormModal } from '@/components/admin/FormModal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { VipPlanManager } from '@/components/admin/VipPlanManager';
import { UserDetailsModal } from '@/components/admin/UserDetailsModal';
import { PaymentGatewayManager } from '@/components/admin/PaymentGatewayManager';
import { UserLimitsMonitor } from '@/components/admin/UserLimitsMonitor';
import { VideoSessionsMonitor } from '@/components/admin/VideoSessionsMonitor';

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  status: string;
  method: string;
  name?: string;
  email?: string;
  cpf?: string;
  notes?: string;
  created_at: string;
  processed_at?: string;
  notes: string | null;
  processed_at: string | null;
  updated_at: string;
  user_name?: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  balance: number;
  affiliate_code: string;
  current_vip_level?: number;
  user_number: number;
  created_at: string;
}

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  response: string | null;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
}

interface Coupon {
  id: string;
  user_id: string;
  title: string;
  description: string;
  coupon_type: string;
  reward_amount: number;
  status: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  user_name?: string;
}

interface Affiliate {
  id: string;
  user_id: string;
  code: string;
  clicks_count: number;
  signups_count: number;
  rewards_total: number;
  created_at: string;
  updated_at: string;
  user_name?: string;
}

export default function Admin() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingTransactions: 0,
    totalVolume: 0,
    unreadNotifications: 0,
    openTickets: 0,
    totalAffiliates: 0,
    totalVideoTasks: 0,
    activeVipPlans: 0
  });

  // Modal states
  const [modals, setModals] = useState({
    notification: { open: false, data: null as any },
    coupon: { open: false, data: null as any },
    ticket: { open: false, data: null as any },
    user: { open: false, data: null as any },
    transaction: { open: false, data: null as any }
  });

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
    loading: false
  });

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);

  const { signOut, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    setupRealtimeSubscriptions();

    return () => {
      // Cleanup all channels
      supabase.removeAllChannels();
    };
  }, []);

  const setupRealtimeSubscriptions = () => {
    console.log('Setting up admin realtime subscriptions...');
    
    // Transactions realtime
    const transactionsChannel = supabase
      .channel('admin-transactions-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transactions' }, 
        (payload) => {
          console.log('Transaction update:', payload);
          setLastUpdate(new Date());
          fetchTransactions();
        }
      )
      .subscribe((status) => {
        console.log('Transactions channel status:', status);
        if (status === 'SUBSCRIBED') setRealtimeConnected(true);
      });

    // Profiles realtime
    const profilesChannel = supabase
      .channel('admin-profiles-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' }, 
        (payload) => {
          console.log('Profile update:', payload);
          setLastUpdate(new Date());
          fetchUsers();
        }
      )
      .subscribe();

    // Notifications realtime
    const notificationsChannel = supabase
      .channel('admin-notifications-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'notifications' }, 
        (payload) => {
          console.log('Notification update:', payload);
          setLastUpdate(new Date());
          fetchNotifications();
        }
      )
      .subscribe();

    // Support tickets realtime
    const ticketsChannel = supabase
      .channel('admin-tickets-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'support_tickets' }, 
        (payload) => {
          console.log('Support ticket update:', payload);
          setLastUpdate(new Date());
          fetchTickets();
        }
      )
      .subscribe();

    // Coupons realtime
    const couponsChannel = supabase
      .channel('admin-coupons-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'coupons' }, 
        (payload) => {
          console.log('Coupon update:', payload);
          setLastUpdate(new Date());
          fetchCoupons();
        }
      )
      .subscribe();

    // Affiliates realtime
    const affiliatesChannel = supabase
      .channel('admin-affiliates-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'affiliates' }, 
        (payload) => {
          console.log('Affiliate update:', payload);
          setLastUpdate(new Date());
          fetchAffiliates();
        }
      )
      .subscribe();

    // Video tasks realtime
    const videoTasksChannel = supabase
      .channel('admin-video-tasks-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'video_tasks' }, 
        (payload) => {
          console.log('Video task update:', payload);
          setLastUpdate(new Date());
          updateStats();
        }
      )
      .subscribe();

    // VIP plans realtime
    const vipPlansChannel = supabase
      .channel('admin-vip-plans-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'vip_plans' }, 
        (payload) => {
          console.log('VIP plan update:', payload);
          setLastUpdate(new Date());
          updateStats();
        }
      )
      .subscribe();

    // User levels realtime
    const userLevelsChannel = supabase
      .channel('admin-user-levels-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'user_levels' }, 
        (payload) => {
          console.log('User level update:', payload);
          setLastUpdate(new Date());
          updateStats();
        }
      )
      .subscribe();

    // Video completions realtime
    const videoCompletionsChannel = supabase
      .channel('admin-video-completions-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'user_video_completions' }, 
        (payload) => {
          console.log('Video completion update:', payload);
          setLastUpdate(new Date());
          updateStats();
        }
      )
      .subscribe();
  };
  const fetchData = async () => {
    console.log('Fetching admin data...');
    await Promise.all([
      fetchTransactions(),
      fetchUsers(),
      fetchNotifications(),
      fetchTickets(),
      fetchCoupons(),
      fetchAffiliates(),
      fetchVideoTasksCount(),
      fetchVipPlansCount()
    ]);
    updateStats();
    setLoading(false);
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // Fetch user names separately for better compatibility
      const transactionsWithUsers = await Promise.all(
        (data || []).map(async (transaction) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', transaction.user_id)
            .single();
            
          return {
            ...transaction,
            user_name: profile?.full_name || 'N/A'
          };
        })
      );
      
      setTransactions(transactionsWithUsers);
      console.log('Fetched transactions:', transactionsWithUsers.length);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar transações',
        variant: 'destructive'
      });
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
      console.log('Fetched users:', (data || []).length);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar usuários',
        variant: 'destructive'
      });
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
      console.log('Fetched notifications:', (data || []).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar notificações',
        variant: 'destructive'
      });
    }
  };

  const fetchTickets = async () => {
    try {
      const { data: ticketsData, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch user names for tickets
      const ticketsWithUsers = await Promise.all(
        (ticketsData || []).map(async (ticket) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', ticket.user_id)
            .single();
            
          return {
            ...ticket,
            user_name: profile?.full_name || 'N/A'
          };
        })
      );
      
      setTickets(ticketsWithUsers);
      console.log('Fetched tickets:', ticketsWithUsers.length);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar tickets',
        variant: 'destructive'
      });
    }
  };

  const fetchCoupons = async () => {
    try {
      const { data: couponsData, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch user names for coupons
      const couponsWithUsers = await Promise.all(
        (couponsData || []).map(async (coupon) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', coupon.user_id)
            .single();
            
          return {
            ...coupon,
            user_name: profile?.full_name || 'N/A'
          };
        })
      );
      
      setCoupons(couponsWithUsers);
      console.log('Fetched coupons:', couponsWithUsers.length);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar cupons',
        variant: 'destructive'
      });
    }
  };

  const fetchAffiliates = async () => {
    try {
      const { data: affiliatesData, error } = await supabase
        .from('affiliates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch user names for affiliates
      const affiliatesWithUsers = await Promise.all(
        (affiliatesData || []).map(async (affiliate) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', affiliate.user_id)
            .single();
            
          return {
            ...affiliate,
            user_name: profile?.full_name || 'N/A'
          };
        })
      );
      
      setAffiliates(affiliatesWithUsers);
      console.log('Fetched affiliates:', affiliatesWithUsers.length);
    } catch (error) {
      console.error('Error fetching affiliates:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar afiliados',
        variant: 'destructive'
      });
    }
  };

  const fetchVideoTasksCount = async () => {
    try {
      const { count, error } = await supabase
        .from('video_tasks')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error fetching video tasks count:', error);
      return 0;
    }
  };

  const fetchVipPlansCount = async () => {
    try {
      const { count, error } = await supabase
        .from('vip_plans')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error fetching VIP plans count:', error);
      return 0;
    }
  };

  const updateStats = () => {
    setStats({
      totalUsers: users.length,
      pendingTransactions: transactions.filter(t => t.status === 'pending').length,
      totalVolume: transactions
        .filter(t => t.status === 'approved')
        .reduce((sum, t) => sum + t.amount, 0),
      unreadNotifications: notifications.filter(n => !n.is_read).length,
      openTickets: tickets.filter(t => t.status === 'open').length,
      totalAffiliates: affiliates.length
    });
  };

  // CRUD Operations
  const updateTransactionStatus = async (transactionId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          status,
          processed_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (error) throw error;

      toast({
        title: status === 'approved' ? 'Transação aprovada!' : 'Transação rejeitada!',
        description: `A transação foi ${status === 'approved' ? 'aprovada' : 'rejeitada'} com sucesso.`,
      });

      fetchTransactions();
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar transação.',
        variant: 'destructive',
      });
    }
  };

  // Modal handlers
  const openModal = (type: string, data: any = null) => {
    setModals(prev => ({
      ...prev,
      [type]: { open: true, data }
    }));
  };

  const closeModal = (type: string) => {
    setModals(prev => ({
      ...prev,
      [type]: { open: false, data: null }
    }));
  };

  // CRUD handlers for different entities
  const handleCreateNotification = async (data: any) => {
    const { error } = await supabase.from('notifications').insert([data]);
    if (error) throw error;
    fetchNotifications();
  };

  const handleCreateCoupon = async (data: any) => {
    const { error } = await supabase.from('coupons').insert([data]);
    if (error) throw error;
    fetchCoupons();
  };

  const handleUpdateTicket = async (data: any) => {
    const { error } = await supabase
      .from('support_tickets')
      .update(data)
      .eq('id', data.id);
    if (error) throw error;
    fetchTickets();
  };

  const handleUpdateUser = async (data: any) => {
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', data.id);
    if (error) throw error;
    fetchUsers();
  };

  const handleDelete = async (table: string, id: string, fetchFunction: () => void) => {
    setConfirmDialog(prev => ({ ...prev, loading: true }));
    try {
      const { error } = await supabase.from(table as any).delete().eq('id', id);
      if (error) throw error;
      
      toast({
        title: 'Excluído com sucesso',
        description: 'O item foi removido do sistema.',
      });
      
      fetchFunction();
      setConfirmDialog(prev => ({ ...prev, open: false, loading: false }));
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
      setConfirmDialog(prev => ({ ...prev, loading: false }));
    }
  };

  // Column definitions for different tables
  const transactionColumns = [
    { key: 'user_name', label: 'Usuário', sortable: true },
    { 
      key: 'type', 
      label: 'Tipo',
      render: (value: string) => (
        <Badge variant={value === 'deposit' ? 'default' : 'secondary'}>
          {value === 'deposit' ? 'Depósito' : 'Saque'}
        </Badge>
      )
    },
    { 
      key: 'amount', 
      label: 'Valor',
      render: (value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (value: string) => (
        <Badge variant={
          value === 'approved' ? 'default' :
          value === 'rejected' ? 'destructive' : 'outline'
        }>
          {value === 'approved' ? 'Aprovado' :
           value === 'rejected' ? 'Rejeitado' : 'Pendente'}
        </Badge>
      )
    },
    { 
      key: 'created_at', 
      label: 'Data',
      render: (value: string) => new Date(value).toLocaleDateString('pt-BR')
    }
  ];

  const userColumns = [
    { 
      key: 'full_name', 
      label: 'Nome', 
      sortable: true,
      render: (value: string, row: any) => (
        <Button
          variant="link"
          className="p-0 h-auto font-normal text-left justify-start"
          onClick={() => {
            setSelectedUserId(row.user_id);
            setUserDetailsOpen(true);
          }}
        >
          {value}
        </Button>
      )
    },
    { 
      key: 'balance', 
      label: 'Saldo',
      render: (value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    },
    { 
      key: 'affiliate_code', 
      label: 'Código Afiliado',
      render: (value: string) => (
        <code className="text-sm bg-muted px-2 py-1 rounded">{value}</code>
      )
    },
    { 
      key: 'created_at', 
      label: 'Cadastro',
      render: (value: string) => new Date(value).toLocaleDateString('pt-BR')
    }
  ];

  const notificationColumns = [
    { key: 'title', label: 'Título', sortable: true },
    { key: 'message', label: 'Mensagem' },
    { 
      key: 'type', 
      label: 'Tipo',
      render: (value: string) => (
        <Badge variant="outline">{value}</Badge>
      )
    },
    { 
      key: 'is_read', 
      label: 'Status',
      render: (value: boolean) => (
        <Badge variant={value ? 'default' : 'destructive'}>
          {value ? 'Lida' : 'Não lida'}
        </Badge>
      )
    }
  ];

  const ticketColumns = [
    { key: 'subject', label: 'Assunto', sortable: true },
    { key: 'message', label: 'Mensagem' },
    { 
      key: 'status', 
      label: 'Status',
      render: (value: string) => (
        <Badge variant={value === 'open' ? 'destructive' : value === 'resolved' ? 'default' : 'outline'}>
          {value === 'open' ? 'Aberto' : value === 'resolved' ? 'Resolvido' : 'Em andamento'}
        </Badge>
      )
    },
    { 
      key: 'priority', 
      label: 'Prioridade',
      render: (value: string) => (
        <Badge variant={value === 'high' ? 'destructive' : value === 'medium' ? 'secondary' : 'outline'}>
          {value === 'high' ? 'Alta' : value === 'medium' ? 'Média' : 'Baixa'}
        </Badge>
      )
    }
  ];

  const couponColumns = [
    { key: 'title', label: 'Título', sortable: true },
    { key: 'description', label: 'Descrição' },
    { 
      key: 'reward_amount', 
      label: 'Valor',
      render: (value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (value: string) => (
        <Badge variant={value === 'available' ? 'default' : 'outline'}>
          {value === 'available' ? 'Disponível' : 'Usado'}
        </Badge>
      )
    }
  ];

  const affiliateColumns = [
    { key: 'code', label: 'Código', sortable: true },
    { key: 'clicks_count', label: 'Clicks' },
    { key: 'signups_count', label: 'Cadastros' },
    { 
      key: 'rewards_total', 
      label: 'Comissões',
      render: (value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    }
  ];

  // Form field definitions
  const notificationFields = [
    { name: 'title', label: 'Título', type: 'text' as const, required: true },
    { name: 'message', label: 'Mensagem', type: 'textarea' as const, required: true },
    { name: 'type', label: 'Tipo', type: 'select' as const, required: true,
      options: [
        { value: 'info', label: 'Informação' },
        { value: 'success', label: 'Sucesso' },
        { value: 'warning', label: 'Aviso' },
        { value: 'error', label: 'Erro' }
      ]
    }
  ];

  const couponFields = [
    { name: 'title', label: 'Título', type: 'text' as const, required: true },
    { name: 'description', label: 'Descrição', type: 'textarea' as const },
    { name: 'reward_amount', label: 'Valor da Recompensa', type: 'number' as const, required: true, min: 0.01 },
    { name: 'coupon_type', label: 'Tipo', type: 'select' as const, required: true,
      options: [
        { value: 'bonus', label: 'Bônus' },
        { value: 'discount', label: 'Desconto' },
        { value: 'cashback', label: 'Cashback' }
      ]
    },
    { name: 'expires_at', label: 'Data de Expiração', type: 'datetime-local' as const }
  ];

  const userFields = [
    { name: 'full_name', label: 'Nome Completo', type: 'text' as const, required: true },
    { name: 'balance', label: 'Saldo', type: 'number' as const, required: true, min: 0 }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <DashboardLayout 
      title="Painel Administrativo"
      description="Gerencie usuários, transações e configurações do sistema"
      breadcrumbs={[
        { label: 'Início', href: '/home' },
        { label: 'Administração' }
      ]}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total de Usuários"
            value={stats.totalUsers}
            icon={Users}
            color="primary"
          />
          <StatsCard
            title="Transações Pendentes"
            value={stats.pendingTransactions}
            icon={CreditCard}
            color="warning"
          />
          <StatsCard
            title="Volume Total"
            value={`R$ ${stats.totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={TrendingUp}
            color="success"
          />
          <StatsCard
            title="Total de Afiliados"
            value={stats.totalAffiliates}
            icon={Target}
            color="secondary"
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="transactions">Transações</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="videos">Vídeos</TabsTrigger>
            <TabsTrigger value="questions">Perguntas</TabsTrigger>
            <TabsTrigger value="gateways" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Gateways
            </TabsTrigger>
            <TabsTrigger value="vip">VIP</TabsTrigger>
            <TabsTrigger value="limits">Limites</TabsTrigger>
            <TabsTrigger value="sessions">Sessões</TabsTrigger>
            <TabsTrigger value="rewards">Recompensas</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="tickets">Suporte</TabsTrigger>
            <TabsTrigger value="coupons">Cupons</TabsTrigger>
            <TabsTrigger value="affiliates">Afiliados</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <AdminDashboard />
          </TabsContent>

          {/* Gateways Tab */}
          <TabsContent value="gateways">
            <PaymentGatewayManager />
          </TabsContent>

          {/* VIP Plans Tab */}
          <TabsContent value="vip">
            <VipPlanManager />
          </TabsContent>

          {/* User Limits Monitor Tab */}
          <TabsContent value="limits">
            <UserLimitsMonitor />
          </TabsContent>

          {/* Video Sessions Monitor Tab */}
          <TabsContent value="sessions">
            <VideoSessionsMonitor />
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle>Gerenciar Transações</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="table-mobile">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.user_name}</TableCell>
                          <TableCell>
                            <Badge variant={transaction.type === 'deposit' ? 'default' : 'secondary'}>
                              {transaction.type === 'deposit' ? 'Depósito' : 'Saque'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                transaction.status === 'approved' ? 'default' :
                                transaction.status === 'rejected' ? 'destructive' : 'outline'
                              }
                            >
                              {transaction.status === 'approved' ? 'Aprovado' :
                               transaction.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            {transaction.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => updateTransactionStatus(transaction.id, 'approved')}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => updateTransactionStatus(transaction.id, 'rejected')}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <DataTable
              title="Usuários Cadastrados"
              data={users}
              columns={userColumns}
              onEdit={(user) => openModal('user', user)}
              searchKey="full_name"
            />
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos">
            <VideoManagement />
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions">
            <VideoQuestionsManagement />
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <DataTable
              title="Notificações"
              data={notifications}
              columns={notificationColumns}
              onCreate={() => openModal('notification')}
              onDelete={(notification) => setConfirmDialog({
                open: true,
                title: 'Excluir Notificação',
                description: 'Tem certeza que deseja excluir esta notificação?',
                onConfirm: () => handleDelete('notifications', notification.id, fetchNotifications),
                loading: false
              })}
              searchKey="title"
              filterConfig={{
                key: 'type',
                options: [
                  { value: 'info', label: 'Informação' },
                  { value: 'success', label: 'Sucesso' },
                  { value: 'warning', label: 'Aviso' },
                  { value: 'error', label: 'Erro' }
                ]
              }}
            />
          </TabsContent>

          {/* Support Tickets Tab */}
          <TabsContent value="tickets">
            <DataTable
              title="Tickets de Suporte"
              data={tickets}
              columns={ticketColumns}
              onEdit={(ticket) => openModal('ticket', ticket)}
              searchKey="subject"
              filterConfig={{
                key: 'status',
                options: [
                  { value: 'open', label: 'Aberto' },
                  { value: 'in_progress', label: 'Em andamento' },
                  { value: 'resolved', label: 'Resolvido' }
                ]
              }}
            />
          </TabsContent>

          {/* Coupons Tab */}
          <TabsContent value="coupons">
            <DataTable
              title="Cupons e Promoções"
              data={coupons}
              columns={couponColumns}
              onCreate={() => openModal('coupon')}
              onEdit={(coupon) => openModal('coupon', coupon)}
              onDelete={(coupon) => setConfirmDialog({
                open: true,
                title: 'Excluir Cupom',
                description: 'Tem certeza que deseja excluir este cupom?',
                onConfirm: () => handleDelete('coupons', coupon.id, fetchCoupons),
                loading: false
              })}
              searchKey="title"
            />
          </TabsContent>

          {/* Affiliates Tab */}
          <TabsContent value="affiliates">
            <DataTable
              title="Sistema de Afiliados"
              data={affiliates}
              columns={affiliateColumns}
              searchKey="code"
            />
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <FormModal
          open={modals.notification.open}
          onOpenChange={() => closeModal('notification')}
          title="Criar Notificação"
          fields={notificationFields}
          data={modals.notification.data}
          onSubmit={handleCreateNotification}
        />

        <FormModal
          open={modals.coupon.open}
          onOpenChange={() => closeModal('coupon')}
          title={modals.coupon.data ? 'Editar Cupom' : 'Criar Cupom'}
          fields={couponFields}
          data={modals.coupon.data}
          onSubmit={handleCreateCoupon}
        />

        <FormModal
          open={modals.user.open}
          onOpenChange={() => closeModal('user')}
          title="Editar Usuário"
          fields={userFields}
          data={modals.user.data}
          onSubmit={handleUpdateUser}
        />

        <ConfirmDialog
          open={confirmDialog.open}
          onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
          title={confirmDialog.title}
          description={confirmDialog.description}
          onConfirm={confirmDialog.onConfirm}
          loading={confirmDialog.loading}
        />
      </div>

      <UserDetailsModal
        userId={selectedUserId}
        open={userDetailsOpen}
        onOpenChange={setUserDetailsOpen}
      />
    </DashboardLayout>
  );
}