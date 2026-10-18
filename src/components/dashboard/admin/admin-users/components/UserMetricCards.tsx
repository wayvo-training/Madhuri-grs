"use client";

import { CheckCircle2, ShieldCheck, UserCheck, Users } from "lucide-react";
import type { SerializedUser, UserStats } from "@/types/admin/users";

interface UserMetricCardsProps {
  users: SerializedUser[];
  stats?: UserStats;
}

interface CompactCardProps {
  title: string;
  value: number | string;
  helper: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "slate" | "emerald" | "amber";
}

function CompactMetricCard({
  title,
  value,
  helper,
  icon: Icon,
  accent,
}: CompactCardProps) {
  const accentStyles = {
    slate: {
      bg: "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800",
      iconBg:
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    },
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

export function UserMetricCards({ users, stats }: UserMetricCardsProps) {
  const total = stats?.total ?? users.length;
  const active =
    stats?.active ??
    users.filter((u) => (u.status || "ACTIVE") === "ACTIVE").length;
  const staff =
    stats?.staff ??
    users.filter(
      (u) => u.role_name === "STAFF" || u.role_name === "DEPARTMENT_HEAD",
    ).length;
  const endUsers =
    stats?.endUsers ?? users.filter((u) => u.role_name === "END_USER").length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
      <CompactMetricCard
        title="Total Users"
        value={total}
        helper="All system accounts"
        icon={Users}
        accent="slate"
      />
      <CompactMetricCard
        title="Active Accounts"
        value={active}
        helper="Operational access"
        icon={CheckCircle2}
        accent="emerald"
      />
      <CompactMetricCard
        title="Grievance Officers"
        value={staff}
        helper="Staff & Dept Heads"
        icon={ShieldCheck}
        accent="amber"
      />
      <CompactMetricCard
        title="End Users"
        value={endUsers}
        helper="Portal employees"
        icon={UserCheck}
        accent="slate"
      />
    </div>
  );
}
