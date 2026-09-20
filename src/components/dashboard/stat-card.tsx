import { TrendingDown, TrendingUp } from "lucide-react";
import type { ElementType, ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ElementType;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  description?: string;
  accentColor?: "blue" | "emerald" | "amber" | "rose" | "purple";
  badge?: ReactNode;
}

const colorMap = {
  blue: {
    iconBg: "bg-blue-50 text-blue-600",
    borderGlow: "hover:border-blue-200",
  },
  emerald: {
    iconBg: "bg-emerald-50 text-emerald-600",
    borderGlow: "hover:border-emerald-200",
  },
  amber: {
    iconBg: "bg-amber-50 text-amber-600",
    borderGlow: "hover:border-amber-200",
  },
  rose: {
    iconBg: "bg-rose-50 text-rose-600",
    borderGlow: "hover:border-rose-200",
  },
  purple: {
    iconBg: "bg-purple-50 text-purple-600",
    borderGlow: "hover:border-purple-200",
  },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  description,
  accentColor = "blue",
  badge,
}: StatCardProps) {
  const styles = colorMap[accentColor] || colorMap.blue;

  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs transition-all duration-200 hover:shadow-md ${styles.borderGlow}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles.iconBg}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-3">
        <p className="text-3xl font-bold tracking-tight text-slate-900">
          {value}
        </p>
        {badge}
      </div>

      {(trend || description) && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          {trend && (
            <span
              className={`inline-flex items-center gap-1 font-semibold ${
                trend.isPositive ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {trend.isPositive ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {trend.value}
            </span>
          )}
          {description && <span className="truncate">{description}</span>}
        </div>
      )}
    </div>
  );
}
