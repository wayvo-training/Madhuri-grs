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
      chip: "bg-emerald-50 text-[#064E3B]",
      value: "text-slate-900",
      accent: "text-[#064E3B]",
      dot: "bg-emerald-600",
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
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        <div className={`rounded-xl p-2 ${styles[accent].chip}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span
          className={`text-2xl font-bold tracking-tight ${styles[accent].value}`}
        >
          {value}
        </span>
        <span className="text-xs font-medium text-slate-400">{helper}</span>
      </div>
      <div
        className={`mt-3 flex items-center gap-1.5 text-xs font-normal ${styles[accent].accent}`}
      >
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${styles[accent].dot}`}
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
