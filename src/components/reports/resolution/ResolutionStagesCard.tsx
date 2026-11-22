"use client";

import { CheckCircle2, Clock, FileCheck, FileText, Layers } from "lucide-react";
import type { ResolutionStageItem } from "@/types/reports";

export interface ResolutionStagesCardProps {
  stages: ResolutionStageItem[];
}

export function ResolutionStagesCard({ stages }: ResolutionStagesCardProps) {
  const getStageIcon = (stage: string) => {
    switch (stage) {
      case "SUBMISSIONS":
        return (
          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        );
      case "PENDING_REVIEW":
        return <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      case "AWAITING_EMPLOYEE":
        return (
          <FileCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        );
      case "CLOSED":
        return (
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        );
      default:
        return <Layers className="h-4 w-4 text-slate-500" />;
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "SUBMISSIONS":
        return "bg-blue-500";
      case "PENDING_REVIEW":
        return "bg-amber-500";
      case "AWAITING_EMPLOYEE":
        return "bg-purple-500";
      case "CLOSED":
        return "bg-emerald-500";
      default:
        return "bg-slate-500";
    }
  };

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-blue-600" />
            Resolution Workflow Stages
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Distinct resolution milestones from draft submission to final
            closure
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {stages.map((st) => (
          <div
            key={st.stage}
            className="flex flex-col justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {st.label}
                </span>
                {getStageIcon(st.stage)}
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {st.count.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  ({st.percentage}%)
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {st.description}
              </p>
            </div>

            <div className="mt-3.5 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden dark:bg-slate-700">
              <div
                className={`h-full rounded-full ${getStageColor(st.stage)}`}
                style={{
                  width: `${Math.min(100, Math.max(2, st.percentage))}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
