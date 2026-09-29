"use client";

import {
  AlertCircle,
  Clock,
  Eye,
  FileCheck,
  Flame,
  RotateCcw,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { StatusBadge } from "@/components/dashboard/badges";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActionMenu } from "@/components/ui/action-menu";
import { requiresHeadResolutionReview } from "@/lib/department-head/filters";
import { Pagination } from "@/components/ui/pagination";
import { useState, useMemo, useEffect } from "react";
import type {
  CaseDrawerTab,
  DepartmentMetricsSummary,
  GrievanceItem,
} from "@/types/department-head";

export interface SlaGovernanceViewProps {
  grievances: GrievanceItem[];
  metrics: DepartmentMetricsSummary;
  onInspect: (item: GrievanceItem, tab?: CaseDrawerTab) => void;
  onIntervene: (item: GrievanceItem) => void;
  onReviewResolution: (item: GrievanceItem) => void;
  onAssign: (item: GrievanceItem, currentStaffId?: string) => void;
}

export function SlaGovernanceView({
  grievances,
  metrics,
  onInspect,
  onIntervene,
  onReviewResolution,
  onAssign,
}: SlaGovernanceViewProps) {
  const escalatedList = grievances.filter((g) => {
    return (
      g.status === "ESCALATED" ||
      g.hodIntervention ||
      g.status === "UNDER_REVIEW" ||
      g.slaStatus === "BREACHED" ||
      (g.submittedResolution && requiresHeadResolutionReview(g))
    );
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [escalatedList.length]);

  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return escalatedList.slice(start, start + pageSize);
  }, [escalatedList, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="SLA Breached"
          value={grievances.filter((g) => g.slaStatus === "BREACHED").length}
          icon={AlertCircle}
          accentColor="rose"
          description="Exceeded maximum SLA duration"
        />
        <StatCard
          label="SLA At Risk"
          value={grievances.filter((g) => g.slaStatus === "AT_RISK").length}
          icon={Clock}
          accentColor="amber"
          description="Approaching deadline threshold"
        />
        <StatCard
          label="Active Escalations"
          value={metrics.escalatedCount}
          icon={Flame}
          accentColor="rose"
          description="Requires Department Head action"
        />
        <StatCard
          label="Reopened Grievances"
          value={metrics.reopenedCount}
          icon={RotateCcw}
          accentColor="amber"
          description="Submitters contesting resolution"
        />
      </div>

      {/* SLA & ESCALATIONS QUEUE */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Escalation & SLA Governance
              </h3>
              <p className="text-xs font-normal text-slate-500">
                Review escalated grievances, monitor SLA breaches, and take
                corrective intervention when required.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            {
              grievances.filter(
                (g) =>
                  g.status === "ESCALATED" ||
                  g.hodIntervention ||
                  g.status === "UNDER_REVIEW",
              ).length
            }{" "}
            Managed Cases
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-semibold text-slate-600">
              <tr>
                <th className="py-3 pl-4 pr-3 whitespace-nowrap">Grievance</th>
                <th className="py-3 px-3 whitespace-nowrap">Category</th>
                <th className="py-3 px-3 whitespace-nowrap">Sub Category</th>
                <th className="py-3 px-3 whitespace-nowrap">SLA</th>
                <th className="py-3 px-3 whitespace-nowrap">Escalation</th>
                <th className="py-3 px-3 whitespace-nowrap">Assigned Staff</th>
                <th className="py-3 px-3 whitespace-nowrap">Status</th>
                <th className="py-3 pl-3 pr-4 text-right whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {escalatedList.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-10 text-center text-slate-500 text-xs"
                  >
                    No active escalations requiring intervention.
                  </td>
                </tr>
              ) : (
                paginatedList.map((item) => {
                  const isEscalated = item.status === "ESCALATED";
                  const isUnderIntervention =
                    item.status === "IN_PROGRESS" && item.hodIntervention;
                  const needsReview = requiresHeadResolutionReview(item);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 transition"
                    >
                      <td className="py-3 pl-4 pr-3 align-top">
                        <div className="space-y-1">
                          <span className="inline-block font-mono text-[11px] font-semibold text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/70">
                            {item.ticketCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => onInspect(item, "statement")}
                            className="block text-left text-xs font-semibold text-slate-900 hover:text-emerald-900 transition"
                          >
                            {item.title}
                          </button>
                        </div>
                      </td>
                      
                      <td className="py-3 px-3 align-top text-xs font-medium text-slate-700">
                        {item.category}
                      </td>
                      
                      <td className="py-3 px-3 align-top text-[11px] text-slate-500">
                        {item.subcategory}
                      </td>

                      <td className="py-3 px-3 align-top">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`inline-flex rounded px-2 py-0.5 text-[10px] font-medium border ${
                              item.slaStatus === "BREACHED"
                                ? "border-amber-200 bg-amber-50 text-amber-900"
                                : item.slaStatus === "AT_RISK"
                                  ? "border-amber-200 bg-amber-50 text-amber-800"
                                  : "border-slate-200 bg-slate-100 text-slate-600"
                            }`}
                          >
                            {item.slaTimeLeft}
                          </span>
                          {item.slaStatus === "BREACHED" && (
                            <span className="text-[10px] font-semibold text-amber-800">
                              Breached
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 align-top">
                        <div className="flex flex-col items-start gap-1">
                          {isEscalated ? (
                            <span className="w-fit inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800 shadow-2xs dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30">
                              Escalated
                            </span>
                          ) : isUnderIntervention ? (
                            <span className="w-fit inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800 shadow-2xs dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30">
                              Under Intervention
                            </span>
                          ) : needsReview ? (
                            <span className="w-fit inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800 shadow-2xs dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30">
                              Review Required
                            </span>
                          ) : (
                            <span className="w-fit inline-flex items-center rounded-full border border-slate-200 bg-slate-100/90 px-2.5 py-0.5 text-[10px] font-medium text-slate-700 shadow-2xs dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600">
                              Monitor
                            </span>
                          )}
                          {item.hodIntervention && (
                            <span className="text-[10px] text-slate-500 max-w-[210px] leading-tight">
                              {item.hodIntervention.actionLabel}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 align-top">
                        <span className="text-xs text-slate-700">
                          {item.assignedStaffName || "Unassigned"}
                        </span>
                      </td>

                      <td className="py-3 px-3 align-top">
                        <StatusBadge status={item.status} />
                      </td>

                      <td className="py-3 pl-3 pr-4 text-right align-top">
                        <ActionMenu
                          widthClass="w-40"
                          items={[
                            {
                              label: "Inspect",
                              icon: <Eye className="h-3.5 w-3.5" />,
                              onClick: () => onInspect(item, "progress"),
                            },
                            ...(needsReview && item.submittedResolution
                              ? [
                                  {
                                    label: "Review",
                                    icon: <FileCheck className="h-3.5 w-3.5" />,
                                    variant: "default" as const,
                                    onClick: () => onReviewResolution(item),
                                  },
                                ]
                              : []),
                            ...(isEscalated
                              ? [
                                  {
                                    label: "Intervene",
                                    icon: (
                                      <AlertCircle className="h-3.5 w-3.5" />
                                    ),
                                    variant: "warning" as const,
                                    onClick: () => onIntervene(item),
                                  },
                                ]
                              : []),
                            ...(item.status === "CLOSED" ||
                            item.status === "RESOLVED"
                              ? []
                              : item.assignedStaffName || item.assignedStaffId
                                ? [
                                    {
                                      label: "Change Assignment",
                                      icon: (
                                        <UserCheck className="h-3.5 w-3.5" />
                                      ),
                                      variant: "default" as const,
                                      onClick: () =>
                                        onAssign(
                                          item,
                                          item.assignedStaffId || "",
                                        ),
                                    },
                                  ]
                                : [
                                    {
                                      label: "Assign",
                                      icon: (
                                        <UserPlus className="h-3.5 w-3.5" />
                                      ),
                                      variant: "default" as const,
                                      onClick: () => onAssign(item),
                                    },
                                  ]),
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(escalatedList.length / pageSize)}
            totalCount={escalatedList.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 20, 50]}
            itemLabel="escalations"
          />
        </div>
      </div>
    </div>
  );
}
