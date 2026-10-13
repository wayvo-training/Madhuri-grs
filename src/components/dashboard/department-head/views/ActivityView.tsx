"use client";

import { ArrowDownUp } from "lucide-react";
import { useMemo, useState } from "react";
import {
  AdvancedTableSearch,
  type SearchCondition,
  type SearchFieldDef,
} from "@/components/ui/advanced-table-search";
import { Pagination } from "@/components/ui/pagination";
import { SortableTh } from "@/components/ui/sortable-table-head";
import { TruncatedText } from "@/components/ui/truncated-text";
import { useTableSort } from "@/hooks/useTableSort";
import { formatAuditFeedDetails } from "@/lib/department-head/utils";
import { evaluateSearchConditions } from "@/lib/search-evaluator";
import type { EscalationAuditRecord } from "@/types/department-head";

export interface ActivityViewProps {
  governanceAuditFeed: EscalationAuditRecord[];
}

export function ActivityView({ governanceAuditFeed }: ActivityViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [advancedConditions, setAdvancedConditions] = useState<
    SearchCondition[]
  >([]);
  const [advancedMode, setAdvancedMode] = useState<string>("AND");

  const filterFields: SearchFieldDef[] = [
    { id: "grievanceId", label: "Grievance ID", type: "text" },
    { id: "actor", label: "Performed By", type: "text" },
    {
      id: "role",
      label: "Role",
      type: "select",
      options: [
        { label: "Department Head", value: "DEPARTMENT_HEAD" },
        { label: "End User", value: "END_USER" },
        { label: "System", value: "SYSTEM" },
        { label: "Staff", value: "STAFF" },
      ],
    },
    { id: "search", label: "Global Search", type: "text" },
  ];

  const handleSearchChange = (conditions: SearchCondition[], mode: string) => {
    setAdvancedConditions(conditions);
    setAdvancedMode(mode);
    setCurrentPage(1);
  };

  const filteredFeed = useMemo(() => {
    return governanceAuditFeed.filter((a) => {
      const feedGrievanceRef = a.action.includes(":")
        ? a.action.split(":")[0].trim()
        : "N/A";
      const computedRole = a.actor.includes("DEPARTMENT_HEAD")
        ? "DEPARTMENT_HEAD"
        : a.actor.includes("END_USER")
          ? "END_USER"
          : a.actor.includes("SLA") || a.actor.includes("SYSTEM")
            ? "SYSTEM"
            : "STAFF";

      return evaluateSearchConditions(
        { ...a, grievanceId: feedGrievanceRef, role: computedRole },
        advancedConditions,
        advancedMode,
      );
    });
  }, [governanceAuditFeed, advancedConditions, advancedMode]);

  const {
    sortState,
    handleSort,
    sortedItems: sortedFeed,
  } = useTableSort(filteredFeed, {
    field: "timestamp",
    direction: "desc",
  });

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedFeed = sortedFeed.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="shrink-0">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Department Head Activity / Audit
            </h3>
            <p className="text-sm font-normal text-slate-500 dark:text-slate-400 max-w-sm">
              Historical governance events, staff actions, interventions, and
              SLA-related changes across this department.
            </p>
          </div>
          <div className="flex-1 min-w-0 w-full">
            <AdvancedTableSearch
              fields={filterFields}
              onSearch={handleSearchChange}
              className="w-full"
            />
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 text-[13px] font-semibold text-slate-600 dark:text-slate-400">
              <tr>
                <SortableTh
                  field="action"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-2.5 pl-4 pr-3 whitespace-nowrap"
                >
                  Grievance ID
                </SortableTh>
                <SortableTh
                  field="action"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-2.5 px-3 whitespace-nowrap"
                >
                  Activity
                </SortableTh>
                <SortableTh
                  field="actor"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-2.5 px-3 whitespace-nowrap"
                >
                  Performed By
                </SortableTh>
                <SortableTh
                  field="actor"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-2.5 px-3 whitespace-nowrap"
                >
                  Role
                </SortableTh>
                <SortableTh
                  field="timestamp"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-2.5 px-3 whitespace-nowrap"
                >
                  When
                </SortableTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-transparent text-slate-700 dark:text-slate-300">
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
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-2.5 pl-4 pr-3 align-middle whitespace-nowrap">
                        <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-200 block">
                          {feedGrievanceRef}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 align-middle whitespace-nowrap max-w-md">
                        <TruncatedText
                          text={feed.action}
                          fullText={
                            formatAuditFeedDetails(feed.details)
                              ? `${feed.action} • ${formatAuditFeedDetails(feed.details)}`
                              : feed.action
                          }
                          maxChars={50}
                          className="font-semibold text-slate-800 dark:text-slate-200 text-[13px] border-none truncate whitespace-nowrap block"
                        />
                      </td>
                      <td className="py-2.5 px-3 align-middle whitespace-nowrap text-[13px] font-medium text-slate-700 dark:text-slate-300">
                        {feed.actor}
                      </td>
                      <td className="py-2.5 px-3 align-middle whitespace-nowrap text-[13px] text-slate-500 dark:text-slate-400">
                        {feed.actor.includes("DEPARTMENT_HEAD")
                          ? "Department Head"
                          : feed.actor.includes("END_USER")
                            ? "End User"
                            : feed.actor.includes("SLA") ||
                                feed.actor.includes("SYSTEM")
                              ? "System"
                              : "Staff"}
                      </td>
                      <td className="py-2.5 px-3 align-middle whitespace-nowrap text-[13px] text-slate-500 dark:text-slate-400">
                        {feed.timestamp}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200/80 dark:border-slate-800">
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
