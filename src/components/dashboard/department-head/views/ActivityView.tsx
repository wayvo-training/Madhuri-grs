"use client";

import { useState } from "react";
import { ArrowDownUp } from "lucide-react";
import { formatAuditFeedDetails } from "@/lib/department-head/utils";
import type { EscalationAuditRecord } from "@/types/department-head";
import { Pagination } from "@/components/ui/pagination";
import { SortableTh } from "@/components/ui/sortable-table-head";
import { useTableSort } from "@/hooks/useTableSort";

export interface ActivityViewProps {
  governanceAuditFeed: EscalationAuditRecord[];
}

export function ActivityView({
  governanceAuditFeed,
}: ActivityViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const {
    sortState,
    handleSort,
    sortedItems: sortedFeed,
  } = useTableSort(governanceAuditFeed, { field: "timestamp", direction: "desc" });

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedFeed = sortedFeed.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Department Head Activity / Audit
            </h3>
            <p className="text-sm font-normal text-slate-500">
              Historical governance events, staff actions, interventions, and
              SLA-related changes across this department.
            </p>
          </div>
          </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead className="border-b border-slate-200/80 bg-slate-50/80 text-[13px] font-semibold text-slate-600">
              <tr>
                <SortableTh
                  field="action"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-3 pl-4 pr-3 whitespace-nowrap"
                >
                  Grievance
                </SortableTh>
                <SortableTh
                  field="action"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-3 px-3 whitespace-nowrap"
                >
                  Activity
                </SortableTh>
                <SortableTh
                  field="actor"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-3 px-3 whitespace-nowrap"
                >
                  Performed By
                </SortableTh>
                <SortableTh
                  field="actor"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-3 px-3 whitespace-nowrap"
                >
                  Role
                </SortableTh>
                <SortableTh
                  field="timestamp"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-3 px-3 whitespace-nowrap"
                >
                  When
                </SortableTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedFeed.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-sm text-slate-400"
                  >
                    No activity records are available for this department yet.
                  </td>
                </tr>
              ) : (
                paginatedFeed.map((feed) => {
                  const feedGrievanceRef = feed.action.includes(":")
                    ? feed.action.split(":")[0].trim()
                    : "N/A";

                  return (
                    <tr
                      key={feed.id}
                      className="align-top hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 pl-4 pr-3 whitespace-nowrap">
                        <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-200 block">
                          {feedGrievanceRef}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-800 text-[13px]">
                            {feed.action}
                          </div>
                          <div className="text-[13px] leading-relaxed text-slate-500">
                            {formatAuditFeedDetails(feed.details)}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-[13px] font-medium text-slate-700">
                        {feed.actor}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-[13px] text-slate-500">
                        {feed.actor.includes("DEPARTMENT_HEAD")
                          ? "Department Head"
                          : feed.actor.includes("END_USER")
                            ? "End User"
                            : feed.actor.includes("SLA") || feed.actor.includes("SYSTEM")
                              ? "System"
                              : "Staff"}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-[13px] text-slate-500">
                        {feed.timestamp}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200/80">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(sortedFeed.length / pageSize)}
            totalCount={sortedFeed.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 20, 50]}
            itemLabel="activities"
          />
        </div>
      </div>
    </div>
  );
}
