"use client";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  ShieldAlert,
  UserX,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import type { GrievanceVolumeSummary } from "@/types/reports";

export interface GrievanceVolumeCardProps {
  summary: GrievanceVolumeSummary;
}

export function GrievanceVolumeCard({ summary }: GrievanceVolumeCardProps) {
  const cards = [
    {
      label: "Total Unique Grievances",
      value: summary.totalUniqueGrievances,
      description: "Deduplicated received volume",
      icon: FileText,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
      border: "border-blue-200/80 dark:border-blue-900/40",
    },
    {
      label: "Active / In Workflow",
      value: summary.activeGrievances,
      description: "Under active investigation",
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
      border: "border-amber-200/80 dark:border-amber-900/40",
    },
    {
      label: "Resolved",
      value: summary.resolvedGrievances,
      description: "Resolution approved/issued",
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      border: "border-emerald-200/80 dark:border-emerald-900/40",
    },
    {
      label: "Closed",
      value: summary.closedGrievances,
      description: "Final closed state",
      icon: FileCheck,
      color: "text-slate-600 dark:text-slate-400",
      bg: "bg-slate-100 dark:bg-slate-800",
      border: "border-slate-200/80 dark:border-slate-700",
    },
    {
      label: "Active Approaching SLA",
      value: summary.slaApproachingGrievances,
      description: "At risk open cases",
      icon: AlertTriangle,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-950/40",
      border: "border-orange-200/80 dark:border-orange-900/40",
    },
    {
      label: "Active SLA Breached",
      value: summary.slaBreachedGrievances,
      description: "Exceeded target open cases",
      icon: AlertCircle,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/40",
      border: "border-rose-200/80 dark:border-rose-900/40",
    },
    {
      label: "Recorded Escalations",
      value: summary.escalatedGrievances,
      description: "Cases with active escalations",
      icon: ShieldAlert,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/40",
      border: "border-purple-200/80 dark:border-purple-900/40",
    },
    {
      label: "Unassigned Cases",
      value: summary.unassignedGrievances,
      description: "Awaiting staff assignment",
      icon: UserX,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/40",
      border: "border-indigo-200/80 dark:border-indigo-900/40",
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card
              key={c.label}
              className={`p-3 border ${c.border} bg-white dark:bg-slate-900 shadow-2xs hover:shadow-xs transition-shadow`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-1">
                  {c.label}
                </span>
                <div className={`p-1 rounded-md ${c.bg} shrink-0`}>
                  <Icon className={`h-3.5 w-3.5 ${c.color}`} />
                </div>
              </div>
              <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {c.value.toLocaleString()}
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                {c.description}
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
