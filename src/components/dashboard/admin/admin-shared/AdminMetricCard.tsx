import { cn } from "cn";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

export interface AdminMetricCardProps {
  title: string;
  value: number | string;
  helper: string;
  icon: LucideIcon;
  accent?: "emerald" | "rose" | "slate" | "amber" | "blue" | "purple";
  active?: boolean;
  onClick?: () => void;
  subtext?: string;
}

export function AdminMetricCard({
  title,
  value,
  helper,
  icon: Icon,
  accent = "emerald",
  active = false,
  onClick,
  subtext,
}: AdminMetricCardProps) {
  const accentStyles = {
    emerald: {
      ring: active
        ? "border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/20"
        : "border-slate-200/80 bg-white",
      icon: "bg-emerald-50 text-emerald-800 border border-emerald-100",
      dot: "bg-emerald-600",
      value: "text-emerald-600",
      helper: "text-emerald-800",
    },
    rose: {
      ring: active
        ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20"
        : "border-slate-200/80 bg-white",
      icon: "bg-rose-50 text-rose-600 border border-rose-200",
      dot: "bg-rose-500",
      value: "text-slate-800",
      helper: "text-rose-600",
    },
    slate: {
      ring: active
        ? "border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/20"
        : "border-slate-200/80 bg-white",
      icon: "bg-slate-100 text-slate-700 border border-slate-200/80",
      dot: "bg-slate-400",
      value: "text-slate-900",
      helper: "text-slate-600",
    },
    amber: {
      ring: active
        ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20"
        : "border-slate-200/80 bg-white",
      icon: "bg-amber-50 text-amber-700 border border-amber-200",
      dot: "bg-amber-500",
      value: "text-slate-900",
      helper: "text-amber-700",
    },
    blue: {
      ring: active
        ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20"
        : "border-slate-200/80 bg-white",
      icon: "bg-blue-50 text-blue-700 border border-blue-200",
      dot: "bg-blue-500",
      value: "text-blue-700",
      helper: "text-blue-600",
    },
    purple: {
      ring: active
        ? "border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/20"
        : "border-slate-200/80 bg-white",
      icon: "bg-purple-50 text-purple-700 border border-purple-200",
      dot: "bg-purple-500",
      value: "text-purple-700",
      helper: "text-purple-600",
    },
  } as const;

  const styles = accentStyles[accent];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("w-full text-left transition hover:shadow-md cursor-pointer outline-none")}
    >
      <Card className={cn("relative overflow-hidden h-full rounded-2xl shadow-xs", styles.ring)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-3">
          <CardTitle className="text-sm font-medium text-slate-500">
            {title}
          </CardTitle>
          <div className={cn("rounded-xl p-2", styles.icon)}>
            <Icon className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="flex items-baseline gap-2">
            <span className={cn("text-2xl font-bold tracking-tight", styles.value)}>
              {value}
            </span>
            <span className="text-xs font-medium text-slate-400">{helper}</span>
          </div>
        </CardContent>
        {subtext ||
        title === "Suspended Accounts" ||
        title === "Active Accounts" ||
        title === "Total Enrolled Users" ? (
          <CardFooter className="p-5 pt-0">
            <div
              className={cn(
                "flex items-center gap-1.5 text-xs font-normal",
                styles.helper,
              )}
            >
              <span
                className={cn("inline-block h-1.5 w-1.5 rounded-full", styles.dot)}
              />
              {subtext ||
                (title === "Suspended Accounts"
                  ? "Revoked access"
                  : title === "Active Accounts"
                    ? "Access permitted"
                    : "Active enterprise directory")}
            </div>
          </CardFooter>
        ) : null}
      </Card>
    </button>
  );
}
