"use client";

import { Activity, Building2, CheckCircle2, Power } from "lucide-react";
import type {
  DepartmentStats,
  SerializedDepartment,
} from "@/types/admin/departments";

interface DepartmentMetricCardsProps {
  departments: SerializedDepartment[];
  totalGrievances: number;
  stats?: DepartmentStats;
}

interface CompactCardProps {
  title: string;
  value: number | string;
  helper: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "emerald" | "amber" | "slate";
}

function CompactMetricCard({
  title,
  value,
  helper,
  icon: Icon,
  accent,
}: CompactCardProps) {
  const accentStyles = {
    emerald: {
      bg: "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800",
      iconBg:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
    },
    amber: {
      bg: "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800",
      iconBg:
        "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
    },
    slate: {
      bg: "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800",
      iconBg:
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    },
  };

  const style = accentStyles[accent];

  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 shadow-2xs ${style.bg}`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.iconBg}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate leading-tight">
          {title}
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
            {value}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate leading-tight">
            {helper}
          </span>
        </div>
      </div>
    </div>
  );
}

export function DepartmentMetricCards({
  departments,
  totalGrievances,
  stats,
}: DepartmentMetricCardsProps) {
  const total = stats?.total ?? departments.length;
  const active =
    stats?.active ??
    departments.filter((d) => (d.status || "ACTIVE") === "ACTIVE").length;
  const inactive =
    stats?.inactive ??
    departments.filter((d) => d.status === "INACTIVE").length;
  const cases = stats?.totalGrievances ?? totalGrievances;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
      <CompactMetricCard
        title="Total Departments"
        value={total}
        helper="Divisions"
        icon={Building2}
        accent="emerald"
      />
      <CompactMetricCard
        title="Active Departments"
        value={active}
        helper="Routing enabled"
        icon={CheckCircle2}
        accent="emerald"
      />
      <CompactMetricCard
        title="Deactivated / Inactive"
        value={inactive}
        helper="Suspended"
        icon={Power}
        accent="amber"
      />
      <CompactMetricCard
        title="Assigned Grievances"
        value={cases}
        helper="In lifecycle"
        icon={Activity}
        accent="slate"
      />
    </div>
  );
}
