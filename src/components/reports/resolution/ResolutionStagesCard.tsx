"use client";

import { CheckCircle2, Clock, FileCheck, FileText, Layers } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs shrink-0">
      <CardHeader className="pb-1 pt-2 px-3 sm:px-3.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            <Layers className="h-3.5 w-3.5" />
          </div>
          <div>
            <CardTitle className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
              Resolution Workflow Stages
            </CardTitle>
            <CardDescription className="text-[11px] text-slate-500 dark:text-slate-400">
              Distinct resolution milestones from draft submission to final
              closure
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3 sm:px-3.5 pb-2 pt-0">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {stages.map((st) => (
            <div
              key={st.stage}
              className="flex flex-col justify-between rounded-lg border border-slate-100 bg-slate-50/60 p-2 dark:border-slate-800 dark:bg-slate-800/40"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                    {st.label}
                  </span>
                  {getStageIcon(st.stage)}
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-lg font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100">
                    {st.count.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    ({st.percentage}%)
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                  {st.description}
                </p>
              </div>

              <div className="mt-1.5 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden dark:bg-slate-700">
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
      </CardContent>
    </Card>
  );
}
