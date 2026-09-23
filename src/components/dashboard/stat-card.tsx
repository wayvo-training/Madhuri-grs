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
  accentColor?: "blue" | "emerald" | "amber" | "rose" | "purple" | "slate";
  badge?: ReactNode;
}

const colorMap = {
  slate: {
    iconBg: "bg-slate-100 text-slate-700 border border-slate-200/80",
    borderGlow: "hover:border-slate-300",
  },
  emerald: {
    iconBg: "bg-emerald-50 text-emerald-800 border border-emerald-100",
    borderGlow: "hover:border-emerald-300",
  },
  blue: {
    iconBg: "bg-sky-50 text-sky-700",
    borderGlow: "hover:border-sky-200",
  },
  amber: {
    iconBg: "bg-amber-50 text-amber-800 border border-amber-200",
    borderGlow: "hover:border-amber-300",
  },
  rose: {
    iconBg: "bg-rose-50 text-rose-700",
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
  accentColor = "emerald",
  badge,
}: StatCardProps) {
  const styles = colorMap[accentColor] || colorMap.emerald;

  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs transition-all duration-200 hover:shadow-md ${styles.borderGlow}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${styles.iconBg}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-3.5 flex items-baseline gap-3">
        <p className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
          {value}
        </p>
        {badge}
      </div>

      {(trend || description) && (
        <div className="mt-3 flex items-center gap-2 text-xs sm:text-sm font-normal text-slate-600">
          {trend && (
            <span
              className={`inline-flex items-center gap-1 font-semibold ${
                trend.isPositive ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {trend.value}
            </span>
          )}
          {description && (
            <span className="truncate font-normal">{description}</span>
          )}
        </div>
      )}
    </div>
  );
}
