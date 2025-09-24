import { ReactNode } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Settings } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { BottomNavigation } from "@/components/BottomNavigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { NotificationBell } from "@/components/NotificationBell";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  showBackButton?: boolean;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

const getPageInfo = (pathname: string) => {
  const pages: Record<string, { title: string; description: string }> = {
    '/home': { 
      title: 'Dashboard', 
      description: 'Visão geral dos seus ganhos' 
    },
    '/wallet': { 
      title: 'Carteira', 
      description: 'Gerencie depósitos, saques e histórico' 
    },
    '/affiliate': { 
      title: 'Afiliados', 
      description: 'Gerencie suas indicações e comissões' 
    },
    '/support': { 
      title: 'Suporte', 
      description: 'Central de ajuda e atendimento' 
    },
    '/profile': { 
      title: 'Perfil', 
      description: 'Gerencie suas informações pessoais' 
    },
    '/admin': { 
      title: 'Administração', 
      description: 'Painel administrativo do sistema' 
    }
  };

  return pages[pathname] || { title: 'Página', description: '' };
};

export function DashboardLayout({ 
  children, 
  title: customTitle, 
  description: customDescription, 
  showBackButton = false,
  breadcrumbs 
}: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const { isAdmin } = useUserRole();
  
  const pageInfo = getPageInfo(location.pathname);
  const title = customTitle || pageInfo.title;
  const description = customDescription || pageInfo.description;

  const defaultBreadcrumbs = [
    { label: 'Início', href: '/home' },
    { label: title }
  ];

  const activeBreadcrumbs = breadcrumbs || defaultBreadcrumbs;

  const handleBackClick = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/home');
    }
  };

  return (
    <div className="bg-black font-sans antialiased text-white overflow-x-hidden min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.05),transparent_50%)]"></div>
      </div>

      <SidebarProvider>
        <div className="min-h-screen flex w-full relative z-10">
        {/* Desktop Sidebar - Hidden on mobile */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        
        <main className="flex-1">
          {/* Top Bar - Desktop only */}
          <header className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-xl hidden md:block" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
            <div className="flex h-12 sm:h-14 items-center gap-2 sm:gap-4 px-3 sm:px-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                {showBackButton && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleBackClick}
                    className="p-1 h-8 w-8 sm:h-9 sm:w-9"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                {/* Breadcrumbs */}
                <div>
                  <Breadcrumb>
                    <BreadcrumbList>
                      {activeBreadcrumbs.map((crumb, index) => (
                        <div key={index} className="flex items-center">
                          {index > 0 && <BreadcrumbSeparator />}
                          <BreadcrumbItem>
                            {crumb.href ? (
                              <BreadcrumbLink asChild>
                                <Link to={crumb.href}>{crumb.label}</Link>
                              </BreadcrumbLink>
                            ) : (
                              <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                            )}
                          </BreadcrumbItem>
                        </div>
                      ))}
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>

                {/* Page Title */}
                <div className="min-w-0 flex-1">
                  <h1 className="text-sm sm:text-lg lg:text-xl font-semibold truncate">
                    {title}
                  </h1>
                  {description && (
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {description}
                    </p>
                  )}
                </div>
              </div>
            
              <div className="flex items-center gap-2">
                {/* Notification Bell */}
                <NotificationBell />
                
                {/* User Info */}
                <div className="text-right">
                  <p className="text-sm font-medium truncate max-w-32">
                    {profile?.full_name || 'Usuário'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    R$ {profile?.balance?.toFixed(2) || '0,00'}
                  </p>
                </div>

                {/* Admin Button */}
                {isAdmin && location.pathname !== '/admin' && (
                  <Link to="/admin">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </header>

          {/* Mobile Header */}
          <header className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-xl md:hidden pt-safe-top" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
            <div className="flex min-h-[3.5rem] items-center justify-between px-4 py-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {showBackButton && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleBackClick}
                    className="p-1.5 h-8 w-8 touch-target flex-shrink-0 rounded-full"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}
                <div className="min-w-0 flex-1 overflow-hidden">
                  <h1 className="text-base font-semibold leading-tight truncate">
                    {title}
                  </h1>
                  {description && (
                    <p className="text-xs text-muted-foreground leading-tight truncate">
                      {description}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* User Balance */}
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-muted-foreground">Saldo</p>
                  <p className="text-sm font-medium">
                    R$ {profile?.balance?.toFixed(2) || '0,00'}
                  </p>
                </div>
                
                {/* Notification Bell */}
                <NotificationBell />
                
                {/* Admin Button */}
                {isAdmin && location.pathname !== '/admin' && (
                  <Link to="/admin">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-1.5 touch-target">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="p-3 md:p-4 lg:p-6 pb-20 md:pb-6 max-w-full overflow-hidden">
            <div className="w-full max-w-7xl mx-auto space-y-4">
              {children}
            </div>
          </div>
        </main>
        </div>
        
        {/* Mobile Bottom Navigation */}
        <BottomNavigation />
      </SidebarProvider>
    </div>
  );
}