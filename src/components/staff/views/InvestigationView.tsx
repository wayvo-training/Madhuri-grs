"use client";

import {
  Clock,
  Eye,
  FileCheck2,
  FileSearch,
  FileText,
  RotateCcw,
  Search,
} from "lucide-react";
import { ActionMenu } from "@/components/ui/action-menu";
import { Pagination } from "@/components/ui/pagination";
import { SortableTh } from "@/components/ui/sortable-table-head";
import { usePagination } from "@/hooks/usePagination";
import { useTableSort } from "@/hooks/useTableSort";
import type { StaffGrievanceItem } from "@/types/staff";

interface InvestigationViewProps {
  grievances: StaffGrievanceItem[];
  onExamine: (
    grievance: StaffGrievanceItem,
    initialTab?: "statement" | "investigation" | "resolution",
  ) => void;
  onResolve: (grievance: StaffGrievanceItem) => void;
}

export function InvestigationView({
  grievances,
  onExamine,
  onResolve,
}: InvestigationViewProps) {
  const activeCases = grievances.filter((g) => g.status !== "CLOSED");

  const {
    sortState,
    handleSort,
    sortedItems: sortedActiveCases,
  } = useTableSort(activeCases);

  const pagination = usePagination(sortedActiveCases, {
    initialPageSize: 10,
    pageSizeOptions: [5, 10, 20],
  });

  return (
    <div className="space-y-5">
      {/* Header Banner & Instructions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Investigation &amp; Inquiry Desk
            </h2>
            <p className="text-sm text-slate-500">
              Conduct inquiries, collate evidence, request additional user
              information, log internal case notes, and record investigation
              findings before drafting formal resolution.
            </p>
          </div>
        </div>

        {/* Quick Protocol Guidelines */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-sm text-slate-600">
          <div className="flex items-start gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ECFEFF] text-[13px] font-bold text-[#0E7490] dark:bg-cyan-500/20 dark:text-cyan-400">
              1
            </span>
            <span>
              Examine submitter documentation and categorize issue context.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[13px] font-bold text-amber-800 dark:bg-amber-500/20 dark:text-amber-400">
              2
            </span>
            <span>
              Request additional complainant proofs or log internal notes.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[13px] font-bold text-purple-800 dark:bg-purple-500/20 dark:text-purple-400">
              3
            </span>
            <span>
              Prepare formal resolution report for Department Head review.
            </span>
          </div>
        </div>
      </div>

      {/* Active Investigation Cases as a TABLE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-blue-600" />
            Active Investigation Cases ({activeCases.length})
          </h3>
          <span className="text-sm text-slate-500 font-medium">
            Max Active Limit: 10
          </span>
        </div>

        {activeCases.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3">
            <Search className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-700">
              No Cases Currently Under Investigation
            </h4>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              All assigned grievances are up to date. Once new grievances are
              routed and assigned to your desk, you can begin inquiries and log
              case notes here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-2xs">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800/60 bg-slate-50/80 text-[13px] font-bold uppercase tracking-wider text-slate-500">
                  <SortableTh
                    field="grievanceNumber"
                    currentSort={sortState}
                    onSort={handleSort}
                    className="py-3 px-3.5"
                  >
                    Grievance ID
                  </SortableTh>
                  <SortableTh
                    field="title"
                    currentSort={sortState}
                    onSort={handleSort}
                    className="py-3 px-3.5"
                  >
                    Summary
                  </SortableTh>
                  <th className="py-3 px-3 text-slate-500 font-bold uppercase tracking-wider text-[13px] text-left">
                    Reopened Status
                  </th>
                  <SortableTh
                    field="category"
                    currentSort={sortState}
                    onSort={handleSort}
                    className="py-3 px-3"
                  >
                    Category
                  </SortableTh>
                  <SortableTh
                    field="priority"
                    currentSort={sortState}
                    onSort={handleSort}
                    className="py-3 px-3"
                  >
                    Priority
                  </SortableTh>
                  <SortableTh
                    field="status"
                    currentSort={sortState}
                    onSort={handleSort}
                    className="py-3 px-3"
                  >
                    Investigation Status
                  </SortableTh>
                  <SortableTh
                    field="slaStatus"
                    currentSort={sortState}
                    onSort={handleSort}
                    className="py-3 px-3"
                  >
                    SLA
                  </SortableTh>
                  <th className="py-3 px-3">Last Activity</th>
                  <th className="py-3 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60">
                {pagination.paginatedItems.map((item) => {
                  const isBreached = item.slaStatus === "BREACHED";
                  const isAtRisk = item.slaStatus === "AT_RISK";
                  const isReopened =
                    item.reopenCount > 0 || item.status === "REOPENED";
                  const isAssigned = item.status === "ASSIGNED";
                  const isInProgress = item.status === "IN_PROGRESS";
                  const isWaitingOnUser = item.status === "WAITING_ON_USER";
                  const isUnderReview = item.status === "UNDER_REVIEW";

                  const lastActivityTime =
                    item.auditTrail?.[0]?.relativeTime ||
                    item.assignedAt ||
                    item.submittedAt;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 transition"
                    >
                      {/* Grievance Number */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="font-mono text-sm font-bold text-slate-900">
                          {item.grievanceNumber}
                        </span>
                      </td>

                      {/* Summary */}
                      <td className="py-3 px-3.5 max-w-[200px]">
                        <span
                          className="font-medium text-slate-900 line-clamp-2"
                          title={item.title}
                        >
                          {item.title}
                        </span>
                      </td>

                      {/* Reopened Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {isReopened ? (
                          <span className="inline-flex items-center gap-0.5 text-[13px] font-bold text-slate-900">
                            Reopened ({item.reopenCount})
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 text-slate-900 truncate max-w-[140px]">
                        {item.category}
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-3">
                        <span className="text-[13px] font-medium text-slate-900">
                          {item.priority === "CRITICAL"
                            ? "Critical"
                            : item.priority === "HIGH"
                              ? "High"
                              : item.priority === "MEDIUM"
                                ? "Medium"
                                : "Low"}
                        </span>
                      </td>

                      {/* Investigation Status */}
                      <td className="py-3 px-3">
                        {isWaitingOnUser ? (
                          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Waiting on User
                          </span>
                        ) : isInProgress ? (
                          <span className="inline-block text-[13px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                            In Progress
                          </span>
                        ) : isAssigned ? (
                          <span className="inline-block text-[13px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60">
                            Assigned
                          </span>
                        ) : isUnderReview ? (
                          <span className="inline-block text-[13px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/60">
                            Under Review
                          </span>
                        ) : (
                          <span className="inline-block text-[13px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {item.status}
                          </span>
                        )}
                      </td>

                      {/* SLA */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-900">
                          <Clock className="w-3.5 h-3.5 text-slate-900" />
                          {isBreached
                            ? "SLA Breached"
                            : isAtRisk
                              ? "SLA At Risk"
                              : "Within SLA"}
                        </span>
                      </td>

                      {/* Last Activity */}
                      <td className="py-3 px-3 text-slate-900 whitespace-nowrap text-[13px]">
                        {lastActivityTime}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <ActionMenu
                          widthClass="w-52"
                          items={[
                            ...(isInProgress
                              ? [
                                  {
                                    label: "Submit Resolution",
                                    icon: (
                                      <FileCheck2 className="h-3.5 w-3.5 text-[#0F766E]" />
                                    ),
                                    variant: "primary" as const,
                                    onClick: () => onResolve(item),
                                  },
                                ]
                              : []),
                            ...(isWaitingOnUser
                              ? [
                                  {
                                    label: "View Inquiries / Response",
                                    icon: (
                                      <Eye className="h-3.5 w-3.5 text-amber-700" />
                                    ),
                                    variant: "warning" as const,
                                    onClick: () =>
                                      onExamine(item, "investigation"),
                                  },
                                ]
                              : []),
                            ...(isUnderReview
                              ? [
                                  {
                                    label: "View Resolution Record",
                                    icon: (
                                      <FileText className="h-3.5 w-3.5 text-slate-500" />
                                    ),
                                    onClick: () =>
                                      onExamine(item, "resolution"),
                                  },
                                ]
                              : []),
                            {
                              label: "Examine Details",
                              icon: (
                                <Eye className="h-3.5 w-3.5 text-slate-500" />
                              ),
                              onClick: () => onExamine(item, "statement"),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalCount={pagination.totalCount}
              pageSize={pagination.pageSize}
              onPageChange={pagination.onPageChange}
              onPageSizeChange={pagination.onPageSizeChange}
              pageSizeOptions={pagination.pageSizeOptions}
              itemLabel="investigation cases"
            />
          </div>
        )}
      </div>
    </div>
  );
}
