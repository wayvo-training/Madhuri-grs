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
      <div className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-linear-to-r from-[#064E3B] via-[#043629] to-slate-950 px-4 py-3 sm:px-5 sm:py-3.5 text-white shadow-xs">
        <div className="relative z-10 flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
              <Building2 className="h-4.5 w-4.5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-semibold tracking-tight text-white leading-tight">
                  {currentDepartmentName}
                </h2>
                <span className="rounded-md bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-2.5 font-semibold text-emerald-200">
                  Primary Queue
                </span>
              </div>
              <p className="mt-0.5 text-xs font-normal text-slate-300 leading-tight">
                Department Head:{" "}
                <strong className="font-semibold text-white">
                  {currentHodName}
                </strong>{" "}
                &bull; {currentHodEmail} &bull; Code:{" "}
                <span className="font-mono text-emerald-300">
                  {currentEmployeeCode}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3 w-3 ${
                  isRefreshing ? "animate-spin text-emerald-300" : ""
                }`}
              />
              <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
            </button>

            <button
              type="button"
              onClick={onViewQueue}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-2xs hover:bg-slate-100 transition"
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
