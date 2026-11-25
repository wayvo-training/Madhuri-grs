import { Activity, AlertTriangle, ShieldCheck } from "lucide-react";
import type { AuditStats, TabCategory } from "@/types/admin/audit";

interface AuditMetricCardsProps {
  totalCount: number;
  stats?: AuditStats;
  activeTab?: TabCategory;
  onSelectTab?: (tab: TabCategory) => void;
}

function MetricCard({
  title,
  value,
  helper,
  subtitle,
  icon: Icon,
  accent,
  isActive,
  onClick,
}: {
  title: string;
  value: number | string;
  helper: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "emerald" | "amber" | "slate";
  isActive?: boolean;
  onClick?: () => void;
}) {
  const styles = {
    emerald: {
      chip: "bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400 border border-teal-200/50 dark:border-teal-800/40",
      value: "text-slate-900 dark:text-white",
      accent: "text-[#0F766E] dark:text-teal-400",
      dot: "bg-[#0F766E] dark:bg-teal-400",
    },
    slate: {
      chip: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60",
      value: "text-slate-900 dark:text-white",
      accent: "text-slate-600 dark:text-slate-400",
      dot: "bg-slate-500 dark:bg-slate-400",
    },
    amber: {
      chip: "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40",
      value: "text-amber-950 dark:text-amber-200",
      accent: "text-amber-800 dark:text-amber-400",
      dot: "bg-amber-600 dark:bg-amber-400",
    },
  } as const;

  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`relative overflow-hidden rounded-xl border bg-white dark:bg-slate-900 p-3 sm:p-3.5 flex flex-col justify-between min-h-[90px] sm:min-h-[96px] shadow-2xs transition-all duration-150 text-left ${
        onClick ? "cursor-pointer hover:shadow-xs" : "cursor-default"
      } ${
        isActive
          ? "border-[#0F766E] ring-2 ring-[#0F766E]/20 bg-teal-50/20 dark:border-teal-500 dark:bg-teal-950/20 shadow-xs"
          : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
          {title}
        </span>
        <div
          className={`flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg ${styles[accent].chip}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span
          className={`text-xl sm:text-2xl font-bold font-mono tracking-tight leading-none ${styles[accent].value}`}
        >
          {value}
        </span>
        <span className="text-[11px] sm:text-xs font-medium text-slate-400 truncate">
          {helper}
        </span>
      </div>
      <div
        className={`mt-auto pt-1 flex items-center gap-1.5 text-[10.5px] sm:text-[11px] font-normal ${styles[accent].accent}`}
      >
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${styles[accent].dot}`}
        />
        <span className="truncate">{subtitle}</span>
      </div>
    </Component>
  );
}

export function AuditMetricCards({
  totalCount,
  stats,
  activeTab,
  onSelectTab,
}: AuditMetricCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 shrink-0">
      <MetricCard
        title="Total Audited Events"
        value={stats?.total ?? totalCount}
        helper="Recorded"
        subtitle="Immutable system ledger"
        icon={Activity}
        accent="emerald"
        isActive={activeTab === "ALL"}
        onClick={() => onSelectTab?.("ALL")}
      />
      <MetricCard
        title="Governance & Config"
        value={stats?.config ?? "-"}
        helper="Governance events"
        subtitle="Role, dept & policy audits"
        icon={ShieldCheck}
        accent="slate"
        isActive={activeTab === "CONFIG"}
        onClick={() => onSelectTab?.("CONFIG")}
      />
      <MetricCard
        title="Errors & Exceptions"
        value={stats?.errors ?? "-"}
        helper="Logged"
        subtitle="Security & runtime alerts"
        icon={AlertTriangle}
        accent="amber"
        isActive={activeTab === "ERROR"}
        onClick={() => onSelectTab?.("ERROR")}
      />
    </div>
  );
}
