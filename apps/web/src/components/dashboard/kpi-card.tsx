import type { ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: { value: number; label: string };
  icon: ReactNode;
  color: string;
}

export function KPICard({ label, value, sub, trend, icon, color }: KPICardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
          <div className={cn("p-2 rounded-lg", color)}>{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground">{value}</div>
        <div className="flex items-center gap-2 mt-1 text-xs">
          {sub && <span className="text-muted-foreground">{sub}</span>}
          {trend && (
            <span className={cn("flex items-center gap-1 font-medium", trend.value >= 0 ? "text-green-600" : "text-red-600")}>
              {trend.value >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground">{trend.label}</span>
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
