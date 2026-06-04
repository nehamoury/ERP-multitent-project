// src/components/ui/stats-card.tsx
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: "blue" | "green" | "red" | "amber" | "purple";
  className?: string;
}

const colorMap = {
  blue:   { bg: "bg-blue-50 dark:bg-blue-900/20",   icon: "text-blue-600 dark:text-blue-400",   ring: "ring-blue-500/20" },
  green:  { bg: "bg-emerald-50 dark:bg-emerald-900/20", icon: "text-emerald-600 dark:text-emerald-400", ring: "ring-emerald-500/20" },
  red:    { bg: "bg-red-50 dark:bg-red-900/20",     icon: "text-red-600 dark:text-red-400",     ring: "ring-red-500/20" },
  amber:  { bg: "bg-amber-50 dark:bg-amber-900/20", icon: "text-amber-600 dark:text-amber-400", ring: "ring-amber-500/20" },
  purple: { bg: "bg-purple-50 dark:bg-purple-900/20", icon: "text-purple-600 dark:text-purple-400", ring: "ring-purple-500/20" },
};

export function StatsCard({ title, value, subtitle, icon: Icon, trend, color = "blue", className }: Props) {
  const colors = colorMap[color];
  return (
    <div className={cn("bg-card rounded-xl border border-border p-6 hover:shadow-md transition-all duration-200", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-display font-bold tabular-nums">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          {trend && (
            <p className={cn("text-xs font-medium mt-2", trend.value >= 0 ? "text-emerald-600" : "text-red-500")}>
              {trend.value >= 0 ? "▲" : "▼"} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center ring-1", colors.bg, colors.ring)}>
          <Icon size={22} className={colors.icon} />
        </div>
      </div>
    </div>
  );
}
