import { Link } from "react-router-dom";
import { DollarSign, CreditCard, TrendingUp, History, PieChart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const quickActions = [
  {
    name: "Depósito",
    href: "/wallet",
    icon: DollarSign,
    color: "text-success",
    bgColor: "bg-success/10"
  },
  {
    name: "Saque", 
    href: "/wallet",
    icon: CreditCard,
    color: "text-warning",
    bgColor: "bg-warning/10"
  },
  {
    name: "Rendimentos",
    href: "/tasks",
    icon: TrendingUp,
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  {
    name: "Histórico",
    href: "/wallet", 
    icon: History,
    color: "text-accent",
    bgColor: "bg-accent/10"
  }
];

export function QuickNavigation() {
  return (
    <div className="glass-card-mobile rounded-2xl">
      <div className="grid grid-cols-4 gap-4 md:gap-6">
        {quickActions.map((action) => (
          <Link
            key={action.name}
            to={action.href}
            className="flex flex-col items-center space-y-3 p-4 md:p-5 rounded-xl hover:bg-white/5 transition-all duration-200 group touch-target"
          >
            <div className={`p-4 md:p-5 rounded-full ${action.bgColor} ${action.color} group-hover:scale-110 transition-transform duration-200`}>
              <action.icon className="h-6 w-6 md:h-7 md:w-7" />
            </div>
            <span className="text-fluid-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-200 text-center leading-tight">
              {action.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}