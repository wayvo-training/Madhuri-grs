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
  className?: string;
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
  className = "",
}: StatCardProps) {
  const styles = colorMap[accentColor] || colorMap.emerald;

  return (
    <div
      className={`rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs transition-all duration-150 hover:shadow-xs flex flex-col justify-between h-28.75 sm:h-30 ${styles.borderGlow} ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-2.75 font-semibold uppercase tracking-wider text-slate-500 truncate">
          {label}
        </p>
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg ${styles.iconBg} shrink-0`}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>

      <div className="mt-1 flex items-baseline gap-2">
        <p className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-none">
          {value}
        </p>
        {badge}
      </div>

      {(trend || description) && (
        <div className="mt-auto pt-1 flex items-center gap-1.5 text-xs font-normal text-slate-500">
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 text-2.75 font-semibold ${
                trend.isPositive ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trend.value}
            </span>
          )}
          {description && (
            <span className="truncate text-2.75 text-slate-500">
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
