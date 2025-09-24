import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  className?: string;
  color?: 'primary' | 'success' | 'warning' | 'destructive' | 'secondary';
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  className,
  color = 'primary'
}: StatsCardProps) {
  const colorClasses = {
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    destructive: 'text-destructive',
    secondary: 'text-secondary'
  };

  return (
    <Card className={`glass-card border-border ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorClasses[color]}`}>
          {typeof value === 'number' && value.toLocaleString 
            ? value.toLocaleString('pt-BR')
            : value
          }
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <span className={`text-xs ${
              trend.positive ? 'text-success' : 'text-destructive'
            }`}>
              {trend.positive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-xs text-muted-foreground">
              {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}