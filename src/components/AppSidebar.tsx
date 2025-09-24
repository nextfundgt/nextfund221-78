import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  TrendingUp, 
  DollarSign, 
  History, 
  HelpCircle, 
  LogOut,
  Bell,
  Copy,
  Check,
  Users,
  PlayCircle
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RealtimeNotifications } from "@/components/RealtimeNotifications";
import nextfundLogo from "@/assets/nextfund-logo-new.png";

const menuItems = [
  { title: "Dashboard", url: "/home", icon: LayoutDashboard },
  { title: "Tarefas", url: "/tasks", icon: PlayCircle },
  { title: "Carteira", url: "/wallet", icon: DollarSign },
  { title: "Afiliados", url: "/affiliate", icon: Users },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { preferences } = useUserPreferences();
  const [referralStats, setReferralStats] = useState({ count: 0, commission: 0 });
  const [copied, setCopied] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;
  const isExpanded = menuItems.some((item) => isActive(item.url));

  useEffect(() => {
    if (profile?.user_id) {
      fetchReferralStats();
      fetchUnreadNotifications();
    }
  }, [profile]);

  const fetchReferralStats = async () => {
    if (!profile?.user_id) return;

    try {
      const { data: referrals } = await supabase
        .from('affiliate_referrals')
        .select('reward_amount')
        .eq('affiliate_user_id', profile.user_id);

      const count = referrals?.length || 0;
      const commission = referrals?.reduce((sum, r) => sum + (r.reward_amount || 0), 0) || 0;

      setReferralStats({ count, commission });
    } catch (error) {
      console.error('Error fetching referral stats:', error);
    }
  };

  const fetchUnreadNotifications = async () => {
    if (!profile?.user_id) return;

    try {
      const { data } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', profile.user_id)
        .eq('is_read', false);

      setUnreadCount(data?.length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    `w-full justify-start ${isActive 
      ? "bg-primary/10 text-primary border-r-2 border-primary" 
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
    }`;

  const referralLink = profile?.affiliate_code 
    ? `${window.location.origin}/?ref=${profile.affiliate_code}`
    : '';

  const copyReferralLink = async () => {
    if (referralLink) {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Sidebar
      className={`${collapsed ? "w-14" : "w-64"} glass-card border-r transition-all duration-300`}
    >
      <SidebarContent className="p-4">
        {/* Header */}
        <div className={`flex items-center gap-3 mb-6 ${collapsed ? "justify-center" : ""}`}>
          <img src={nextfundLogo} alt="NextFund" className="w-12 h-12" />
          {!collapsed && (
            <div>
              <img src={nextfundLogo} alt="NextFund" className="h-10" />
              <p className="text-xs text-muted-foreground">Plataforma de Tarefas</p>
            </div>
          )}
        </div>

        {/* User Info */}
        {!collapsed && profile && (
          <div className="mb-4 sm:mb-6 p-2 sm:p-3 glass-card rounded-lg">
            <div className="text-xs sm:text-sm font-medium truncate">{profile.full_name}</div>
            <div className="text-xs text-muted-foreground truncate">
              Saldo: {preferences?.show_balance ? `R$ ${profile.balance?.toFixed(2) || '0,00'}` : "***"}
            </div>
          </div>
        )}

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClassName}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                      {item.title === "Afiliados" && unreadCount > 0 && !collapsed && (
                        <Badge variant="destructive" className="ml-auto text-xs">
                          {unreadCount}
                        </Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Referral Section */}
        {!collapsed && profile?.affiliate_code && (
          <div className="mt-4 sm:mt-6 p-2 sm:p-3 glass-card rounded-lg">
            <div className="flex items-center gap-1 sm:gap-2 mb-2">
              <Bell className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              <span className="text-xs sm:text-sm font-medium">Indique e Ganhe</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={referralLink}
                  readOnly
                  className="flex-1 text-xs bg-input border border-border rounded px-2 py-1 text-muted-foreground min-w-0 truncate"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyReferralLink}
                  className="h-6 w-6 p-0 flex-shrink-0"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground">
                <div className="truncate">Indicações: {referralStats.count}</div>
                <div className="truncate">Comissão: R$ {referralStats.commission.toFixed(2)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <div className="mt-auto">
          <Button
            variant="ghost"
            onClick={signOut}
            className={`w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 ${
              collapsed ? "px-2" : ""
            }`}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Sair</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}