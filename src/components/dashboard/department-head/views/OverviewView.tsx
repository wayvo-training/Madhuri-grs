"use client";

import { Building2, RefreshCw } from "lucide-react";
import type {
  DepartmentMetricsSummary,
  EscalationAuditRecord,
  GrievanceItem,
  StaffMember,
} from "@/types/department-head";
import {
  AttentionRequiredPanel,
  OverviewMetricsSection,
  RecentActivityPanel,
  TeamCapacityPanel,
} from "./overview-panels";

export interface OverviewViewProps {
  currentDepartmentName: string;
  currentHodName: string;
  currentHodEmail: string;
  currentEmployeeCode: string;
  totalGrievanceCount: number;
  metrics: DepartmentMetricsSummary;
  attentionRequiredList: GrievanceItem[];
  staffList: StaffMember[];
  governanceAuditFeed: EscalationAuditRecord[];
  isRefreshing: boolean;
  onRefresh: () => void;
  onViewQueue: () => void;
  onViewStaff: () => void;
  onViewActivity: () => void;
  onInspectGrievance: (
    item: GrievanceItem,
    tab?: "progress" | "statement",
  ) => void;
}

export function OverviewView({
  currentDepartmentName,
  currentHodName,
  currentHodEmail,
  currentEmployeeCode,
  totalGrievanceCount,
  metrics,
  attentionRequiredList,
  staffList,
  governanceAuditFeed,
  isRefreshing,
  onRefresh,
  onViewQueue,
  onViewStaff,
  onViewActivity,
  onInspectGrievance,
}: OverviewViewProps) {
  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* 1. Department Header Banner */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white px-4 py-3 sm:px-5 sm:py-3.5 shadow-xs">
        <div className="relative z-10 flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 border border-teal-100 text-teal-700">
              <Building2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900 leading-tight">
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
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onViewQueue}
              className="rounded-lg bg-[#0F766E] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#115E59] transition"
            >
              Manage Full Queue ({totalGrievanceCount}) &rarr;
            </button>
          </div>
        </div>
      </div>

      <OverviewMetricsSection
        unassignedCount={metrics.unassignedCount}
        inProgressCount={metrics.inProgressCount}
        slaAtRiskCount={metrics.slaAtRiskCount}
        escalatedCount={metrics.escalatedCount}
      />

      <AttentionRequiredPanel
        attentionRequiredList={attentionRequiredList}
        onInspect={onInspectGrievance}
        onViewFullQueue={onViewQueue}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-start">
        <TeamCapacityPanel
          staffList={staffList}
          onViewFullRoster={onViewStaff}
        />
        <RecentActivityPanel
          governanceAuditFeed={governanceAuditFeed}
          onViewFullActivity={onViewActivity}
        />
      </div>
    </div>
  );
}
