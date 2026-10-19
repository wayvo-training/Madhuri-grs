"use client";

import { Building2 } from "lucide-react";
import type {
  DepartmentMetricsSummary,
  EscalationAuditRecord,
  GrievanceItem,
  StaffMember,
} from "@/types/department-head";
import { GrievancePieCharts } from "./GrievancePieCharts";
import { AttentionRequiredPanel } from "./overview-panels";

export interface OverviewViewProps {
  currentDepartmentName: string;
  currentHodName: string;
  currentHodEmail: string;
  currentEmployeeCode: string;
  metrics: DepartmentMetricsSummary;
  attentionRequiredList: GrievanceItem[];
  grievances: GrievanceItem[];
  staffList: StaffMember[];
  governanceAuditFeed: EscalationAuditRecord[];
  isLoading?: boolean;
  onViewQueue: () => void;
  onViewStaff: () => void;
  onViewActivity: () => void;
  onInspectGrievance: (
    item: GrievanceItem,
    tab?: "progress" | "statement",
  ) => void;
  onFilterQueue?: (filterType: "status" | "priority", value: string) => void;
}

export function OverviewView({
  currentDepartmentName,
  currentHodName,
  currentHodEmail,
  currentEmployeeCode,
  metrics: _metrics,
  attentionRequiredList,
  grievances,
  staffList: _staffList,
  governanceAuditFeed: _governanceAuditFeed,
  isLoading = false,
  onViewQueue,
  onViewStaff: _onViewStaff,
  onViewActivity: _onViewActivity,
  onInspectGrievance,
  onFilterQueue,
}: OverviewViewProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 gap-2.5 sm:gap-3">
      {/* 1. Department Header Banner */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white px-4 py-2 sm:px-5 sm:py-2.5 shadow-xs shrink-0">
        <div className="relative z-10 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 border border-teal-100 text-teal-700">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              {isLoading ? (
                <div className="space-y-1 animate-pulse">
                  <div className="h-4 w-40 bg-slate-200 rounded" />
                  <div className="h-3 w-64 bg-slate-100 rounded" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-semibold tracking-tight text-slate-900 leading-tight">
                      {currentDepartmentName}
                    </h2>
                    <span className="rounded-md bg-teal-50 border border-teal-200 px-2 py-0.5 text-2.5 font-semibold text-teal-800">
                      Primary Queue
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs font-normal text-slate-500 leading-tight">
                    Department Head:{" "}
                    <strong className="font-semibold text-slate-700">
                      {currentHodName}
                    </strong>{" "}
                    &bull; {currentHodEmail} &bull; Code:{" "}
                    <span className="font-mono text-slate-600">
                      {currentEmployeeCode}
                    </span>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0">
        <GrievancePieCharts
          grievances={grievances}
          isLoading={isLoading}
          onFilterQueue={onFilterQueue}
        />
      </div>

      <AttentionRequiredPanel
        attentionRequiredList={attentionRequiredList}
        isLoading={isLoading}
        onInspect={onInspectGrievance}
        onViewFullQueue={onViewQueue}
      />
    </div>
  );
}
