import { NavLink, useLocation } from "react-router-dom";
import { Wallet, Home, Users, User, BarChart3, PlayCircle } from "lucide-react";

const navigationItems = [
  {
    name: "Home",
    href: "/home",
    icon: Home,
  },
  {
    name: "Tarefa",
    href: "/tasks",
    icon: PlayCircle,
  },
  {
    name: "Carteira",
    href: "/wallet",
    icon: Wallet,
  },
  {
    name: "Gestão de Equipe",
    href: "/team",
    icon: Users,
  },
  {
    name: "Nível",
    href: "/level",
    icon: BarChart3,
  },
  {
    name: "Meu",
    href: "/profile",
    icon: User,
  },
];

export function BottomNavigation() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border/30 md:hidden backdrop-blur-xl pb-safe-bottom" style={{ background: 'rgba(0, 0, 0, 0.9)' }}>
      <div className="grid grid-cols-6 h-16 px-1">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center justify-center space-y-1 transition-all duration-200 ease-in-out relative group touch-target rounded-xl mx-1 min-h-[3.5rem] ${
                isActive
                  ? "text-primary bg-primary/15 scale-105 shadow-lg"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5 active:bg-white/10 active:scale-95"
              }`}
            >
              <item.icon className={`h-5 w-5 transition-all duration-200 ${
                isActive ? "scale-110" : "group-hover:scale-105 group-active:scale-95"
              }`} />
              <span className="text-[9px] font-medium leading-none text-center px-0.5 truncate max-w-full">
                {item.name}
              </span>
              {isActive && (
                <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-full animate-pulse" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}