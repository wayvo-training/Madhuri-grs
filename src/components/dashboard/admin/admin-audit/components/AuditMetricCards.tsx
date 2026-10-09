import { Activity, AlertTriangle, LogIn, Server } from "lucide-react";
import type { AuditStats } from "@/types/admin/audit";

interface AuditMetricCardsProps {
  totalCount: number;
  stats?: AuditStats;
}

function MetricCard({
  title,
  value,
  helper,
  icon: Icon,
  accent,
}: {
  title: string;
  value: number | string;
  helper: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "emerald" | "amber" | "slate" | "rose";
}) {
  const styles = {
    emerald: {
      chip: "bg-[#F0FDFA] text-[#0F766E]",
      value: "text-slate-900",
      accent: "text-[#0F766E]",
      dot: "bg-[#0F766E]",
    },
    amber: {
      chip: "bg-amber-50 text-amber-800 border border-amber-200",
      value: "text-amber-900",
      accent: "text-amber-800",
      dot: "bg-amber-600",
    },
    slate: {
      chip: "bg-slate-100 text-slate-700",
      value: "text-slate-900",
      accent: "text-slate-600",
      dot: "bg-slate-400",
    },
    rose: {
      chip: "bg-rose-50 text-rose-600",
      value: "text-rose-700",
      accent: "text-rose-600",
      dot: "bg-rose-500",
    },
  } as const;

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 flex flex-col justify-between h-[115px] sm:h-[120px] shadow-2xs transition-all duration-150 hover:shadow-sm cursor-pointer">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate">
          {title}
        </span>
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${styles[accent].chip}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span
          className={`text-xl font-bold tracking-tight leading-none ${styles[accent].value}`}
        >
          {value}
        </span>
        <span className="text-[11px] font-medium text-slate-400 truncate">
          {helper}
        </span>
      </div>
      <div
        className={`mt-auto pt-1 flex items-center gap-1.5 text-[11px] font-normal ${styles[accent].accent}`}
      >
        <span
          className={`inline-block h-1 w-1 rounded-full ${styles[accent].dot}`}
        />
        {title === "Errors & Exceptions"
          ? "Security & runtime alerts"
          : title === "API Requests & Route Calls"
            ? "Automated API telemetry"
            : title === "User Sessions & Logins"
              ? "Sign-ins & session tokens"
              : "Immutable system ledger"}
      </div>
    </div>
  );
}

export function AuditMetricCards({ totalCount, stats }: AuditMetricCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Audited Events"
        value={stats?.total ?? totalCount}
        helper="Recorded"
        icon={Activity}
        accent="emerald"
      />
      <MetricCard
        title="User Sessions & Logins"
        value={stats?.sessions ?? "-"}
        helper="Auth events"
        icon={LogIn}
        accent="emerald"
      />
      <MetricCard
        title="API Requests & Route Calls"
        value={stats?.apis ?? "-"}
        helper="Transactions"
        icon={Server}
        accent="slate"
      />
      <MetricCard
        title="Errors & Exceptions"
        value={stats?.errors ?? "-"}
        helper="Logged"
        icon={AlertTriangle}
        accent="amber"
      />
    </div>
  );
}
