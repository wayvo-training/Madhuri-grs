import { cn } from "cn";
import type { LucideIcon } from "lucide-react";

export interface AdminMetricCardProps {
  title: string;
  value: number | string;
  helper: string;
  icon: LucideIcon;
  accent?: "emerald" | "rose" | "slate" | "amber";
  active?: boolean;
  onClick?: () => void;
}

export function AdminMetricCard({
  title,
  value,
  helper,
  icon: Icon,
  accent = "emerald",
  active = false,
  onClick,
}: AdminMetricCardProps) {
  const accentStyles = {
    emerald: {
      ring: active
        ? "border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/20"
        : "border-slate-200/80 bg-white",
      icon: "bg-emerald-50 text-emerald-800",
      dot: "bg-emerald-600",
      value: "text-emerald-600",
      helper: "text-emerald-800",
    },
    rose: {
      ring: active
        ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20"
        : "border-slate-200/80 bg-white",
      icon: "bg-rose-50 text-rose-600",
      dot: "bg-rose-500",
      value: "text-slate-800",
      helper: "text-rose-600",
    },
    slate: {
      ring: active
        ? "border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/20"
        : "border-slate-200/80 bg-white",
      icon: "bg-slate-100 text-slate-700",
      dot: "bg-slate-400",
      value: "text-slate-900",
      helper: "text-slate-600",
    },
    amber: {
      ring: active
        ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20"
        : "border-slate-200/80 bg-white",
      icon: "bg-amber-50 text-amber-700",
      dot: "bg-amber-500",
      value: "text-slate-900",
      helper: "text-amber-700",
    },
  } as const;

  const styles = accentStyles[accent];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-5 text-left shadow-xs transition hover:shadow-md cursor-pointer",
        styles.ring,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        <div className={cn("rounded-xl p-2", styles.icon)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className={cn("text-2xl font-bold tracking-tight", styles.value)}>
          {value}
        </span>
        <span className="text-xs font-medium text-slate-400">{helper}</span>
      </div>
      <div
        className={cn(
          "mt-3 flex items-center gap-1.5 text-xs font-normal",
          styles.helper,
        )}
      >
        <span
          className={cn("inline-block h-1.5 w-1.5 rounded-full", styles.dot)}
        />
        {title === "Suspended Accounts"
          ? "Revoked access"
          : title === "Active Accounts"
            ? "Access permitted"
            : title === "Total Enrolled Users"
              ? "Active enterprise directory"
              : "Resolution staff"}
      </div>
    </button>
  );
}
