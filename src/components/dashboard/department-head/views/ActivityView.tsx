"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import {
  AdvancedTableSearch,
  type SearchCondition,
  type SearchFieldDef,
} from "@/components/ui/advanced-table-search";
import { Pagination } from "@/components/ui/pagination";
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

  const renderSortHeader = (label: string, field: string) => {
    const isSorted = sortState.field === field;
    const direction = isSorted ? sortState.direction : null;

    const handleToggle = () => {
      if (!isSorted) {
        handleSort(field, "asc");
      } else if (direction === "asc") {
        handleSort(field, "desc");
      } else {
        handleSort(field, null);
      }
    };

    return (
      <button
        type="button"
        onClick={handleToggle}
        className="inline-flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer group select-none text-left"
      >
        <span>{label}</span>
        <span className="shrink-0 flex items-center justify-center">
          {direction === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 font-bold" />
          ) : direction === "desc" ? (
            <ArrowDown className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 font-bold" />
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </span>
      </button>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 flex flex-col min-h-0 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 sm:p-5 shadow-xs overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
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

        <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden my-2.5">
          <div className="overflow-x-auto custom-scrollbar flex-1 min-h-0 flex flex-col">
            <div className="min-w-[800px] flex-1 min-h-0 flex flex-col">
              {/* Header row without scrollbar */}
              <div className="flex items-center w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 text-[13px] font-semibold text-slate-600 dark:text-slate-400 shrink-0">
                <div className="w-36 shrink-0 pr-3">
                  {renderSortHeader("Grievance ID", "action")}
                </div>
                <div className="flex-1 min-w-[200px] px-3">
                  {renderSortHeader("Activity", "action")}
                </div>
                <div className="w-60 shrink-0 px-3">
                  {renderSortHeader("Performed By", "actor")}
                </div>
                <div className="w-36 shrink-0 px-3">
                  {renderSortHeader("Role", "actor")}
                </div>
                <div className="w-28 shrink-0 px-3">
                  {renderSortHeader("When", "timestamp")}
                </div>
              </div>

              {/* Scrollable rows: scrollbar starts precisely below the header line */}
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-transparent">
                {paginatedFeed.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-400">
                    No activity records are available for this department yet.
                  </div>
                ) : (
                  paginatedFeed.map((feed) => {
                    const feedGrievanceRef = feed.action.includes(":")
                      ? feed.action.split(":")[0].trim()
                      : "N/A";
                    const roleLabel = feed.actor.includes("DEPARTMENT_HEAD")
                      ? "Department Head"
                      : feed.actor.includes("END_USER")
                        ? "End User"
                        : feed.actor.includes("SLA") ||
                            feed.actor.includes("SYSTEM")
                          ? "System"
                          : "Staff";

                    return (
                      <div
                        key={feed.id}
                        className="flex items-center w-full px-4 py-2.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors text-[13px]"
                      >
                        <div className="w-36 shrink-0 pr-3">
                          <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-200 block">
                            {feedGrievanceRef}
                          </span>
                        </div>
                        <div className="flex-1 min-w-[200px] px-3">
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
                        </div>
                        <div className="w-60 shrink-0 px-3 font-medium text-slate-700 dark:text-slate-300 truncate">
                          {feed.actor}
                        </div>
                        <div className="w-36 shrink-0 px-3 text-slate-500 dark:text-slate-400 truncate">
                          {roleLabel}
                        </div>
                        <div className="w-28 shrink-0 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {feed.timestamp}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 z-10 shrink-0 mt-auto pt-3 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
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
