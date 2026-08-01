import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: { value: number; label: string };
  icon: ReactNode;
  color: string;
  sparkline?: ReactNode;
}

const COLOR_MAP: Record<string, { border: string; bg: string; glow: string; iconBg: string }> = {
  "bg-blue-500":    { border: "border-l-blue-500",   bg: "from-blue-500/10 to-transparent",   glow: "shadow-blue-500/5",  iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400" },
  "bg-green-500":   { border: "border-l-green-500",  bg: "from-green-500/10 to-transparent",  glow: "shadow-green-500/5", iconBg: "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400" },
  "bg-orange-500":  { border: "border-l-orange-500", bg: "from-orange-500/10 to-transparent", glow: "shadow-orange-500/5", iconBg: "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400" },
  "bg-purple-500":  { border: "border-l-purple-500", bg: "from-purple-500/10 to-transparent", glow: "shadow-purple-500/5", iconBg: "bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400" },
  "bg-indigo-500":  { border: "border-l-indigo-500", bg: "from-indigo-500/10 to-transparent", glow: "shadow-indigo-500/5", iconBg: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400" },
  "bg-yellow-500":  { border: "border-l-yellow-500", bg: "from-yellow-500/10 to-transparent", glow: "shadow-yellow-500/5", iconBg: "bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400" },
  "bg-red-500":     { border: "border-l-red-500",    bg: "from-red-500/10 to-transparent",    glow: "shadow-red-500/5",   iconBg: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400" },
  "bg-cyan-500":    { border: "border-l-cyan-500",   bg: "from-cyan-500/10 to-transparent",   glow: "shadow-cyan-500/5",  iconBg: "bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400" },
  "bg-pink-500":    { border: "border-l-pink-500",   bg: "from-pink-500/10 to-transparent",   glow: "shadow-pink-500/5",  iconBg: "bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400" },
  "bg-emerald-500": { border: "border-l-emerald-500",bg: "from-emerald-500/10 to-transparent",glow: "shadow-emerald-500/5",iconBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" },
};

export function KPICard({ label, value, sub, trend, icon, color, sparkline }: KPICardProps) {
  const scheme = COLOR_MAP[color] ?? { border: "border-l-gray-500", bg: "from-gray-500/10 to-transparent", glow: "shadow-gray-500/5", iconBg: "bg-gray-500/20 text-gray-400 dark:text-gray-400" };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.06] dark:bg-gradient-to-br",
        "dark:from-white/[0.04] dark:to-white/[0.01] backdrop-blur-sm",
        "border-l-[3px]",
        scheme.border,
        "transition-all duration-200 hover:shadow-lg",
        scheme.glow,
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-r opacity-50", scheme.bg)} />
      <div className="relative p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-white/40">{label}</p>
            <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{value}</p>
          </div>
          <div className={cn("rounded-lg p-2.5", scheme.iconBg)}>
            {icon}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            {sub && <span className="text-gray-500 dark:text-white/40">{sub}</span>}
            {trend && (
              <span className={cn("flex items-center gap-0.5 font-medium", trend.value >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                {trend.value >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(trend.value)}%
              </span>
            )}
          </div>
          {sparkline && <div className="h-8 w-16">{sparkline}</div>}
        </div>
      </div>
    </div>
  );
}
