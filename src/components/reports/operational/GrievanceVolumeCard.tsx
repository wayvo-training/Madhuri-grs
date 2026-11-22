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
import type { ElementType } from "react";
import type { GrievanceVolumeSummary } from "@/types/reports";

export interface GrievanceVolumeCardProps {
  summary: GrievanceVolumeSummary;
  onCardClick?: (metricKey: string) => void;
}

interface VolumeMetricItem {
  key: string;
  label: string;
  value: number;
  description: string;
  icon: ElementType;
  color: string;
  bg: string;
  border: string;
  valueColor: string;
}

export function GrievanceVolumeCard({
  summary,
  onCardClick,
}: GrievanceVolumeCardProps) {
  const metrics: VolumeMetricItem[] = [
    {
      key: "total",
      label: "Total Received",
      value: summary.totalUniqueGrievances,
      description: "Deduplicated unique cases",
      icon: FileText,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
      border: "border-slate-200 dark:border-slate-800",
      valueColor: "text-slate-900 dark:text-slate-100",
    },
    {
      key: "active",
      label: "Active In-Flight",
      value: summary.activeGrievances,
      description: "Under active investigation",
      icon: Clock,
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-50 dark:bg-sky-950/40",
      border: "border-slate-200 dark:border-slate-800",
      valueColor: "text-sky-700 dark:text-sky-300",
    },
    {
      key: "resolved",
      label: "Resolved",
      value: summary.resolvedGrievances,
      description: "Resolution issued/approved",
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      border: "border-slate-200 dark:border-slate-800",
      valueColor: "text-emerald-700 dark:text-emerald-300",
    },
    {
      key: "closed",
      label: "Closed",
      value: summary.closedGrievances,
      description: "Final closed state",
      icon: FileCheck,
      color: "text-slate-600 dark:text-slate-400",
      bg: "bg-slate-100 dark:bg-slate-800",
      border: "border-slate-200 dark:border-slate-800",
      valueColor: "text-slate-700 dark:text-slate-300",
    },
    {
      key: "sla_at_risk",
      label: "SLA At Risk",
      value: summary.slaApproachingGrievances,
      description: "Approaching deadline (50-99%)",
      icon: AlertTriangle,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
      border: "border-amber-200/80 dark:border-amber-900/40",
      valueColor:
        summary.slaApproachingGrievances > 0
          ? "text-amber-700 dark:text-amber-400"
          : "text-slate-900 dark:text-slate-100",
    },
    {
      key: "sla_breached",
      label: "SLA Breached",
      value: summary.slaBreachedGrievances,
      description: "Exceeded SLA (≥ 100%)",
      icon: AlertCircle,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/40",
      border: "border-rose-200/80 dark:border-rose-900/40",
      valueColor:
        summary.slaBreachedGrievances > 0
          ? "text-rose-700 dark:text-rose-400"
          : "text-slate-900 dark:text-slate-100",
    },
    {
      key: "escalated",
      label: "Escalated",
      value: summary.escalatedGrievances,
      description: "Recorded escalation events",
      icon: ShieldAlert,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/40",
      border: "border-slate-200 dark:border-slate-800",
      valueColor: "text-purple-700 dark:text-purple-300",
    },
    {
      key: "unassigned",
      label: "Unassigned",
      value: summary.unassignedGrievances,
      description: "Awaiting staff assignment",
      icon: UserX,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/40",
      border: "border-slate-200 dark:border-slate-800",
      valueColor: "text-indigo-700 dark:text-indigo-300",
    },
  ];

  return (
    <section aria-label="Executive KPI Summary">
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <button
              type="button"
              key={metric.key}
              onClick={() => onCardClick?.(metric.key)}
              disabled={!onCardClick}
              className={`text-left bg-white dark:bg-slate-900 border ${metric.border} rounded-lg p-3.5 transition-all shadow-xs hover:shadow-sm ${
                onCardClick
                  ? "cursor-pointer hover:border-slate-300 dark:hover:border-slate-700"
                  : "cursor-default"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate">
                  {metric.label}
                </span>
                <div className={`p-1 rounded-md ${metric.bg} shrink-0`}>
                  <Icon className={`h-3.5 w-3.5 ${metric.color}`} />
                </div>
              </div>

              <div
                className={`text-2xl font-bold font-mono tracking-tight tabular-nums ${metric.valueColor}`}
              >
                {metric.value.toLocaleString()}
              </div>

              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {metric.description}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
